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

- **Validación de campos requeridos**: Los campos marcados como `required: true` muestran error visual y mensaje si están vacíos
- **Reglas de validación de fechas**: Compara dos campos de fecha y valida que uno sea menor que el otro
- **Guardado automático**: Los cambios se guardan automáticamente al escribir (debounce de 250ms)
- **Guardado al abandonar la página**: Se guarda automáticamente cuando cambias de pestaña o cierras el navegador
- **Compatibilidad con datos legacy**: Migra automáticamente datos de formatos anteriores
- **Configuración de fuente**: Permite cambiar familia y tamaño de fuente
- **Visibilidad del mensaje de ayuda**: Opción para mostrar/ocultar el tip
- **Interfaz en español**: Todos los mensajes de estado están traducidos
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

### 3. Configurar un proceso heredado

1. **Organización Settings** → **Process**
2. Crea un **proceso heredado** del proceso base (Agile, Scrum, etc.)
3. Selecciona un tipo de elemento de trabajo (User Story, Task, etc.)
4. Crea un nuevo campo de tipo **Text (multiple lines)** para almacenar los datos

### 4. Agregar el control personalizado

1. En el proceso heredado, abre el tipo de elemento de trabajo
2. Click en **"Add a custom control"**
3. Selecciona **"Custom Data Table (DataTables) v3"**
4. Configura las opciones en la pestaña **Options**

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
| **Show Tip Message** | Mostrar/ocultar el mensaje de ayuda |

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

---

## Mensajes de Estado

La extensión muestra mensajes de estado en español:

| Mensaje | Significado |
|---------|-------------|
| `Listo` | Tabla cargada correctamente |
| `Cargando...` | Cargando datos |
| `Cambios pendientes…` | Guardando automáticamente |
| `Guardado` | Guardado manual completado |
| `Cambios aplicados al formulario` | Cambios guardados exitosamente |
| `Error al inicializar` | Falló la inicialización |
| `Error al cargar` | Error al cargar datos |
| `Hay errores de validación` | Campos requeridos vacíos o fechas inválidas |

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

**Repositorio:** https://github.com/cvalverdem/custom-data-table
**Reportar Issues:** https://github.com/cvalverdem/custom-data-table/issues