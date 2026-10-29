# Tabla de Datos Dinámica para Azure DevOps

[![GitHub](https://img.shields.io/badge/GitHub-Repositorio-blue?logo=github)](https://github.com/cvalverdem/custom-data-table) [![Versión](https://img.shields.io/badge/versión-1.4.1-blue)](https://github.com/cvalverdem/custom-data-table)

**Extensión que permite crear tablas personalizables dentro de los elementos de trabajo de Azure DevOps.** Cada columna puede tener su propio tipo de datos, validación requerida, reglas de validación y configuración de ancho.

---

## Características Principales

### Tipos de Datos Soportados

| Tipo | Descripción | Input |
|------|-------------|-------|
| `string` | Texto de una línea | `<input type="text">` |
| `textArea` | Texto multilínea | `<textarea>` |
| `number` | Números enteros o decimales | `<input type="number">` |
| `boolean` | Valores true/false | `<input type="checkbox">` |
| `date` | Fecha y hora local | `<input type="datetime-local">` |
| `dropdown` | Lista de opciones predefinidas | `<select>` |

### Funcionalidades

- **Reordenar filas**: Arrastra una fila desde el asa ⠿ junto a su número para cambiar su posición (o enfoca el asa y usa las flechas ↑ ↓). El nuevo orden se guarda automáticamente
- **Bloqueo por estado**: Con `readOnlyStates` la tabla queda en solo lectura en los estados que indiques (por ejemplo, Finalizado)
- **Validación de campos requeridos**: Los campos marcados como `required: true` muestran error visual y mensaje si están vacíos
- **Reglas de validación de fechas**: Compara dos campos de fecha y valida que uno sea menor que el otro
- **Guardado automático**: Los cambios se guardan automáticamente al escribir (debounce de 250ms)
- **Guardado al abandonar la página**: Se guarda automáticamente cuando cambias de pestaña o cierras el navegador
- **Compatibilidad con datos legacy**: Migra automáticamente datos de formatos anteriores
- **Configuración de fuente**: Permite cambiar familia y tamaño de fuente
- **Interfaz en español**: Todos los textos y mensajes están en español
- **Notificación de éxito/error**: Notifica a Azure DevOps cuando la carga termina correctamente o falla

---

## Instalación

### 1. Descargar la extensión

Descarga el archivo `.vsix` desde la sección de releases del repositorio:
https://github.com/cvalverdem/custom-data-table/releases

### 2. Instalar en Azure DevOps

1. Ve a [Azure DevOps Marketplace](https://marketplace.visualstudio.com/azuredevops)
2. Busca "Custom Data Table" o sube el archivo `.vsix`
3. Instala la extensión en tu organización

### 3. Agregar un campo al Work Item Type (en tu Inherited Process existente)

1. Ve a **Organization Settings** → **Process**
2. Selecciona tu **Inherited Process** existente
3. Haz clic en el **Work item type** que quieras modificar (User Story, Task, Bug, etc.)
4. Ve a la pestaña **Layout**
5. En el toolbar superior, haz clic en **New field**:
   - Nombre: "Tabla Dinámica" (o el que prefieras)
   - Tipo: **Text (multiple lines)** ← importante para almacenar JSON

### 4. Agregar el control personalizado (Custom control) al Work Item Type

1. En el toolbar superior de la pestaña **Layout**, haz clic en **Add custom control**
2. Aparecerá un modal titulado "Add a custom control to [Work Item Type]"
3. En el tab **Definition** (izquierda), en el campo **Control**, selecciona **Custom Data Table (DataTables) v3**
4. Ve al tab **Options** (izquierda) para configurar:
   - **Data field**: selecciona el campo "Text (multiple lines)" que creaste
   - **Column Configuration (JSON)**: pega tu configuración de columnas
5. Ve al tab **Layout** (izquierda) para posicionar el control en el formulario
6. Haz clic en **OK** para guardar el control

---

## Configuración de la Extensión

### Campos del formulario

| Campo | Descripción |
|-------|-------------|
| **Data field (reference name)** | Campo de Azure DevOps que almacena el JSON de la tabla |
| **Data field (manual entry)** | Respaldo si el selector no funciona |
| **Column Configuration (JSON)** | Definición de las columnas y reglas en formato JSON |
| **Font Family** | Familia de fuente para la tabla |
| **Font Size** | Tamaño de fuente para la tabla |

### Ejemplo de Configuración JSON con Reglas de Fechas

```json
{
  "columns": [
    {
      "id": "descripcion",
      "name": "Descripción",
      "dataType": "textArea",
      "required": true,
      "width": "55%"
    },
    {
      "id": "responsable",
      "name": "Responsable",
      "dataType": "string",
      "required": true,
      "width": "25%"
    },
    {
      "id": "fechaInicio",
      "name": "Fecha y hora inicio",
      "dataType": "date",
      "required": true,
      "width": "10%"
    },
    {
      "id": "fechaFin",
      "name": "Fecha y hora fin",
      "dataType": "date",
      "required": true,
      "width": "10%"
    }
  ],
  "rules": [
    {
      "type": "dateOrder",
      "startColumnId": "fechaInicio",
      "endColumnId": "fechaFin",
      "message": "La fecha inicial debe ser menor que la fecha final"
    }
  ]
}
```

---

## Estructura de las Columnas

### Propiedades de Columna

| Propiedad | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | string | Sí | Identificador único de la columna |
| `name` | string | Sí | Nombre que se muestra en el encabezado |
| `dataType` | string | Sí | Tipo de dato: `string`, `textArea`, `number`, `boolean`, `date`, `dropdown` |
| `required` | boolean | No | Si es `true`, el campo debe tener valor |
| `width` | string | No | Ancho de la columna (ej: `"200px"`, `"25%"`) |
| `defaultValue` | any | No | Valor por defecto para filas nuevas |
| `options` | string[] | Solo para dropdown | Lista de opciones disponibles |

> **Si el JSON tiene un error**, la tabla no usa columnas por defecto: muestra `⚠️ Configuración de columnas inválida: …` con el detalle y no toca el campo, para que un error de configuración no borre datos. Después de cambiar la configuración, abre un elemento de trabajo para comprobar que la tabla se ve bien. Si el campo se deja vacío, se usa la tabla por defecto (Descripción, Responsable, Fecha y hora inicio, Fecha y hora fin).

---

## Reglas de Validación

### Regla dateOrder

Valida que la fecha de una columna sea menor que la fecha de otra columna.

```json
{
  "rules": [
    {
      "type": "dateOrder",
      "startColumnId": "fechaInicio",
      "endColumnId": "fechaFin",
      "message": "La fecha inicial debe ser menor que la fecha final"
    }
  ]
}
```

**Propiedades:**
| Propiedad | Descripción |
|-----------|-------------|
| `type` | Siempre `"dateOrder"` |
| `startColumnId` | ID de la columna que debe tener la fecha menor (también acepta `start`) |
| `endColumnId` | ID de la columna que debe tener la fecha mayor (también acepta `end`) |
| `message` | Mensaje de error personalizado |

**Ejemplo práctico - Registro de Reuniones:**

```json
{
  "columns": [
    { "id": "tema", "name": "Tema", "dataType": "textArea", "required": true },
    { "id": "encargado", "name": "Encargado", "dataType": "string", "required": true },
    { "id": "inicio", "name": "Hora inicio", "dataType": "date", "required": true },
    { "id": "fin", "name": "Hora fin", "dataType": "date", "required": true },
    { "id": "completado", "name": "Completado", "dataType": "boolean", "defaultValue": false }
  ],
  "rules": [
    {
      "type": "dateOrder",
      "start": "inicio",
      "end": "fin",
      "message": "La hora de inicio debe ser anterior a la hora de fin"
    }
  ]
}
```

---

## Ejemplos de Configuración

### Tabla Simple con Tareas

```json
{
  "columns": [
    { "id": "tarea", "name": "Tarea", "dataType": "string", "required": true },
    { "id": "horas", "name": "Horas", "dataType": "number", "defaultValue": 0 },
    { "id": "completado", "name": "Completado", "dataType": "boolean", "defaultValue": false }
  ]
}
```

### Tabla con Prioridades y Validación

```json
{
  "columns": [
    { "id": "item", "name": "Elemento", "dataType": "textArea", "required": true },
    { "id": "prioridad", "name": "Prioridad", "dataType": "dropdown", "options": ["Alta", "Media", "Baja"], "defaultValue": "Media" },
    { "id": "fechaLimite", "name": "Fecha límite", "dataType": "date" }
  ]
}
```

### Tabla de Seguimiento de Proyectos

```json
{
  "columns": [
    { "id": "tarea", "name": "Tarea", "dataType": "textArea", "required": true },
    { "id": "responsable", "name": "Responsable", "dataType": "string" },
    { "id": "fechaInicio", "name": "Fecha inicio", "dataType": "date", "required": true },
    { "id": "fechaFin", "name": "Fecha fin", "dataType": "date", "required": true },
    { "id": "estado", "name": "Estado", "dataType": "dropdown", "options": ["Pendiente", "En curso", "Completada"], "defaultValue": "Pendiente" }
  ],
  "rules": [
    {
      "type": "dateOrder",
      "startColumnId": "fechaInicio",
      "endColumnId": "fechaFin",
      "message": "La fecha de inicio debe ser anterior a la fecha de fin"
    }
  ]
}
```

---

## Bloqueo por Estado (solo lectura)

Agrega `readOnlyStates` al JSON de configuración con los estados del elemento de trabajo en los que la tabla no se puede editar:

```json
{
  "columns": [ ... ],
  "rules": [ ... ],
  "readOnlyStates": ["Finalizado", "Cerrado"]
}
```

- En esos estados la tabla queda bloqueada: los campos se muestran en gris y no se puede escribir, agregar, eliminar ni reordenar filas. Los campos `textArea` se pueden seguir agrandando para leer el texto completo.
- El bloqueo se aplica en cuanto cambias el estado en el formulario (incluso antes de guardar) y se quita si vuelves a otro estado. Los cambios hechos antes de cambiar el estado se conservan.
- La comparación no distingue mayúsculas/minúsculas, pero sí acentos: el nombre debe coincidir con el estado del proceso.
- También acepta un texto separado por comas: `"readOnlyStates": "Finalizado, Cerrado"`.
- Sin `readOnlyStates`, la tabla funciona como siempre.
- Además, la tabla se bloquea sola cuando Azure DevOps abre el elemento de trabajo en modo solo lectura (por ejemplo, sin permisos de edición).

> **Importante:** este bloqueo es de la interfaz. Para que el campo no se pueda modificar por ninguna vía (edición masiva, Excel, API), crea también una regla en el proceso: **Organization Settings → Process → (proceso) → (tipo de elemento) → Rules → New rule**, condición *When the work item state is* `Finalizado` y acción *Make read-only* sobre el campo de la tabla (por ejemplo `Custom.DataTableJSON`).

---

## Mensajes de Estado

En uso normal la tabla no muestra ningún mensaje de estado. Solo aparece un aviso cuando hay un problema:

| Mensaje | Significado |
|---------|-------------|
| `⚠️ Campo no encontrado o no editable: …` | El campo configurado no existe en el tipo de elemento de trabajo |
| `⚠️ Configuración de columnas inválida: …` | El JSON de *Column Configuration* tiene un error (sintaxis, falta `columns`, columna sin `id` o `id` repetido). La tabla no se muestra y no se lee ni se escribe el campo hasta corregirlo; el detalle indica qué falla |
| `Error al inicializar` | Falló la inicialización |
| `Error al cargar` | Error al cargar datos |
| `No se pudo actualizar el campo` | Azure DevOps rechazó el valor |
| `Error al actualizar el campo (ver consola).` | Error inesperado al guardar |

Los errores de validación (`Debe completar todos los campos`, `La fecha inicial debe ser menor que la fecha final` o el mensaje personalizado de la regla) se muestran en rojo junto al botón **Agregar fila** y también arriba del formulario, lo que impide guardar el elemento de trabajo hasta corregirlos.

---

## Construir desde Código Fuente

### Requisitos

- Node.js 18+
- npm 9+

### Comandos

```bash
# Instalar dependencias
npm install

# Construir la extensión
npm run build

# Crear paquete .vsix
npm run package

# Publicar en Marketplace (requiere token)
npm run publish -- --token TU_TOKEN
```

---

## Estructura del Proyecto

```
custom-data-table/
├── src/
│   ├── index.ts          # Código principal (TypeScript)
│   ├── index.html        # Plantilla HTML
│   └── styles.css        # Estilos CSS
├── dist/                 # Archivos compilados
├── vss-extension.json    # Manifiesto de la extensión
├── webpack.config.js     # Configuración de webpack
└── package.json          # Dependencias npm
```

---

## Historial de Cambios

### v1.4.1
- Agregado soporte para `textArea` (campos multilínea)
- Agregada validación de campos requeridos
- Agregadas reglas de validación de fechas (`dateOrder`)
- Sincronizadas traducciones entre versiones
- Agregados eventos de guardado (visibilitychange, pagehide, pointerdown)
- Agregados callbacks `onReset` y `onRefreshed`
- Agregada notificación de carga exitosa/fallida
- Limpiado código muerto

### v1.4.0
- Versión inicial del repositorio

---

## Licencia

ISC

---

**Repositorio:** https://github.com/cvalverdem/custom-data-table
**Reportar Issues:** https://github.com/cvalverdem/custom-data-table/issues