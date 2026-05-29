import * as SDK from "azure-devops-extension-sdk";
import {
  IWorkItemFormService,
  WorkItemTrackingServiceIds,
} from "azure-devops-extension-api/WorkItemTracking";

import $ from "jquery";
import DataTable from "datatables.net-dt";
import "datatables.net-dt/css/dataTables.dataTables.css";
import "select2";
import "select2/dist/css/select2.min.css";
import "./styles.css";

/* ───────────────────────── Types & constants ───────────────────────── */

// Legacy type for backward compatibility
type Row = { id: number; name: string; estimate: number; done: boolean };

// New dynamic types
interface ColumnDefinition {
  id: string;
  name: string;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'dropdown' | 'textArea';
  required?: boolean;
  width?: string;
  defaultValue?: any;
  options?: string[]; // For dropdown type
}

interface TableConfiguration {
  columns: ColumnDefinition[];
}

// Dynamic row type - key-value pairs with optional _id
type DynamicRow = { [columnId: string]: any; _id?: number };

const VERSION = "8.4.37";
const DEBUG_MODE = false;

function log(...args: any[]) { if (DEBUG_MODE) console.log("[DTCTL]", ...args); }
function dbg(line: string) {
  const el = document.getElementById("dbg");
  if (el) { el.textContent += line + "\n"; el.scrollTop = el.scrollHeight; }
}

let workItemService: IWorkItemFormService | null = null;

/** Default storage field (you’re using this one) */
let dataFieldRefName = "Custom.DataTableJSON";

/** DataTables instance + bookkeeping */
let dt: any = null;
let nextId = 1;

/** Guards to stop bad writes */
let suppressDirty = false;         // don’t run markDirty while loading/rendering
let skipFieldChangeOnce = 0;       // skip the very next onFieldChanged caused by our own setFieldValue
let lastWrittenPayload: string | null = null;

/* ───────────────────────── DOM helpers ───────────────────────── */

const statusEl = () => document.querySelector<HTMLSpanElement>("#status")!;

/**
 * Provide simple translation support for status messages.  The original
 * extension surfaced a handful of English strings such as "Pending changes…"
 * or "Ready".  For this customized version we map those phrases to their
 * Spanish equivalents.  When a message is not found in the lookup table
 * the message is returned unchanged.
 */
const STATUS_TRANSLATIONS: { [key: string]: string } = {
  "Pending changes…": "Cambios pendientes…",
  "Saved": "Guardado",
  "Ready": "Listo",
  "Loading...": "Cargando...",
  "Work item saved": "Elemento de trabajo guardado",
  "Error while updating field (see console).": "Error al actualizar el campo (ver consola).",
  "Error saving": "Error al guardar",
  "Load error": "Error al cargar",
  "Error al inicializar": "Error al inicializar",
  "Servicio no inicializado": "Servicio no inicializado",
  "No se pudo actualizar el campo": "No se pudo actualizar el campo",
  "Cambios aplicados al formulario": "Cambios aplicados al formulario",
  "Hay errores de validación": "Hay errores de validación"
};
const addRowBtn = () => document.getElementById("addRowBtn") as HTMLButtonElement;
const saveBtn = () => document.getElementById("saveBtn") as HTMLButtonElement;

function setStatus(msg: string) {
  // Translate known status strings to Spanish.  If the message has a
  // translation defined in the lookup table use it, otherwise keep
  // the original message.  This allows callers to continue using the
  // original English keys while displaying localized text to the user.
  const translated = STATUS_TRANSLATIONS[msg] ?? msg;
  statusEl().textContent = translated;
  log("STATUS:", translated);
  dbg(translated);
}

/* ───────────────────────── Validation ───────────────────────── */

let validationMessageEl: HTMLElement | null = null;

function getValidationMessageEl(): HTMLElement {
  if (!validationMessageEl) {
    validationMessageEl = document.getElementById("validationMessage") as HTMLElement;
  }
  return validationMessageEl;
}

function setValidationMessage(message: string) {
  const el = getValidationMessageEl();
  if (el) {
    el.textContent = message || "";
  }
}

