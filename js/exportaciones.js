// // exportaciones-unificadas.js - VERSIÓN XLS MEJORADA

// // ============================================
// // EXPORTACIÓN DE REGISTROS (INGRESOS) A XLS
// // ============================================
// async function exportarRegistrosAXLS() {
//     try {
//         console.log('📊 Exportando registros a XLS...');

//         // Obtener datos de la tabla actual (no de Firebase)
//         const tabla = document.getElementById('tablaRegistros');
//         if (!tabla || tabla.rows.length === 0) {
//             mostrarNotificacion('⚠️ No hay datos para exportar', 'warning');
//             return;
//         }

//         // Preparar datos manteniendo la estructura de la tabla
//         const datos = [];

//         // 1. Encabezados de la tabla
//         const encabezados = [];
//         const thElements = document.querySelectorAll('#tablaRegistros').closest('table')?.querySelectorAll('thead th');

//         if (thElements && thElements.length > 0) {
//             thElements.forEach(th => {
//                 encabezados.push(th.textContent.trim());
//             });
//         } else {
//             // Encabezados por defecto si no se encuentran
//             encabezados.push(['ID', 'Fecha y Hora', 'Producto', 'Jabas', 'Kg/Jaba', 'Total Jabas',
//                 'Pollos/Jaba', 'Total Pollos', 'Bruto', 'Neto', 'Promedio']);
//         }
//         datos.push(encabezados);

//         // 2. Datos de la tabla
//         const filas = tabla.getElementsByTagName('tr');
//         for (let fila of filas) {
//             const celdas = fila.getElementsByTagName('td');
//             if (celdas.length === 0) continue;

//             const filaDatos = [];
//             for (let celda of celdas) {
//                 // Obtener texto limpio (sin botones de editar/eliminar)
//                 let texto = celda.textContent.trim();
//                 // Remover iconos de editar/eliminar si están presentes
//                 texto = texto.replace(/✏️|🗑️/g, '').trim();
//                 filaDatos.push(texto || '');
//             }
//             datos.push(filaDatos);
//         }

//         // 3. Crear libro de Excel
//         const ws = XLSX.utils.aoa_to_sheet(datos);

//         // Ajustar anchos de columnas
//         const colWidths = [];
//         datos[0].forEach((_, idx) => {
//             let maxLength = 0;
//             datos.forEach(fila => {
//                 const cellValue = fila[idx] || '';
//                 maxLength = Math.max(maxLength, cellValue.toString().length);
//             });
//             colWidths.push({ wch: Math.min(maxLength + 2, 50) }); // Máximo 50 caracteres
//         });
//         ws['!cols'] = colWidths;

//         // 4. Crear libro y descargar
//         const wb = XLSX.utils.book_new();
//         XLSX.utils.book_append_sheet(wb, ws, 'Registros');

//         // Nombre del archivo con fecha
//         const fechaActual = new Date().toISOString().split('T')[0];
//         XLSX.writeFile(wb, `registros_ingresos_${fechaActual}.xlsx`);

//         mostrarNotificacion('✅ Registros exportados a Excel correctamente', 'success');

//     } catch (error) {
//         console.error('❌ Error exportando registros:', error);
//         mostrarNotificacion('❌ Error al exportar registros', 'error');
//     }
// }

// // ============================================
// // EXPORTACIÓN DE SALIDAS A XLS
// // ============================================
// async function exportarSalidasAXLS() {
//     try {
//         console.log('📊 Exportando salidas a XLS...');

//         // Obtener datos de la tabla actual
//         const tabla = document.getElementById('tablaSalidas');
//         if (!tabla || tabla.rows.length === 0) {
//             mostrarNotificacion('⚠️ No hay datos para exportar', 'warning');
//             return;
//         }

//         // Preparar datos manteniendo la estructura de la tabla
//         const datos = [];

//         // 1. Encabezados de la tabla
//         const encabezados = [];
//         const thElements = document.querySelectorAll('#tablaSalidas').closest('table')?.querySelectorAll('thead th');

//         if (thElements && thElements.length > 0) {
//             thElements.forEach(th => {
//                 encabezados.push(th.textContent.trim());
//             });
//         } else {
//             // Encabezados por defecto
//             encabezados.push(['ID', 'Fecha y Hora', 'Producto', 'Tinas', 'Kg/Tina', 'Total Tinas',
//                 'Pollos/Tina', 'Total Pollos', 'Bruto', 'Neto', 'Promedio']);
//         }
//         datos.push(encabezados);

//         // 2. Datos de la tabla
//         const filas = tabla.getElementsByTagName('tr');
//         for (let fila of filas) {
//             const celdas = fila.getElementsByTagName('td');
//             if (celdas.length === 0) continue;

