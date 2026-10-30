# Custom Data Table for Azure DevOps

Add an editable table to your work items. Define its columns, data types and validations with JSON, with no coding. It works well for change plans, task tracking and planning.

![Table with three rows of a change plan](images/tabla-ejemplo.png)

- **Easy to fill in:** type directly into each cell and get validation as you go.
- **Easy to organize:** drag rows, duplicate them or insert a new one where you need it.
- **Controlled:** lock the table in the states you choose and block saving incomplete data.
- **Configurable:** choose the columns, rules and available actions.

> **Language:** this page is in English, but the table's buttons and messages and the control's options are in Spanish. This guide shows each Spanish label with its meaning. Your column names and validation messages can be in any language.

---

# User guide

This section is for people who fill in the table on a work item.

## Add and edit rows

1. Select **Agregar fila** (Add row).
2. Fill in the cells. Your changes reach the work item as you type.
3. Select **Save** on the work item.

> **Important:** the table doesn't save the work item for you. If you close the page without selecting **Save**, Azure DevOps discards the changes, as with any other field.

## Enter dates

Date columns ask for a date and a time.

- **With the keyboard:** click the first part of the date and type everything in one go. The year moves on to the hour by itself.
- **With the calendar:** click the icon in the field. The calendar offers minutes in steps of 5, but you can type any minute.
- **Format:** the order of day and month and the time format depend on your browser's language. The browser also draws the calendar.
- **Tab key:** moves through the parts of the date. From the last part, it moves to the next field.

## Open and copy links

In URL columns, the button next to the field opens the link in a new tab. Hover over it to see the full address. It also works when the table is locked.

To copy a URL, click the field and press `Ctrl+A`, then `Ctrl+C`.

## Row actions

| Control | Action | What it does |
|---|---|---|
| ⠿ handle next to the number | Move | Drag the row to another position. With the handle focused, you can also use the ↑ ↓ arrow keys |
| Blue icon | Duplicate | Creates an exact copy of the row just below it |
| Green icon | Insert below | Creates a new row just below it |
| Red icon | Delete | Deletes the row |

If an action is missing, your table's configuration doesn't include it.

## Fix errors

Fields with problems turn red, and the reason appears next to **Agregar fila** (Add row).

![New row marked in red, with a message saying that required fields are missing in row 4](images/tabla-errores.png)

While the table has errors, Azure DevOps shows a notice at the top of the form and doesn't let you save. For example: `Tabla de datos: Faltan campos obligatorios en la fila 4` (required fields are missing in row 4). Complete the data or delete the row to continue.

If you switch tabs on the form, incomplete rows are still there when you return. Only a partly typed date is lost.

A date without a time counts as empty. If the column isn't required, it isn't marked as an error, but it isn't saved either.

## Locked table

When the work item is in a read-only state, or you don't have permission to edit it, the table turns gray and can't be changed. You can still enlarge long text fields to read all their content.

![Locked table with gray fields](images/tabla-bloqueada.png)

---

# Installation guide

This section is for people who manage the Azure DevOps organization or process.

## 1. Install the extension