function clearValidationState() {
  document.querySelectorAll("#gridTable tbody tr").forEach((tr: Element) => {
    tr.classList.remove("row-error");
  });
  document.querySelectorAll("#gridTable .field-error").forEach((el: Element) => {
    el.classList.remove("field-error");
    (el as HTMLElement).removeAttribute("title");
  });
  setValidationMessage("");
}

function markFieldError(el: Element | null, message: string) {
  if (!el) return;
  el.classList.add("field-error");
  (el as HTMLElement).setAttribute("title", message);
  const tr = (el as HTMLElement).closest("tr");
  if (tr) tr.classList.add("row-error");
}

function validateTable(showFeedback: boolean = false): boolean {
  clearValidationState();
  
  if (!dt) return true;
  
  const columnConfig = getColumnConfiguration();
  const rows = dt.rows({ search: "none" }).nodes();
  let hasRequiredError = false;
  
  rows.each((tr: any, idx: number) => {
    columnConfig.columns.forEach((col: ColumnDefinition) => {
      if (!col.required) return;
      
      const input = $(tr).find(`input.dt-${col.id}, select.dt-${col.id}, textarea.dt-${col.id}`);
      if (input.length === 0) return;
      
      // Skip boolean type - checkboxes are always valid
      if (col.dataType === 'boolean') return;
      
      let empty = false;
      if (col.dataType === 'number') {
        empty = String(input.val() || "").trim() === "";
      } else {
        empty = String(input.val() || "").trim() === "";
      }
      
      if (empty) {
        hasRequiredError = true;
        markFieldError(input[0], "Debe completar todos los campos");
      }
    });
  });
  
  if (hasRequiredError) {
    setValidationMessage("Debe completar todos los campos");
    if (showFeedback) setStatus("Hay errores de validación");
    return false;
  }
  
  setValidationMessage("");
  return true;
}

/* Prefer picker → manual → default (survives Options tab flakiness) */
function getConfiguredField(): string {
  const cfg = SDK.getConfiguration() as any;
  const picker = cfg?.witInputs?.DataFieldRefName?.trim?.();
  const manual = cfg?.witInputs?.DataFieldRefNameText?.trim?.();
  const chosen = (picker || manual || dataFieldRefName) as string;
  log("Configured field:", { picker, manual, chosen });
  return chosen;
}

/* Get column configuration from extension inputs */
function getColumnConfiguration(): TableConfiguration {
  const cfg = SDK.getConfiguration() as any;
  const columnConfigJson = cfg?.witInputs?.ColumnConfiguration?.trim?.();
  
  let columnConfig: TableConfiguration | null = null;
  try {
    columnConfig = columnConfigJson ? JSON.parse(columnConfigJson) : null;
  } catch (e) {
    log("Invalid column configuration JSON:", e);
    columnConfig = null;
  }
  
  // Fallback to default configuration that matches current behavior
  if (!columnConfig || !columnConfig.columns || !Array.isArray(columnConfig.columns)) {
    columnConfig = {
      columns: [
        { id: "name", name: "Item Name", dataType: "string", required: true },
        { id: "estimate", name: "Estimate (hrs)", dataType: "number", defaultValue: 0 },
        { id: "done", name: "Done?", dataType: "boolean", defaultValue: false }
      ]
    };
  }
  
  log("Column configuration:", columnConfig);
  return columnConfig;
}

/* Get font configuration from extension inputs */
function getFontConfiguration(): { fontFamily: string; fontSize: string } {
  const cfg = SDK.getConfiguration() as any;
  let fontFamily = cfg?.witInputs?.FontFamily?.trim?.() || "";
  let fontSize = cfg?.witInputs?.FontSize?.trim?.() || "";
  
  // Handle dropdown values - extract actual font name/size
  if (fontFamily && fontFamily.includes("Default")) {
    fontFamily = ""; // Use system default
  }
  
  if (fontSize && fontSize.includes("Default")) {
    fontSize = ""; // Use system default
  }
  
  log("Font configuration:", { fontFamily, fontSize });
  return { fontFamily, fontSize };
}

/* Get show tip configuration */
function getShowTipConfiguration(): boolean {
  const cfg = SDK.getConfiguration() as any;
  const showTip = cfg?.witInputs?.ShowTip;
  
  // Default to true if not specified
  if (showTip === undefined || showTip === null) {
    return true;
  }
  
  // Handle boolean or string values
  if (typeof showTip === 'boolean') {
    return showTip;
  }
  
  // Handle string "true"/"false"
  return showTip.toString().toLowerCase() === 'true';
}

