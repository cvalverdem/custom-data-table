import * as SDK from "azure-devops-extension-sdk";
import type { IWorkItemFormService } from "azure-devops-extension-api/WorkItemTracking";

import "./styles.css";

/* ───────────────────────── Types & constants ───────────────────────── */

type DataType = "string" | "textarea" | "number" | "boolean" | "date" | "dropdown";

interface ColumnDefinition {
  id: string;
  name: string;
  dataType: DataType;
  required: boolean;
  width: string;
  defaultValue?: unknown;
  options: string[]; // For dropdown type
  defaultFromPrevious?: string; // new rows take this column's value from the previous row
}

interface ValidationRule {
  type: string;          // "dateOrder"
  startColumnId?: string;
  endColumnId?: string;
  start?: string;        // alias for startColumnId
  end?: string;          // alias for endColumnId
  message?: string;
}

const ROW_ACTIONS = ["move", "duplicate", "insert", "delete"] as const;
type RowAction = typeof ROW_ACTIONS[number];

interface TableConfiguration {
  columns: ColumnDefinition[];
  rules: ValidationRule[];
  readOnlyStates: string[];  // work item states (System.State) in which the table is locked
  rowActions: RowAction[];   // per-row controls to show; all of them unless configured
  blockSaveOnError: boolean; // block saving the work item while an edited table is invalid
}

type Row = { _id: number; [columnId: string]: unknown };

const WORK_ITEM_FORM_SERVICE = "ms.vss-work-web.work-item-form";
const DEFAULT_FIELD = "Custom.DataTableJSON";
const REQUIRED_MESSAGE = "Debe completar todos los campos";
const CALENDAR_ICON_WIDTH = 28; // px at the right edge of a date field that open the calendar
const DATE_ORDER_MESSAGE = "La fecha inicial debe ser menor que la fecha final";
const DROPDOWN_PLACEHOLDER = "— Seleccione —";
const FORM_ERROR_PREFIX = "Tabla de datos: ";

let workItemService: IWorkItemFormService | null = null;
let dataFieldRefName = DEFAULT_FIELD;
let tableConfig: TableConfiguration = defaultConfig();

/** Guards to stop bad writes */
let isLoadingData = false;       // don't react to input events while rendering
let lastSyncedPayload = "";      // what the field holds (or is being written) from this table

/** Form-level error that blocks saving the work item while the table is invalid */
let tableTouched = false;        // only block saving once the user edited this work item's table
let formError = "";

/** Locking: the form is read-only, or the work item is in one of the configured readOnlyStates */
let formReadOnly = false;
let lockReason = "";             // non-empty while the table is locked

let syncTimeout: number | undefined;

/* ───────────────────────── DOM helpers ───────────────────────── */

const tbody = () => document.querySelector<HTMLTableSectionElement>("#gridTable tbody")!;

function setStatus(msg: string) {
  const el = document.getElementById("status");
  if (el) el.textContent = msg;
}

function setValidationMessage(message: string) {
  const el = document.getElementById("validationMessage");
  if (el) el.textContent = message || "";
}

/* ───────────────────────── Utility functions ───────────────────────── */

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function normalizeDataType(type: unknown): DataType {
  const raw = String(type || "string").trim().toLowerCase();
  if (["string", "textarea", "number", "boolean", "date", "dropdown"].includes(raw)) return raw as DataType;
  return "string";
}

/** Converts any stored date into the yyyy-MM-ddTHH:mm local value used by datetime-local inputs. */
function toLocalDateTimeValue(value: unknown): string {
  if (!value) return "";
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) return raw;

  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }

  return raw.replace(" ", "T").substring(0, 16);
}

function valueOrDefault(value: unknown, column: ColumnDefinition): unknown {
  return value != null && value !== "" ? value : column.defaultValue;
}

/* ───────────────────────── Configuration ───────────────────────── */

function witInputs(): { [key: string]: any } {
  const cfg = SDK.getConfiguration() as any;
  return cfg?.witInputs || {};
}

/* Prefer picker → manual → default (survives Options tab flakiness) */
function getConfiguredField(): string {
  const inputs = witInputs();
  const picker = String(inputs.DataFieldRefName || "").trim();
  const manual = String(inputs.DataFieldRefNameText || "").trim();
  return picker || manual || DEFAULT_FIELD;
}