1. Open the extension in the [Marketplace](https://marketplace.visualstudio.com/items?itemName=CentroDeCompetencias.custom-data-table-control-v10).
2. Select **Get it free**.
3. Choose your organization and select **Install**.

## 2. Create the data field

The table stores its data as JSON in a work item field.

1. Go to **Organization Settings → Process** and open your inherited process.
2. Open the work item type, for example *User Story*.
3. On the **Layout** tab, select **New field**.
4. Create a field of type **Text (multiple lines)**.

## 3. Add the control

1. On the **Layout** tab, select **Add custom control**.
2. On **Definition**, select **Tabla de datos** (Data table).
3. On **Options**, fill in the options in the following table.
4. On **Layout**, choose where the table appears and select **OK**.

| Option | What to enter |
|---|---|
| **Campo de datos (nombre de referencia)** (Data field, reference name) | The field you created in the previous step |
| **Campo de datos (ingreso manual)** (Data field, manual entry) | Only if the selector doesn't appear: the reference name, for example `Custom.DataTableJSON` |
| **Configuración de columnas (JSON)** (Column configuration) | Your table's JSON. If you leave it empty, a default table is used, with four columns in Spanish for description, owner, start and end |
| **Fuente** (Font) | The table's font. Optional |
| **Tamaño de fuente** (Font size) | The table's text size. Optional |

## 4. Check it

Open a work item of that type, add a row and save it. If the configuration has an error, the table doesn't appear and a notice shows the details.

---

# Configuration

## Full example

This JSON creates a table for change plans. Each task starts when the previous one ends, the start date must be earlier than the end date, and the table locks in the *Closed* state.

```json
{
  "columns": [
    { "id": "description", "name": "Description", "dataType": "textArea", "required": true, "width": "55%" },
    { "id": "owner", "name": "Owner", "dataType": "string", "required": true, "width": "25%" },
    { "id": "start", "name": "Start", "dataType": "date", "required": true, "width": "10%", "defaultFromPrevious": "end" },
    { "id": "end", "name": "End", "dataType": "date", "required": true, "width": "10%" }
  ],
  "rules": [
    {
      "type": "dateOrder",
      "startColumnId": "start",
      "endColumnId": "end",
      "message": "The start date must be earlier than the end date"
    }
  ],
  "readOnlyStates": ["Closed"],
  "rowActions": ["move", "duplicate", "insert", "delete"],
  "blockSaveOnError": true
}
```

Only `columns` is required. You can leave out the other options.

## Columns

| Property | Required | Description |
|---|---|---|
| `id` | Yes | Unique column identifier. It can't be repeated |
| `name` | Yes | Title shown in the header |
| `dataType` | Yes | Data type (see the next table) |
| `required` | No | With `true`, the cell can't be left empty |
| `width` | No | Column width, for example `"25%"` or `"200px"` |
| `defaultValue` | No | Initial value in new rows |
| `options` | Only for `dropdown` | List of options, for example `["High", "Medium", "Low"]` |
| `defaultFromPrevious` | No | Takes the initial value from the previous row (see below) |

| `dataType` | Shown as |
|---|---|
| `string` | Single-line text |
| `textArea` | Multi-line text, with adjustable size |
| `number` | Integer or decimal number |
| `boolean` | Checkbox |
| `date` | Date and time |
| `dropdown` | List of options |
| `url` | Web address, with a button to open it in a new tab |

> **Before you change a column's `id`:** data is stored by `id`. If you change it, the column's earlier data stops appearing and stops being saved the next time someone edits the table. It remains available in the work item's history.

### URL columns

```json
{ "id": "link", "name": "Link", "dataType": "url", "required": true }
```

- Only addresses that start with `http://` or `https://` are accepted. Any other value is marked as an error.
- If you change a `string` column to `url`, the data doesn't change. Values that aren't URLs turn red, and they must be fixed before saving once someone edits the table.
- Don't paste secrets into a URL: they stay visible in the work item's history.

### Values from the previous row

With `defaultFromPrevious`, a new row takes a value from the previous row:

```json
{ "id": "start", "name": "Start", "dataType": "date", "defaultFromPrevious": "end" }
```

- Use the `id` of the column to copy, or `true` to copy the same column.
- If the previous row is empty in that column, `defaultValue` is used.
- It only applies when a row is created: it doesn't change existing rows or recalculate if you later change the previous row.

## Date rule

`dateOrder` checks that one date is earlier than another in the same row.

| Property | Description |
|---|---|
| `type` | Always `"dateOrder"` |
| `startColumnId` | Column with the earlier date. `start` also works |
| `endColumnId` | Column with the later date. `end` also works |
| `message` | Message shown when the rule isn't met |

## Row actions

`rowActions` defines which controls appear. By default, all of them do.

| Value | Control |
|---|---|
| `"move"` | Handle to drag the row |
| `"duplicate"` | Duplicate |
| `"insert"` | Insert below |
| `"delete"` | Delete |

- The order on screen is always the same, regardless of the order in the list.
- Comma-separated text also works: `"duplicate, delete"`.
- With `[]`, no actions appear and the action column is hidden. **Agregar fila** (Add row) remains available.

## Lock by state

`readOnlyStates` lists the work item states in which the table can't be edited:

```json
"readOnlyStates": ["Closed", "Done"]
```

- The lock applies as soon as you change the state on the form, even before saving, and lifts if you return to another state.
- It ignores uppercase and lowercase, but not accents: the name must match the process state.
- Comma-separated text also works: `"Closed, Done"`.
- The table also locks by itself when Azure DevOps opens the work item as read-only.
- If you change to one of these states with unsaved incomplete rows, Azure DevOps doesn't let you save. Return to the previous state to fix or delete them.

> **This lock only applies to the form.** To also prevent changes through bulk edit, Excel or the API, add a process rule: under **Rules → New rule**, use the condition *When the work item state is* `Closed` and the action *Make read-only* on the table's field.

## Block saving

By default, if an edited table has errors, Azure DevOps doesn't let you save the work item. To turn this off:

```json
"blockSaveOnError": false
```

- With `false`, errors are only marked in the table and the work item can be saved. The last valid version of the table is saved, never incomplete rows.
- Rows with errors are kept when you switch tabs on the form. They stay in that browser tab until you fix them, undo the changes or save.
- **Risk with `false`:** when you save with errors, the table returns to its last valid version and any changes made since then are discarded, including those in correct rows.
- It only applies once the table is edited: opening a work item with incomplete data doesn't prevent saving other fields.
- It must be `true` or `false`, without quotes.

## Table name in notices

`tableName` sets how the notice at the top of the form names the table. The default is *Tabla de datos*. It's useful when a form has more than one table:

```json
"tableName": "Rollback plan"
```

With that option, the notice says `Rollback plan: Faltan campos obligatorios en la fila 2`.

## More examples

**Task tracking**

```json
{
  "columns": [
    { "id": "task", "name": "Task", "dataType": "string", "required": true },
    { "id": "hours", "name": "Hours", "dataType": "number", "defaultValue": 0 },
    { "id": "done", "name": "Done", "dataType": "boolean", "defaultValue": false }
  ]
}
```

**List with priorities and only two actions**

```json
{
  "columns": [
    { "id": "item", "name": "Item", "dataType": "textArea", "required": true },
    { "id": "priority", "name": "Priority", "dataType": "dropdown", "options": ["High", "Medium", "Low"], "defaultValue": "Medium" },
    { "id": "dueDate", "name": "Due date", "dataType": "date" }
  ],
  "rowActions": ["move", "delete"]
}
```

---

# Troubleshooting

In normal use, the table doesn't show status messages. A notice only appears when there's a problem.

| Message | What it means | What to do |
|---|---|---|
| `⚠️ Configuración de columnas inválida: …` | The JSON has an error. The table doesn't appear and the field isn't read or written, to protect your data | Fix what the message indicates in the control's options |
| `⚠️ Campo no encontrado o no editable: …` | The configured field doesn't exist on that work item type or can't be edited | Check the data field in the control's options |
| `Faltan campos obligatorios en la fila …` | A required cell in that row is empty. A date without a time counts as empty | Complete the row or delete it |
| `URL no válida en la fila …` | A URL column has a value that doesn't start with `http://` or `https://` | Fix the address or delete the row |
| Your `dateOrder` rule's `message` | A date rule isn't met. Without a custom message, it says `La fecha inicial debe ser menor que la fecha final` | Fix the dates in the marked row |
| `No se pudo actualizar el campo` | Azure DevOps rejected the value | Check that you can edit the field and try again |
| `Error al actualizar el campo (ver consola).` | An unexpected error occurred while writing to the field | Reload the page. If it continues, contact your organization's administrator |
| `Error al cargar` or `Error al inicializar` | The table couldn't load | Reload the page. If it continues, contact your organization's administrator |

---

# What's new in version 1.5

- Add URL columns with `"dataType": "url"`, which validate the address and open it with one click.
- Drag rows to change their order.
- Duplicate a row or insert a new one below it. Actions are now colored icons, configurable with `rowActions`.
- Lock the table by state with `readOnlyStates`.
- Take values from the previous row with `defaultFromPrevious`.
- Type dates in one go: the year moves on to the hour by itself, and Tab no longer stops at the calendar icon.
- New name and extension icon.

**If you're updating from version 1.4:**

- **You don't need to reinstall or reconfigure:** existing controls and data are kept.
- **Saving is blocked when an edited table has errors:** to save anyway, use `"blockSaveOnError": false`. With that option, only the last valid version of the table is saved.
- **Invalid JSON now shows a notice:** the table used to fall back to default columns. Check your controls' configuration.
- **The control is now named "Tabla de datos":** it used to be called *Custom Data Table (DataTables) v3*.