//             const filaDatos = [];
//             for (let celda of celdas) {
//                 let texto = celda.textContent.trim();
//                 texto = texto.replace(/✏️|🗑️/g, '').trim();
//                 filaDatos.push(texto || '');
//             }
//             datos.push(filaDatos);
//         }

//         // 3. Crear libro de Excel
//         const ws = XLSX.utils.aoa_to_sheet(datos);

//         // Ajustar anchos de columnas
//         const colWidths = [];
//         datos[0].forEach((_, idx) => {
//             let maxLength = 0;
//             datos.forEach(fila => {
//                 const cellValue = fila[idx] || '';
//                 maxLength = Math.max(maxLength, cellValue.toString().length);
//             });
//             colWidths.push({ wch: Math.min(maxLength + 2, 50) });
//         });
//         ws['!cols'] = colWidths;

//         // 4. Crear libro y descargar
//         const wb = XLSX.utils.book_new();
//         XLSX.utils.book_append_sheet(wb, ws, 'Salidas');

//         const fechaActual = new Date().toISOString().split('T')[0];
//         XLSX.writeFile(wb, `salidas_pollos_${fechaActual}.xlsx`);

//         mostrarNotificacion('✅ Salidas exportadas a Excel correctamente', 'success');

//     } catch (error) {
//         console.error('❌ Error exportando salidas:', error);
//         mostrarNotificacion('❌ Error al exportar salidas', 'error');
//     }
// }

// // ============================================
// // EXPORTACIÓN DE INVENTARIO A XLS
// // ============================================
// function exportarInventarioFechaExcel() {
//     try {
//         console.log('📊 Exportando inventario a XLS...');

//         // Obtener la tabla de inventario
//         const tabla = document.getElementById('tablaInventario');
//         if (!tabla || tabla.rows.length === 0) {
//             mostrarNotificacion('⚠️ No hay datos de inventario para exportar', 'warning');
//             return;
//         }

//         // Preparar datos
//         const datos = [];

//         // 1. Título y metadatos
//         datos.push(['INVENTARIO AVICRUZ SAC', '', '', '', '', '']);
//         datos.push(['Fecha:', inventarioFechaData.fechaTexto || new Date().toLocaleDateString('es-PE'), '', '', '', '']);
//         datos.push(['Precio por kg:', `S/ ${PRECIO_KG.toFixed(2)}`, '', '', '', '']);
//         datos.push([]); // Línea vacía

//         // 2. Encabezados de la tabla
//         const encabezados = ['PRODUCTO', 'STOCK (POLLOS)', 'PESO (KG)', 'VALOR ESTIMADO', 'FECHA', 'ESTADO'];
//         datos.push(encabezados);

//         // 3. Datos de la tabla (excluyendo la fila de detalle de movimientos)
//         const filas = tabla.getElementsByTagName('tr');
//         for (let fila of filas) {
//             const celdas = fila.getElementsByTagName('td');
//             if (celdas.length === 0) continue;

//             // Saltar la fila de "Ver detalle de X movimientos"
//             const rowText = fila.textContent.trim();
//             if (rowText.includes('Ver detalle') || rowText.includes('detalle de')) {
//                 continue;
//             }

//             const filaDatos = [];
//             for (let celda of celdas) {
//                 let texto = celda.textContent.trim();
//                 // Limpiar texto de badges/estados
//                 texto = texto.replace(/INGRESADO|VENDIDO|RESTANTE|DÉFICIT|EQUILIBRIO/g, '');
//                 texto = texto.trim();
//                 filaDatos.push(texto || '');
//             }
//             datos.push(filaDatos);
//         }

//         // 4. Crear libro de Excel
//         const ws = XLSX.utils.aoa_to_sheet(datos);

//         // Combinar celdas para el título
//         ws['!merges'] = [
//             XLSX.utils.decode_range("A1:F1"),
//             XLSX.utils.decode_range("A2:B2"),
//             XLSX.utils.decode_range("A3:B3")
//         ];

//         // Formato de columnas
//         const colWidths = [
//             { wch: 35 }, // PRODUCTO
//             { wch: 15 }, // STOCK
//             { wch: 15 }, // PESO
//             { wch: 20 }, // VALOR
//             { wch: 15 }, // FECHA
//             { wch: 15 }  // ESTADO
//         ];
//         ws['!cols'] = colWidths;

//         // 5. Crear libro y descargar
//         const wb = XLSX.utils.book_new();
//         XLSX.utils.book_append_sheet(wb, ws, 'Inventario');

//         const fecha = inventarioFechaData.fecha.toISOString().split('T')[0];
//         XLSX.writeFile(wb, `inventario_${fecha}.xlsx`);