/* Apply font configuration to the page */
function applyFontConfiguration() {
  const { fontFamily, fontSize } = getFontConfiguration();
  const root = document.documentElement;
  
  // Apply font family if provided and not default
  if (fontFamily && !fontFamily.includes("Default")) {
    // Add system font fallbacks for safety
    const fontWithFallback = `${fontFamily}, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`;
    root.style.setProperty('--az-font', fontWithFallback);
    log("Applied font family:", fontWithFallback);
  }
  
  // Apply font size if provided and valid
  if (fontSize && !fontSize.includes("Default")) {
    const parsedSize = parseInt(fontSize, 10);
    if (!isNaN(parsedSize) && parsedSize >= 8 && parsedSize <= 32) {
      root.style.setProperty('--az-font-size', `${parsedSize}px`);
      log("Applied font size:", `${parsedSize}px`);
    } else {
      log("Invalid font size, using default:", fontSize);
    }
  }
}

/* Apply tip visibility configuration */
function applyTipVisibility() {
  const showTip = getShowTipConfiguration();
  const tipElement = document.querySelector('.azdo-hint') as HTMLElement;
  
  if (tipElement) {
    tipElement.style.display = showTip ? 'block' : 'none';
    log("Tip visibility:", showTip ? 'visible' : 'hidden');
  }
}

/* ───────────────────────── HTML-field sanitation ───────────────────────── */

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}
function stripHtmlTags(s: string): string {
  return s.replace(/<\/?[^>]+>/g, "").replace(/\u00A0/g, " ").trim();
}
function extractJsonArray(s: string): string | null {
  const start = s.indexOf("["); const end = s.lastIndexOf("]");
  return (start !== -1 && end !== -1 && end > start) ? s.slice(start, end + 1) : null;
}
function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* ───────────────────────── DataTables rendering ───────────────────────── */

function generateCellInput(column: ColumnDefinition, data: any): string {
  const value = data ?? column.defaultValue ?? '';
  const escapedValue = escapeHtml(String(value));
  const cssClass = `dt-${column.id}`;
  const requiredAttr = column.required ? 'required' : '';
  
  switch (column.dataType) {
    case 'string':
      return `<input class="${cssClass}" type="text" value="${escapedValue}" ${requiredAttr} />`;
    case 'textArea':
      return `<textarea class="${cssClass}" ${requiredAttr}>${escapedValue}</textarea>`;
    case 'number':
      return `<input class="${cssClass}" type="number" value="${Number(value)}" ${requiredAttr} />`;
    case 'boolean':
      return `<input class="${cssClass}" type="checkbox" ${value ? 'checked' : ''} />`;
    case 'date':
      // Convert stored ISO strings into a format accepted by the
      // datetime-local input.  When a value exists we slice off the
      // trailing timezone component and any seconds to produce
      // yyyy-MM-ddTHH:mm.  Without a value the field is left blank.
      let dateTimeValue = '';
      if (value) {
        try {
          // Value could be an ISO string such as 2026-03-13T00:00:00.000Z
          // or already a local datetime string.  Create a Date to normalise
          // then strip timezone and seconds.  toISOString returns
          // yyyy-MM-ddTHH:mm:ss.sssZ in UTC, so slice to 16 chars.
          dateTimeValue = new Date(value).toISOString().substring(0, 16);
        } catch {
          const raw = String(value);
          const idx = raw.indexOf('Z');
          const trimmed = idx >= 0 ? raw.slice(0, idx) : raw;
          dateTimeValue = trimmed.substring(0, 16);
        }
      }
      return `<input class="${cssClass}" type="datetime-local" value="${dateTimeValue}" ${requiredAttr} />`;
    case 'dropdown':
      const options = column.options || [];
      const optionElements = options.map(opt => 
        `<option value="${escapeHtml(opt)}" ${opt === value ? 'selected' : ''}>${escapeHtml(opt)}</option>`
      ).join('');
      return `<select class="${cssClass}" ${requiredAttr}>${optionElements}</select>`;
    default:
      return `<input class="${cssClass}" type="text" value="${escapedValue}" />`;
  }
}