function defaultConfig(): TableConfiguration {
  return {
    columns: [
      { id: "descripcion", name: "Descripción", dataType: "textarea", required: true, width: "55%", options: [] },
      { id: "responsable", name: "Responsable", dataType: "string", required: true, width: "25%", options: [] },
      { id: "fechaInicio", name: "Fecha y hora inicio", dataType: "date", required: true, width: "10%", options: [] },
      { id: "fechaFin", name: "Fecha y hora fin", dataType: "date", required: true, width: "10%", options: [] }
    ],
    rules: [],
    readOnlyStates: [],
    rowActions: [...ROW_ACTIONS],
    blockSaveOnError: true
  };
}

/* Get column configuration from extension inputs; empty means the default table.
   A broken configuration throws instead of falling back: rendering other columns and saving
   would silently drop the data of the real ones in every work item someone edits. */
function getConfiguredTable(): TableConfiguration {
  const raw = String(witInputs().ColumnConfiguration || "").trim();
  if (!raw) return defaultConfig();

  let candidate: any;
  try {
    candidate = JSON.parse(raw);
  } catch (e: any) {
    throw new Error(`el JSON no es válido (${e?.message || e})`);
  }

  if (!Array.isArray(candidate?.columns) || !candidate.columns.length) {
    throw new Error('falta la lista "columns" o está vacía');
  }

  const columns: ColumnDefinition[] = candidate.columns.map((col: any, i: number): ColumnDefinition => {
    const id = String(col?.id ?? "").trim();
    if (!id) throw new Error(`la columna ${i + 1} no tiene "id"`);
    // true = same column; "otherId" = that column of the previous row
    const fromPrevious = col?.defaultFromPrevious === true ? id : String(col?.defaultFromPrevious ?? "").trim();
    return {
      id,
      name: String(col?.name || id).trim(),
      dataType: normalizeDataType(col?.dataType),
      required: !!col?.required,
      width: col?.width || "",
      defaultValue: col?.defaultValue,
      options: Array.isArray(col?.options) ? col.options.map(String) : [],
      defaultFromPrevious: fromPrevious && col?.defaultFromPrevious !== false ? fromPrevious : undefined
    };
  });

  const seen = new Set<string>();
  for (const col of columns) {
    if (seen.has(col.id)) throw new Error(`el id "${col.id}" está repetido`);
    seen.add(col.id);
  }
  for (const col of columns) {
    if (col.defaultFromPrevious && !seen.has(col.defaultFromPrevious)) {
      throw new Error(`"defaultFromPrevious" de la columna "${col.id}" apunta a "${col.defaultFromPrevious}", que no existe`);
    }
  }

  // ["Finalizado", "Cerrado"] or "Finalizado, Cerrado"
  const states = candidate.readOnlyStates;
  const readOnlyStates = (Array.isArray(states) ? states : typeof states === "string" ? states.split(",") : [])
    .map((s: unknown) => String(s).trim())
    .filter(Boolean);

  // ["duplicate", "delete"] or "duplicate, delete"; missing = all actions
  let rowActions: RowAction[] = [...ROW_ACTIONS];
  const actions = candidate.rowActions;
  if (actions !== undefined) {
    const list: string[] = (Array.isArray(actions) ? actions : typeof actions === "string" ? actions.split(",") : [actions])
      .map((a: unknown) => String(a).trim().toLowerCase())
      .filter(Boolean);
    const unknown = list.find(a => !(ROW_ACTIONS as readonly string[]).includes(a));
    if (unknown) throw new Error(`"rowActions" tiene una acción desconocida: "${unknown}" (válidas: ${ROW_ACTIONS.join(", ")})`);
    rowActions = ROW_ACTIONS.filter(a => list.includes(a)); // fixed display order
  }

  const blockSaveOnError = candidate.blockSaveOnError ?? true;
  if (typeof blockSaveOnError !== "boolean") {
    throw new Error('"blockSaveOnError" debe ser true o false, sin comillas');
  }

  return { columns, rules: Array.isArray(candidate.rules) ? candidate.rules : [], readOnlyStates, rowActions, blockSaveOnError };
}