//         mostrarNotificacion('✅ Inventario exportado a Excel correctamente', 'success');

//     } catch (error) {
//         console.error('❌ Error al exportar inventario:', error);
//         mostrarNotificacion('❌ Error al exportar inventario', 'error');
//     }
// }

// // ============================================
// // EXPORTACIÓN DE REPORTE TIENDAS A XLS
// // ============================================
// function exportarReporteTiendasExcel() {
//     try {
//         console.log('📊 Exportando reporte de tiendas a XLS...');

//         const tabla = document.getElementById('tablaReporteTiendas');
//         if (!tabla || tabla.rows.length === 0) {
//             mostrarNotificacion('⚠️ No hay datos para exportar', 'warning');
//             return;
//         }

//         const datos = [];

//         // 1. Título y fecha
//         const fechaReporte = document.getElementById('reporteFecha')?.value ||
//             new Date().toISOString().split('T')[0];
//         datos.push(['REPORTE DE TIENDAS - AVICRUZ SAC', '', '']);
//         datos.push(['Fecha:', fechaReporte, '']);
//         datos.push([]); // Línea vacía

//         // 2. Encabezados
//         datos.push(['TIENDA', 'TOTAL POLLOS', 'PESO TOTAL (KG)']);

//         // 3. Datos
//         const filas = tabla.getElementsByTagName('tr');
//         for (let fila of filas) {
//             const celdas = fila.getElementsByTagName('td');
//             if (celdas.length === 0) continue;

//             // Saltar fila de mensaje vacío
//             if (fila.textContent.includes('Seleccione una fecha') ||
//                 fila.textContent.includes('No hay datos')) {
//                 continue;
//             }

//             const filaDatos = [];
//             for (let celda of celdas) {
//                 filaDatos.push(celda.textContent.trim());
//             }
//             datos.push(filaDatos);
//         }

//         // 4. Crear libro de Excel
//         const ws = XLSX.utils.aoa_to_sheet(datos);

//         // Combinar celdas
//         ws['!merges'] = [
//             XLSX.utils.decode_range("A1:C1"),
//             XLSX.utils.decode_range("A2:B2")
//         ];

//         // Anchos de columna
//         ws['!cols'] = [
//             { wch: 30 }, // TIENDA
//             { wch: 15 }, // TOTAL POLLOS
//             { wch: 20 }  // PESO TOTAL
//         ];

//         const wb = XLSX.utils.book_new();
//         XLSX.utils.book_append_sheet(wb, ws, 'Reporte Tiendas');

//         const fechaActual = new Date().toISOString().split('T')[0];
//         XLSX.writeFile(wb, `reporte_tiendas_${fechaActual}.xlsx`);

//         mostrarNotificacion('✅ Reporte de tiendas exportado a Excel', 'success');

//     } catch (error) {
//         console.error('❌ Error exportando reporte de tiendas:', error);
//         mostrarNotificacion('❌ Error al exportar reporte', 'error');
//     }
// }

// // ============================================
// // FUNCIÓN DE NOTIFICACIÓN
// // ============================================
// function mostrarNotificacion(mensaje, tipo = 'info') {
//     // Si ya existe una notificación, quitarla
//     const notificacionExistente = document.getElementById('notificacionGlobal');
//     if (notificacionExistente) {
//         notificacionExistente.remove();
//     }

//     const tiposClases = {
//         'success': 'alert-success',
//         'error': 'alert-danger',
//         'warning': 'alert-warning',
//         'info': 'alert-info'
//     };

//     const clase = tiposClases[tipo] || 'alert-info';

//     const notificacionHtml = `
//         <div id="notificacionGlobal" class="alert ${clase} alert-dismissible fade show position-fixed" 
//              style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
//             ${mensaje}
//             <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
//         </div>
//     `;

//     document.body.insertAdjacentHTML('beforeend', notificacionHtml);

//     // Auto-eliminar después de 5 segundos
//     setTimeout(() => {
//         const notificacion = document.getElementById('notificacionGlobal');
//         if (notificacion) notificacion.remove();
//     }, 5000);
// }

// // ============================================
// // HACER FUNCIONES DISPONIBLES GLOBALMENTE
// // ============================================
// window.exportarRegistrosAXLS = exportarRegistrosAXLS;
// window.exportarSalidasAXLS = exportarSalidasAXLS;
// window.exportarInventarioFechaExcel = exportarInventarioFechaExcel;
// window.exportarReporteTiendasExcel = exportarReporteTiendasExcel;
// window.mostrarNotificacion = mostrarNotificacion;

// console.log('✅ Módulo de exportaciones XLS cargado');