function renderTable(initial: DynamicRow[], columnConfig: TableConfiguration) {
  // Guard: don't let any input/change handlers fire markDirty during this whole render.
  suppressDirty = true;

  // Clear any existing DataTables global search filters
  if ($.fn.dataTable.ext.search.length > 0) {
    $.fn.dataTable.ext.search.length = 0;
    console.log('🧹 Cleared existing global search filters');
  }

  if (dt) { try { dt.destroy(true); } catch {} dt = null; }

  // Generate dynamic columns
  const columns: any[] = [
    { data: "_id", width: "40px", title: "#" } // Row number column
  ];
  
  // Add configured columns
  columnConfig.columns.forEach((col: ColumnDefinition) => {
    columns.push({
      data: col.id,
      title: col.name,
      width: col.width || undefined,
      render: (d: any, type: string) => {
        // For search/type/sort, return the raw data value
        if (type === 'search' || type === 'type' || type === 'sort') {
          return String(d ?? col.defaultValue ?? '');
        }
        // For display, return the HTML input
        return generateCellInput(col, d);
      },
      searchable: true,
      type: col.dataType === 'number' ? 'num' : 
            col.dataType === 'date' ? 'date' : 'string'
    });
  });
  
  // Add actions column
  columns.push({
    data: null,
    title: "Acción",
    defaultContent: `<button class="azdo-btn btn-remove" title="Remove">
                      Delete
                    </button>`,
    orderable: false,
    width: "80px"
  });

  dt = new DataTable("#gridTable", {
    data: initial,
    // Disable paging, searching, info and ordering for a simplified table
    paging: false,
    searching: false,
    info: false,
    ordering: false,
    // Do not persist table state between page reloads
    stateSave: false,
    // Do not show the length (entries per page) selector
    lengthChange: false,
    columns: columns,
    // Custom search to handle HTML content
    search: {
      smart: true,
      regex: false,
      caseInsensitive: true
    },
    initComplete: function () {
      // No custom initialization needed - filters disabled, no filter row
      return;
    }
  });

  // Keep nextId in sync (use all rows, not just filtered ones)
  try {
    const all = dt.rows({ search: "none" }).data().toArray() as any[];
    nextId = (all.reduce((m: number, r: any) => Math.max(m, r?._id || 0), 0) as number) + 1 || 1;
  } catch { nextId = 1; }

  // Wire events (after destroy to avoid duplicates)
  const $tbody = $("#gridTable tbody");
  $tbody.off("input.dt change.dt click.dt")
    .on("input.dt change.dt", "input, select, textarea", () => { 
      if (!suppressDirty) {
        validateTable(false);
        markDirty(); 
      }
    })
    .on("click.dt", "button.btn-remove", function () {
      const row = $(this).closest("tr");
      dt.row(row).remove().draw(false);
      if (!suppressDirty) {
        validateTable(false);
        markDirty();
      }
    });

  SDK.resize();

  // Verify all filters are properly initialized
  setTimeout(() => {
    const optionFilters = $('.option-filter').length;
    const textFilters = $('.text-filter').length;
    const select2Filters = $('.text-filter.select2-hidden-accessible').length;
    
    console.log(`✅ Filter summary: ${optionFilters} option filters, ${textFilters} text filters, ${select2Filters} Select2 initialized`);
  }, 500);

  // Release the guard shortly after DataTables finishes its first draw.
  setTimeout(() => { suppressDirty = false; log("suppressDirty=false (render complete)"); }, 500);
}

/* ───────────────────────── Row reader (hardened) ───────────────────────── */