/* Apply font configuration (combo inputs) to the page */
function applyFontConfiguration() {
  const inputs = witInputs();
  const fontFamily = String(inputs.FontFamily || "").trim();
  const fontSize = String(inputs.FontSize || "").trim();
  const root = document.documentElement;

  if (fontFamily && !fontFamily.includes("Default")) {
    // Add system font fallbacks for safety
    root.style.setProperty("--az-font", `${fontFamily}, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`);
  }

  if (fontSize && !fontSize.includes("Default")) {
    const parsedSize = parseInt(fontSize, 10);
    if (!isNaN(parsedSize) && parsedSize >= 8 && parsedSize <= 32) {
      root.style.setProperty("--az-font-size", `${parsedSize}px`);
    }
  }
}

/* Resolve the configured field against the work item's fields (case-insensitive, e.g. ...JSON vs ...Json) */
async function resolveFieldName(svc: IWorkItemFormService, configured: string): Promise<string | null> {
  const fields = await svc.getFields();
  const match = fields.find(f => f.referenceName.toLowerCase() === configured.toLowerCase());
  return match ? match.referenceName : null;
}

/* ───────────────────────── Rendering ───────────────────────── */

const hasAction = (action: RowAction) => tableConfig.rowActions.includes(action);
const hasActionColumn = () => hasAction("duplicate") || hasAction("insert") || hasAction("delete");

function createHeader() {
  const header = document.getElementById("gridHeaderRow")!;
  header.innerHTML = "";

  const thIndex = document.createElement("th");
  thIndex.textContent = "#";
  thIndex.style.width = hasAction("move") ? "56px" : "40px";
  header.appendChild(thIndex);

  tableConfig.columns.forEach(col => {
    const th = document.createElement("th");
    th.textContent = col.name;
    if (col.width) th.style.width = col.width;
    header.appendChild(th);
  });

  if (hasActionColumn()) {
    const thAction = document.createElement("th");
    thAction.textContent = "Acción";
    header.appendChild(thAction);
  }
}

function createControl(column: ColumnDefinition, value: unknown): HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
  const source = valueOrDefault(value, column);
  const text = source != null ? String(source) : "";
  let control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

  switch (column.dataType) {
    case "textarea": {
      control = document.createElement("textarea");
      control.value = text;
      break;
    }
    case "number": {
      const input = document.createElement("input");
      input.type = "number";
      input.step = "any";
      input.value = text;
      control = input;
      break;
    }
    case "boolean": {
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = value != null ? !!value : !!column.defaultValue;
      control = input;
      break;
    }
    case "date": {
      const input = document.createElement("input");
      input.type = "datetime-local";
      input.step = "300";
      // Without a 4-digit limit the year takes 6 digits and typing never moves on to the hour
      input.max = "9999-12-31T23:59";
      input.value = toLocalDateTimeValue(source);
      control = input;
      break;
    }
    case "dropdown": {
      const select = document.createElement("select");
      // Empty choice first so "required" can be enforced; keep stored values that are no longer
      // in the configured options so saving doesn't silently replace them
      const options = text && !column.options.includes(text) ? [...column.options, text] : column.options;
      ["", ...options].forEach(opt => {
        const option = document.createElement("option");
        option.value = opt;
        option.textContent = opt || DROPDOWN_PLACEHOLDER;
        select.appendChild(option);
      });
      select.value = text;
      control = select;
      break;
    }
    default: {
      const input = document.createElement("input");
      input.type = "text";
      input.value = text;
      control = input;
    }
  }

  control.dataset.colId = column.id;
  return control;
}

function getControl(tr: Element, columnId: string) {
  return tr.querySelector<HTMLInputElement>(`[data-col-id="${CSS.escape(columnId)}"]`);
}

function renumberRows() {
  tbody().querySelectorAll("tr").forEach((tr, idx) => {
    const num = tr.querySelector(".row-num");
    if (num) num.textContent = String(idx + 1);
  });
}

/* ───────────────────────── Row reordering ───────────────────────── */

const DRAG_HANDLE_ICON =
  '<svg width="10" height="14" viewBox="0 0 10 14" aria-hidden="true">' +
  [2, 7, 12].map(y => `<circle cx="2.5" cy="${y}" r="1.3"/><circle cx="7.5" cy="${y}" r="1.3"/>`).join("") +
  "</svg>";

/* The user added, removed or moved rows: renumber, validate and save */
function rowsChanged() {
  tableTouched = true;
  renumberRows();
  validateTable();
  scheduleAutoSync();
}

