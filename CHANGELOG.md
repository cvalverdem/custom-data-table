# Historial de cambios

## 1.5.2

### Agregado

- **`tableName`:** define cómo se nombra la tabla en el aviso de arriba del formulario.

### Cambiado

- **Mensaje de campos obligatorios:** ahora indica las filas, por ejemplo `Faltan campos obligatorios en la fila 2`.
- **`blockSaveOnError: false`:** las filas incompletas ahora se guardan tal como están. Antes se perdían todos los cambios sin guardar de la tabla.
- **Estados de solo lectura:** no se puede guardar el cambio a uno de estos estados si la tabla tiene filas incompletas sin guardar.

### Corregido

- **Cambio de pestaña:** las filas incompletas se conservan al cambiar de pestaña en el formulario.
- **Aviso obsoleto:** el aviso de arriba del formulario ya no queda activo después de que la tabla se recarga sin cambios pendientes.
- **Barra de desplazamiento:** ya no aparece una barra vertical en el control, porque ahora toma la altura completa de la tabla.

## 1.5.1

### Corregido

- **Calendario:** se cierra cuando la tabla pierde el foco, por ejemplo al hacer clic en otra parte del formulario.

## 1.5

### Agregado

- **Reordenar filas:** se arrastran desde el asa ⠿, o con las flechas ↑ ↓ con el asa enfocada.
- **Duplicar e insertar:** nuevas acciones por fila.
- **`rowActions`:** elige qué acciones se muestran.
- **`readOnlyStates`:** bloquea la tabla en los estados indicados. También se bloquea si el formulario está en solo lectura.
- **`defaultFromPrevious`:** una fila nueva puede tomar valores de la fila anterior.
- **`blockSaveOnError`:** define si los errores de la tabla impiden guardar el elemento de trabajo.
- **Ajuste de altura:** el control se adapta al tamaño de la tabla, también al agrandar un campo de texto.

### Cambiado

- **Guardado con errores:** se bloquea por defecto después de editar la tabla.
- **JSON inválido:** la tabla muestra un aviso y no lee ni escribe el campo. Antes usaba columnas por defecto.
- **Acciones:** el botón *Eliminar* ahora es un ícono, y las acciones tienen colores para distinguirlas.
- **Nombre del control:** ahora es "Tabla de datos".
- **Idioma:** las opciones del control y la configuración por defecto están en español.
- **Ícono:** nuevo, con la identidad de Grupo Promerica.
- **Paquete:** solo incluye los archivos necesarios.
- **Código:** una sola implementación en TypeScript, sin jQuery, DataTables ni select2.
- **Documentación:** la guía se reescribió por tipo de lector y se agregó este historial.

### Corregido

- **Listas:** las columnas `dropdown` tienen una opción vacía para que `required` funcione, y conservan los valores que ya no están en `options`.
- **Regla de fechas:** `dateOrder` se valida en todas las filas.
- **Escritura en el campo:** abrir o recargar el formulario ya no modifica el campo.
- **Fechas al teclado:** al escribir de corrido, el año ya no toma 6 dígitos y pasa a la hora.
- **Tecla Tab:** en Edge y Chrome ya no se detiene en el ícono del calendario.

### Al actualizar desde 1.4

- No hay que reinstalar la extensión ni volver a agregar el control. Los datos se conservan.
- Revisa el JSON de cada control: si es inválido, la tabla dejará de mostrarse hasta corregirlo.
- Si no quieres bloquear el guardado, agrega `"blockSaveOnError": false`.
- Si aún no tienes una copia de la versión anterior, descárgala antes de actualizar.

## 1.4 y anteriores

- Tipos de dato `string`, `textArea`, `number`, `boolean`, `date` y `dropdown`.
- Campos obligatorios y regla de fechas `dateOrder`.
- Escritura automática en el campo al editar la tabla.
- Configuración de fuente y tamaño.