function getRowsFromTable(): DynamicRow[] {
  const rows: DynamicRow[] = [];
  if (!dt) return rows;

  const columnConfig = getColumnConfiguration();

  // Prefer stable index enumeration
  let idxs: number[] = [];
  try { idxs = dt.rows({ search: "none" }).indexes().toArray(); } catch {}
  // Fallback: if indexes are empty but data exists, iterate the data array
  if (idxs.length === 0) {
    try {
      const dataArr = dt.rows({ search: "none" }).data().toArray() as any[];
      for (let i = 0; i < dataArr.length; i++) idxs.push(i);
    } catch {}
  }

  for (const idx of idxs) {
    const data = dt.row(idx).data() || {};
    const node: HTMLElement | null = dt.row(idx).node ? dt.row(idx).node() : null;

    const row: DynamicRow = { _id: data._id || idx + 1 };

    // Extract values for each configured column
    columnConfig.columns.forEach((col: ColumnDefinition) => {
      let value = data[col.id] ?? col.defaultValue;

      // Overlay DOM values if present
      if (node) {
        const $tr = $(node);
        const input = $tr.find(`input.dt-${col.id}, select.dt-${col.id}, textarea.dt-${col.id}`);
        if (input.length > 0) {
          if (col.dataType === 'boolean') {
            value = input.is(':checked');
          } else {
            value = input.val();
            if (col.dataType === 'number') {
              value = Number(value);
            } else if (col.dataType === 'date' && value) {
              value = new Date(value as string).toISOString();
            }
            // string, textArea, dropdown values are already strings, no conversion needed
          }
        }
      }

      row[col.id] = value;
    });

    rows.push(row);
  }

  nextId = (rows.reduce((m, r) => Math.max(m, r._id || 0), 0) || 0) + 1;

  log("getRowsFromTable ->", rows);
  dbg("getRowsFromTable count=" + rows.length);
  return rows;
}

/* ───────────────────────── Persistence ───────────────────────── */

let dirtyDebounce: number | undefined;

async function markDirty() {
  if (suppressDirty) { log("markDirty skipped (suppressDirty)"); return; }
  if (!workItemService) return;

  window.clearTimeout(dirtyDebounce);
  dirtyDebounce = window.setTimeout(async () => {
    try {
      const payload = JSON.stringify(getRowsFromTable());
      // Avoid pointless write if value hasn't changed
      if (payload === lastWrittenPayload) { setStatus("Pending changes…"); return; }

      skipFieldChangeOnce++;                 // ignore the echo from this write
      const ok = await workItemService!.setFieldValue(dataFieldRefName, payload);
      lastWrittenPayload = payload;

      setStatus(ok ? "Pending changes…" : `⚠️ setFieldValue=false (${dataFieldRefName})`);
    } catch (e) {
      log("markDirty error", e);
      setStatus("Error while updating field (see console).");
    }
  }, 250);
}

async function saveToField() {
  if (!workItemService) return;
  if (!dataFieldRefName) { setStatus("⚠️ No field configured."); return; }

  try {
    const payload = JSON.stringify(getRowsFromTable());
    skipFieldChangeOnce++;
    const ok = await workItemService.setFieldValue(dataFieldRefName, payload);
    lastWrittenPayload = payload;
    if (!ok) throw new Error("setFieldValue returned false");
    setStatus("Saved");
  } catch (err: any) {
    log("saveToField error", err);
    setStatus("Error saving: " + (err?.message ?? String(err)));
  }
}

/* ───────────────────────── Loading ───────────────────────── */

async function loadFromField() {
  if (!workItemService) return;
  suppressDirty = true;

  const columnConfig = getColumnConfiguration();
  let rows: DynamicRow[] = [];
  
  try {
    let value = await workItemService.getFieldValue(dataFieldRefName);
    if (typeof value !== "string") value = value == null ? "" : String(value);

    log("loadFromField raw:", value);
    let text = decodeHtmlEntities(String(value));
    text = stripHtmlTags(text);
    const jsonText = extractJsonArray(text) ?? "";

    log("loadFromField sanitized:", jsonText);

    if (jsonText) {
      try {
        const parsed = JSON.parse(jsonText);
        if (Array.isArray(parsed)) {
          rows = parsed.map((p: any, i: number) => {
            // Handle migration from legacy format
            if (isLegacyRow(p)) {
              return migrateLegacyRow(p, i + 1, columnConfig);
            } else {
              // Already in new format, ensure all columns exist
              const row: DynamicRow = { _id: p._id || i + 1 };
              columnConfig.columns.forEach(col => {
                row[col.id] = p[col.id] ?? col.defaultValue;
              });
              return row;
            }
          });
        }
      } catch (e) { log("JSON.parse failed (sanitized):", e); }
    }
  } catch (e) { log("loadFromField error", e); }

  renderTable(rows, columnConfig);

  // Release guard after DataTables settles
  setTimeout(() => { suppressDirty = false; log("suppressDirty=false (load complete)"); }, 250);
}