/* Drag with mouse, pen or touch: the row follows the pointer and the others make room */
function wireRowDrag(row: HTMLTableRowElement, handle: HTMLButtonElement) {
  handle.addEventListener("pointerdown", event => {
    if (event.button !== 0 || lockReason) return;
    event.preventDefault();

    // Capture on the tbody: the row (and its handle) is re-inserted while dragging, which would drop a capture held by the handle
    const body = tbody();
    body.setPointerCapture(event.pointerId);
    const startIndex = Array.from(body.children).indexOf(row);
    row.classList.add("dragging");
    document.body.classList.add("is-dragging");

    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== event.pointerId) return;
      if (e.buttons === 0) return onEnd(); // released somewhere we didn't hear about
      // Insert before the first row whose middle is below the pointer, or at the end
      const before = Array.from(body.querySelectorAll("tr")).find(tr => {
        if (tr === row) return false;
        const r = tr.getBoundingClientRect();
        return e.clientY < r.top + r.height / 2;
      });
      if (before) {
        if (row.nextElementSibling !== before) body.insertBefore(row, before);
      } else if (body.lastElementChild !== row) {
        body.appendChild(row);
      }
      renumberRows();
    };

    let ended = false;
    const onEnd = () => {
      if (ended) return; // pointerup is followed by lostpointercapture
      ended = true;
      body.removeEventListener("pointermove", onMove);
      body.removeEventListener("pointerup", onEnd);
      body.removeEventListener("pointercancel", onEnd);
      body.removeEventListener("lostpointercapture", onEnd);
      row.classList.remove("dragging");
      document.body.classList.remove("is-dragging");
      if (Array.from(body.children).indexOf(row) !== startIndex) rowsChanged();
    };

    body.addEventListener("pointermove", onMove);
    body.addEventListener("pointerup", onEnd);
    body.addEventListener("pointercancel", onEnd);
    body.addEventListener("lostpointercapture", onEnd);
  });

  // Keyboard: focus the handle and use the arrow keys
  handle.addEventListener("keydown", event => {
    if ((event.key !== "ArrowUp" && event.key !== "ArrowDown") || lockReason) return;
    event.preventDefault();
    const up = event.key === "ArrowUp";
    const sibling = up ? row.previousElementSibling : row.nextElementSibling;
    if (!sibling) return;
    tbody().insertBefore(row, up ? sibling : sibling.nextElementSibling);
    handle.focus();
    rowsChanged();
  });
}

/* ───────────────────────── Row actions ───────────────────────── */

type ButtonAction = Exclude<RowAction, "move">;

const ACTION_BUTTONS: { action: ButtonAction; label: string; icon: string }[] = [
  {
    action: "duplicate",
    label: "Duplicar fila",
    icon: '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 1h8a2 2 0 0 1 2 2v8h-1.5V3a.5.5 0 0 0-.5-.5H5z"/><path d="M3 4h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 1.5a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5V6a.5.5 0 0 0-.5-.5z"/></svg>'
  },
  {
    action: "insert",
    label: "Insertar fila debajo",
    icon: '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M7.25 2h1.5v5.25H14v1.5H8.75V14h-1.5V8.75H2v-1.5h5.25z"/></svg>'
  },
  {
    action: "delete",
    label: "Eliminar fila",
    icon: '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 1.5h4a1 1 0 0 1 1 1V3h3v1.5H2V3h3v-.5a1 1 0 0 1 1-1z"/><path d="M3.25 5.5h9.5l-.7 8.1a1.5 1.5 0 0 1-1.5 1.4H5.45a1.5 1.5 0 0 1-1.5-1.4zm3 1.75v5.75h1.25V7.25zm2.25 0v5.75h1.25V7.25z"/></svg>'
  }
];

function runRowAction(action: ButtonAction, row: HTMLTableRowElement) {
  if (lockReason) return;
  switch (action) {
    case "duplicate":
      createRow(readRow(row), row); // exact copy, right below
      break;
    case "insert": {
      // Right below; defaultFromPrevious takes its values from this row
      const added = createRow(newRowValues(row), row);
      added.querySelector<HTMLElement>("[data-col-id]")?.focus();
      break;
    }
    case "delete":
      row.remove();
      break;
  }
  rowsChanged();
}

/* Builds a row; it goes right after `after` when given, otherwise at the end */
function createRow(rowData?: Partial<Row>, after?: Element): HTMLTableRowElement {
  const body = tbody();
  const row = document.createElement("tr");

  const cellIndex = document.createElement("td");
  cellIndex.className = "row-index";
  if (hasAction("move")) {
    const handle = document.createElement("button");
    handle.type = "button";
    handle.className = "drag-handle";
    handle.title = "Arrastrar para mover la fila (o usar las flechas ↑ ↓)";
    handle.setAttribute("aria-label", "Mover fila");
    handle.innerHTML = DRAG_HANDLE_ICON;
    cellIndex.appendChild(handle);
    wireRowDrag(row, handle);
  }
  const num = document.createElement("span");
  num.className = "row-num";
  num.textContent = String(rowData?._id || body.children.length + 1);
  cellIndex.appendChild(num);
  row.appendChild(cellIndex);

  tableConfig.columns.forEach(col => {
    const cell = document.createElement("td");
    cell.appendChild(createControl(col, rowData?.[col.id]));
    row.appendChild(cell);
  });

  if (hasActionColumn()) {
    const actionCell = document.createElement("td");
    actionCell.className = "row-actions";
    for (const { action, label, icon } of ACTION_BUTTONS) {
      if (!hasAction(action)) continue;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `row-action act-${action}`;
      btn.title = label;
      btn.setAttribute("aria-label", label);
      btn.innerHTML = icon;
      btn.addEventListener("click", () => runRowAction(action, row));
      actionCell.appendChild(btn);
    }
    row.appendChild(actionCell);
  }

  if (after) after.after(row);
  else body.appendChild(row);
  return row;
}

/* ───────────────────────── Row reader ───────────────────────── */

function getControlValue(column: ColumnDefinition, control: HTMLInputElement | null): unknown {
  if (!control) return "";

  switch (column.dataType) {
    case "boolean":
      return control.checked;
    case "number": {
      const raw = String(control.value || "").trim();
      return raw === "" ? "" : Number(raw);
    }
    case "date":
      return toLocalDateTimeValue(control.value);
    default:
      return control.value;
  }
}

/* A row's values as shown (unsaved edits included) */
function readRow(tr: Element): Partial<Row> {
  const values: Partial<Row> = {};
  tableConfig.columns.forEach(col => {
    values[col.id] = getControlValue(col, getControl(tr, col.id));
  });
  return values;
}

/* Values for a new row: columns with defaultFromPrevious copy from the row it follows (the last row by default) */
function newRowValues(previous: Element | null = tbody().lastElementChild): Partial<Row> {
  const values: Partial<Row> = {};
  if (!previous) return values;

  for (const col of tableConfig.columns) {
    if (!col.defaultFromPrevious) continue;
    const source = tableConfig.columns.find(c => c.id === col.defaultFromPrevious)!;
    const value = getControlValue(source, getControl(previous, source.id));
    if (value !== "" && value != null) values[col.id] = value; // empty: fall back to defaultValue
  }
  return values;
}

function getRows(): Row[] {
  // _id first, same shape as what is already stored
  return Array.from(tbody().querySelectorAll("tr")).map((tr, idx) => ({ _id: idx + 1, ...readRow(tr) }));
}

/* ───────────────────────── Validation ───────────────────────── */

function clearValidationState() {
  document.querySelectorAll("#gridTable tbody tr").forEach(tr => tr.classList.remove("row-error"));
  document.querySelectorAll("#gridTable .field-error").forEach(el => {
    el.classList.remove("field-error");
    el.removeAttribute("title");
  });
  setValidationMessage("");
}

function markFieldError(el: Element | null, message: string) {
  if (!el) return;
  el.classList.add("field-error");
  el.setAttribute("title", message);
  el.closest("tr")?.classList.add("row-error");
}

/* Marks every row that breaks a dateOrder rule and returns the distinct messages */
function dateRuleErrors(rows: Row[]): string[] {
  const messages = new Set<string>();
  const trs = tbody().querySelectorAll("tr");
  rows.forEach((row, rowIndex) => {
    const tr = trs[rowIndex];
    for (const rule of tableConfig.rules) {
      if (!rule || String(rule.type || "").toLowerCase() !== "dateorder") continue;

      const startId = rule.startColumnId || rule.start || "";
      const endId = rule.endColumnId || rule.end || "";
      if (!startId || !endId) continue;

      const start = toLocalDateTimeValue(row[startId]);
      const end = toLocalDateTimeValue(row[endId]);
      if (!start || !end || start < end) continue;

      const message = rule.message || DATE_ORDER_MESSAGE;
      markFieldError(tr ? getControl(tr, startId) : null, message);
      markFieldError(tr ? getControl(tr, endId) : null, message);
      messages.add(message);
    }
  });
  return [...messages];
}