// Check if a row is in legacy format
function isLegacyRow(row: any): boolean {
  return row && 
         typeof row === 'object' && 
         ('name' in row || 'estimate' in row || 'done' in row) &&
         !('_id' in row) &&
         Object.keys(row).length <= 4; // id, name, estimate, done
}

// Migrate legacy row to new format
function migrateLegacyRow(legacyRow: any, defaultId: number, columnConfig: TableConfiguration): DynamicRow {
  const row: DynamicRow = { _id: legacyRow.id || defaultId };
  
  columnConfig.columns.forEach(col => {
    switch (col.id) {
      case 'name':
        row[col.id] = legacyRow.name ?? col.defaultValue ?? '';
        break;
      case 'estimate':
        row[col.id] = legacyRow.estimate ?? col.defaultValue ?? 0;
        break;
      case 'done':
        row[col.id] = legacyRow.done ?? col.defaultValue ?? false;
        break;
      default:
        row[col.id] = col.defaultValue;
    }
  });
  
  return row;
}

/* ───────────────────────── UI wiring ───────────────────────── */

function wireButtons() {
  addRowBtn().addEventListener("click", () => {
    if (!dt) return;
    const columnConfig = getColumnConfiguration();
    const newRow: DynamicRow = { _id: nextId++ };
    
    // Initialize all columns with default values
    columnConfig.columns.forEach(col => {
      newRow[col.id] = col.defaultValue ?? (
        col.dataType === 'number' ? 0 :
        col.dataType === 'boolean' ? false :
        ''
      );
    });
    
    dt.row.add(newRow).draw(false);
    if (!suppressDirty) markDirty();
  });
  saveBtn().addEventListener("click", saveToField);
}

/* Try a couple of capitalization variants if needed */
async function resolveWritableFieldName(svc: IWorkItemFormService, names: string[]): Promise<string | null> {
  for (const f of names) {
    try {
      const cur = await svc.getFieldValue(f);
      const ok = await svc.setFieldValue(f, cur);
      log("probe field", f, "->", ok);
      if (ok) return f;
    } catch (e) { log("probe field error", f, e); }
  }
  return null;
}

/* ───────────────────────── Provider ───────────────────────── */

const provider = () => ({
  onLoaded: async () => {
    try {
      setStatus("Loading...");

      // Apply font configuration first (before rendering anything)
      applyFontConfiguration();
      
      // Apply tip visibility
      applyTipVisibility();

      // Load configurations
      dataFieldRefName = getConfiguredField();
      const columnConfig = getColumnConfiguration();
      
      log("Column config loaded:", columnConfig);

      workItemService = await SDK.getService<IWorkItemFormService>(
        WorkItemTrackingServiceIds.WorkItemFormService
      );

      const resolved = await resolveWritableFieldName(workItemService, [
        dataFieldRefName,
        dataFieldRefName.replace(/Json$/, "JSON"),
        dataFieldRefName.replace(/JSON$/, "Json"),
      ]);

      if (resolved) {
        dataFieldRefName = resolved;
      } else {
        setStatus("⚠️ Field not found/writable: " + dataFieldRefName);
      }

      wireButtons();
      await loadFromField(); // loadFromField now handles columnConfig internally
      setStatus("Ready"); // Clean status message

      (window as any).dtctl = { 
        version: VERSION, 
        addRow: () => addRowBtn().click(), 
        data: () => getRowsFromTable(),
        config: columnConfig
      };
      log("VERSION", VERSION);
    } catch (e: any) {
      log("onLoaded error", e);
      setStatus("Load error: " + (e?.message ?? String(e)));
    }
  },

  onFieldChanged: async (args: any) => {
    // Ignore the echo from our own write exactly once
    if (args?.changedFields && args.changedFields[dataFieldRefName] !== undefined) {
      if (skipFieldChangeOnce > 0) {
        skipFieldChangeOnce--;
        log("onFieldChanged skipped (echo of our own write)");
        return;
      }
      log("onFieldChanged -> reloading from field");
      await loadFromField();
    }
  },

  onSaved: async () => setStatus("Work item saved"),
  onUnloaded: () => {},
});

SDK.init();
SDK.ready().then(() => {
  SDK.register(SDK.getContributionId(), provider);
});