/* Shows (or clears) the error on top of the work item form, which also blocks saving it */
function updateFormError(message: string) {
  const next = message && tableTouched && tableConfig.blockSaveOnError ? FORM_ERROR_PREFIX + message : "";
  if (!workItemService || next === formError) return;

  formError = next;
  const request = next ? workItemService.setError(next) : workItemService.clearError();
  request.catch(e => console.error("Error al actualizar el estado del formulario:", e));
}

function validateTable(): boolean {
  clearValidationState();
  // A locked table can't be fixed, so it must never block saving the work item (e.g. while closing it)
  if (lockReason) {
    updateFormError("");
    return true;
  }

  const messages: string[] = [];
  let hasRequiredError = false;
  tbody().querySelectorAll("tr").forEach(tr => {
    tableConfig.columns.forEach(col => {
      // Checkboxes are always valid
      if (!col.required || col.dataType === "boolean") return;

      const control = getControl(tr, col.id);
      if (control && String(control.value || "").trim() === "") {
        hasRequiredError = true;
        markFieldError(control, REQUIRED_MESSAGE);
      }
    });
  });
  if (hasRequiredError) messages.push(REQUIRED_MESSAGE);
  messages.push(...dateRuleErrors(getRows()));

  const message = messages.join(" · ");
  setValidationMessage(message);
  updateFormError(message);
  return !message;
}

/* ───────────────────────── Persistence ───────────────────────── */

// The status line stays empty in normal use (as in 1.4.0) and only reports problems
async function syncToField(): Promise<boolean> {
  if (!workItemService || lockReason) return false;
  if (!validateTable()) return false;

  const payload = JSON.stringify(getRows());
  if (payload === lastSyncedPayload) return true;

  // Record the payload before awaiting, so overlapping syncs don't write twice and
  // onFieldChanged can recognize the echo of this write
  const previous = lastSyncedPayload;
  lastSyncedPayload = payload;
  try {
    const ok = await workItemService.setFieldValue(dataFieldRefName, payload);
    if (!ok) {
      lastSyncedPayload = previous;
      setStatus("No se pudo actualizar el campo");
      return false;
    }

    setStatus(""); // clear any previous error
    return true;
  } catch (e) {
    lastSyncedPayload = previous;
    console.error("Error al sincronizar la tabla:", e);
    setStatus("Error al actualizar el campo (ver consola).");
    return false;
  }
}

function scheduleAutoSync(delay = 350) {
  window.clearTimeout(syncTimeout);
  syncTimeout = window.setTimeout(() => syncToField(), delay);
}

function syncNow() {
  window.clearTimeout(syncTimeout);
  syncToField();
}

/* ───────────────────────── Locking ───────────────────────── */

async function computeLockReason(): Promise<string> {
  if (formReadOnly) return "Solo lectura: este elemento de trabajo no se puede editar";
  if (!workItemService || !tableConfig.readOnlyStates.length) return "";

  let state = "";
  try {
    // The form's current value, so the lock follows a state change before the work item is saved
    state = String((await workItemService.getFieldValue("System.State")) ?? "").trim();
  } catch (e) {
    console.error("No se pudo leer el estado del work item:", e);
    return "";
  }
  const locked = tableConfig.readOnlyStates.some(s => s.toLowerCase() === state.toLowerCase());
  return locked ? `Tabla bloqueada: el elemento está en estado «${state}»` : "";
}

/* Makes every control in the table read-only (or editable again) according to lockReason */
function applyLock() {
  const locked = !!lockReason;
  document.getElementById("app")!.classList.toggle("is-locked", locked);
  (document.getElementById("addRowBtn") as HTMLButtonElement).disabled = locked;

  tbody().querySelectorAll<HTMLElement>("input, textarea, select, button").forEach(el => {
    // Text-like fields stay readable and selectable as read-only; the rest can only be disabled
    if (el instanceof HTMLTextAreaElement || (el instanceof HTMLInputElement && el.type !== "checkbox")) {
      el.readOnly = locked;
    } else {
      (el as HTMLButtonElement | HTMLSelectElement | HTMLInputElement).disabled = locked;
    }
  });

  setStatus(""); // no notice: the read-only look speaks for itself
}

/* ───────────────────────── Loading ───────────────────────── */

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function stripHtmlTags(s: string): string {
  return s.replace(/<\/?[^>]+>/g, "").replace(/ /g, " ");
}

function extractJsonArray(s: string): string | null {
  const start = s.indexOf("[");
  const end = s.lastIndexOf("]");
  return (start !== -1 && end !== -1 && end > start) ? s.slice(start, end + 1) : null;
}

/* The field may be plain text or an HTML field that wraps/encodes the JSON; try the least invasive reading first */
function parseStoredRows(value: unknown): Partial<Row>[] {
  const raw = value == null ? "" : String(value);
  const candidates = [raw, decodeHtmlEntities(raw), decodeHtmlEntities(stripHtmlTags(raw))];

  for (const candidate of candidates) {
    const jsonText = extractJsonArray(candidate);
    if (!jsonText) continue;
    try {
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed)) return parsed.filter(r => r && typeof r === "object");
    } catch { /* try next candidate */ }
  }
  return [];
}

async function load() {
  if (!workItemService) return;
  // A pending sync belongs to the table being replaced (possibly another work item)
  window.clearTimeout(syncTimeout);
  try {
    const value = await workItemService.getFieldValue(dataFieldRefName);
    lockReason = await computeLockReason();

    isLoadingData = true;
    tableTouched = false;
    tbody().innerHTML = "";
    parseStoredRows(value).forEach(row => createRow(row));
    // Baseline on what the table would write, so just opening the work item doesn't dirty it
    lastSyncedPayload = JSON.stringify(getRows());
    isLoadingData = false;

    validateTable();
    applyLock();
    SDK.resize();
  } catch (e) {
    isLoadingData = false;
    console.error("Error al cargar la tabla:", e);
    setStatus("Error al cargar");
  }
}

/* ───────────────────────── UI wiring ───────────────────────── */

function wireEvents() {
  document.getElementById("addRowBtn")!.addEventListener("click", () => {
    if (lockReason) return;
    tableTouched = true;
    createRow(newRowValues());
    validateTable();
    scheduleAutoSync();
    SDK.resize();
  });

  const body = tbody();

  // Auto-save as the user types
  body.addEventListener("input", () => {
    if (isLoadingData) return;
    tableTouched = true;
    validateTable();
    scheduleAutoSync(250);
  });

  body.addEventListener("change", event => {
    if (isLoadingData) return;
    tableTouched = true;
    validateTable();

    // Discrete controls sync right away; text inputs sync on focus out
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    const tag = target.tagName.toLowerCase();
    const type = (target.type || "").toLowerCase();
    if (tag === "select" || (tag === "input" && (type === "checkbox" || type === "radio"))) {
      scheduleAutoSync();
    }
  });

  body.addEventListener("focusout", event => {
    if (isLoadingData) return;

    const target = event.target as HTMLElement | null;
    const next = event.relatedTarget as Node | null;
    if (!target) return;

    const tag = target.tagName.toLowerCase();
    if (!(tag === "input" || tag === "select" || tag === "textarea")) return;

    // Still editing inside the table
    const active = document.activeElement;
    if ((next && body.contains(next)) || (active && body.contains(active))) return;

    scheduleAutoSync(250);
  });

  // Tab skips the native calendar icon: hidden only while the browser moves the focus
  document.addEventListener("keydown", event => {
    if (event.key !== "Tab") return;
    body.classList.add("is-tabbing");
    setTimeout(() => body.classList.remove("is-tabbing"));
  }, true);

  // The native calendar is a browser popup that stays open when the focus leaves this iframe.
  // There's no API to close it, but recreating the field's internals does; the value is kept
  let openCalendar: HTMLInputElement | null = null;
  const closeCalendar = () => {
    const input = openCalendar;
    openCalendar = null;
    if (!input) return;
    input.type = "text";
    input.type = "datetime-local";
  };
  const asDateInput = (target: EventTarget | null) =>
    target instanceof HTMLInputElement && target.type === "datetime-local" && !target.readOnly ? target : null;

  document.addEventListener("pointerdown", event => {
    const input = asDateInput(event.target);
    if (input === openCalendar) return;
    closeCalendar();
    if (input && event.clientX > input.getBoundingClientRect().right - CALENDAR_ICON_WIDTH) openCalendar = input;
  }, true);
  document.addEventListener("keydown", event => {
    const input = asDateInput(event.target);
    if (input && event.altKey && event.key === "ArrowDown") openCalendar = input;
    else if (input === openCalendar) openCalendar = null; // keys only reach the field while the calendar is closed
  }, true);
  body.addEventListener("input", event => {
    if (event.target === openCalendar) openCalendar = null; // choosing a date closes the calendar
  });
  window.addEventListener("blur", closeCalendar);

  // Save when user switches tabs/minimizes
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) syncNow();
  });

  // Save when user navigates away
  window.addEventListener("pagehide", syncNow);

  // Save when clicking outside the table
  document.addEventListener("pointerdown", event => {
    const target = event.target as Node | null;
    if (target && body.contains(target)) return;
    scheduleAutoSync(0);
  }, true);
}

/* ───────────────────────── Provider ───────────────────────── */

let initialization: Promise<boolean> = Promise.resolve(false);

/* A setup problem (bad configuration, missing field): show it and never read or write the field,
   so nothing stored can be lost until the control is configured correctly */
async function showSetupError(message: string) {
  setStatus(message);
  (document.getElementById("addRowBtn") as HTMLButtonElement).disabled = true;
  document.querySelector<HTMLElement>(".azdo-table-wrap")!.style.display = "none";
  SDK.resize();
  await SDK.notifyLoadSucceeded();
}

async function initialize(): Promise<boolean> {
  try {
    dataFieldRefName = getConfiguredField();
    try {
      tableConfig = getConfiguredTable();
    } catch (e: any) {
      console.error("ColumnConfiguration inválido:", e);
      await showSetupError("⚠️ Configuración de columnas inválida: " + (e?.message || e));
      return false;
    }

    applyFontConfiguration();
    createHeader();
    wireEvents();

    // Keep the form's iframe as tall as the table, e.g. when a textarea is dragged bigger
    let resizeFrame = 0;
    new ResizeObserver(() => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => SDK.resize());
    }).observe(document.getElementById("app")!);

    const svc = await SDK.getService<IWorkItemFormService>(WORK_ITEM_FORM_SERVICE);

    let resolved: string | null;
    try {
      resolved = await resolveFieldName(svc, dataFieldRefName);
    } catch (e) {
      console.error("No se pudo consultar los campos del work item:", e);
      resolved = dataFieldRefName;
    }
    if (!resolved) {
      await showSetupError("⚠️ Campo no encontrado o no editable: " + dataFieldRefName);
      return false;
    }
    dataFieldRefName = resolved;
    workItemService = svc;

    await load();

    await SDK.notifyLoadSucceeded();
    return true;
  } catch (e: any) {
    console.error("Error al inicializar el servicio del work item:", e);
    setStatus("Error al inicializar");
    try { await SDK.notifyLoadFailed(e?.message || "Error al inicializar"); } catch { /* ignore */ }
    return false;
  }
}

const provider = {
  // Called each time a work item is loaded into the form (the control is reused when navigating)
  onLoaded: async (args: any) => {
    // "true: write REST APIs are disabled. All controls should be rendered as readonly"
    formReadOnly = !!args?.isReadOnly;
    if (await initialization) await load();
  },

  onFieldChanged: async (args: any) => {
    const changed = args?.changedFields;
    if (!changed) return;

    // State change: keep edits made before it, then re-render locked/unlocked
    if ("System.State" in changed && tableConfig.readOnlyStates.length) {
      await syncToField();
      await load();
      return;
    }

    if (!(dataFieldRefName in changed)) return;

    // Ignore the echo from our own write (compared as parsed rows, in case an HTML field wraps it)
    if (JSON.stringify(parseStoredRows(changed[dataFieldRefName])) === lastSyncedPayload) return;
    await load();
  },

  onSaved: () => {},

  // The form already holds the reverted/reloaded value: re-read it, never write the table back over it
  onReset: load,
  onRefreshed: load,

  onUnloaded: async () => {
    await syncToField();
  }
};

SDK.init({ loaded: false });
SDK.ready().then(() => {
  SDK.register(SDK.getContributionId(), provider);
  initialization = initialize();
});
