// js/reporte-tiendas.js
// Manejo del reporte de tiendas

document.addEventListener('DOMContentLoaded', function () {
    const formReporteTiendas = document.getElementById('formReporteTiendas');
    const reporteFechaInput = document.getElementById('reporteFecha');

    // Establecer fecha actual por defecto
    const hoy = new Date();
    reporteFechaInput.value = hoy.toISOString().split('T')[0];

    // Manejar envío del formulario de reporte
    if (formReporteTiendas) {
        formReporteTiendas.addEventListener('submit', function (e) {
            e.preventDefault();
            e.stopPropagation();

            if (this.checkValidity()) {
                generarReporteTiendas();
            }

            this.classList.add('was-validated');
        });
    }
});

// Función para generar reporte de tiendas
async function generarReporteTiendas() {
    const fecha = document.getElementById('reporteFecha').value;
    const tiendaSeleccionada = document.getElementById('reporteTienda').value;

    if (!fecha) {
        mostrarAlerta('error', 'Por favor seleccione una fecha');
        return;
    }

    try {
        // Obtener todas las salidas de la fecha seleccionada
        const salidas = await obtenerSalidasPorFecha(fecha);

        if (salidas.length === 0) {
            mostrarResultadoVacio(fecha, tiendaSeleccionada);
            return;
        }

        // Filtrar por tienda si se seleccionó una específica
        let salidasFiltradas = salidas;
        if (tiendaSeleccionada) {
            salidasFiltradas = salidas.filter(salida =>
                salida.tienda === tiendaSeleccionada
            );
        }

        // Agrupar por tienda y calcular totales
        const reporte = agruparPorTienda(salidasFiltradas);

        // Mostrar el reporte en la tabla
        mostrarReporteEnTabla(reporte, fecha, tiendaSeleccionada);

    } catch (error) {
        console.error('Error generando reporte:', error);
        mostrarAlerta('error', 'Error al generar el reporte');
    }
}

// Función para obtener salidas por fecha
async function obtenerSalidasPorFecha(fecha) {
    try {
        const inicioDia = new Date(fecha + 'T00:00:00');
        const finDia = new Date(fecha + 'T23:59:59');

        const snapshot = await salidasRef
            .where('fecha', '>=', firebase.firestore.Timestamp.fromDate(inicioDia))
            .where('fecha', '<=', firebase.firestore.Timestamp.fromDate(finDia))
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error obteniendo salidas por fecha:', error);
        throw error;
    }
}

// Función para agrupar salidas por tienda
function agruparPorTienda(salidas) {
    const reporte = {};

    salidas.forEach(salida => {
        const tienda = salida.tienda || 'Sin destino';

        if (!reporte[tienda]) {
            reporte[tienda] = {
                totalPollos: 0,
                totalPeso: 0,
                registros: 0
            };
        }

        reporte[tienda].totalPollos += salida.totalPollos || 0;
        reporte[tienda].totalPeso += salida.pesoNeto || 0;
        reporte[tienda].registros += 1;
    });

    return reporte;
}

// Función para mostrar el reporte en la tabla
function mostrarReporteEnTabla(reporte, fecha, tiendaSeleccionada) {
    const tablaReporteTiendas = document.getElementById('tablaReporteTiendas');

    if (Object.keys(reporte).length === 0) {
        mostrarResultadoVacio(fecha, tiendaSeleccionada);
        return;
    }

    // Limpiar tabla
    tablaReporteTiendas.innerHTML = '';

    // Variables para totales generales
    let totalGeneralPollos = 0;
    let totalGeneralPeso = 0;
    let totalRegistros = 0;

    // Crear filas para cada tienda
    Object.entries(reporte).forEach(([tienda, datos]) => {
        totalGeneralPollos += datos.totalPollos;
        totalGeneralPeso += datos.totalPeso;
        totalRegistros += datos.registros;

        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td><strong>${tienda}</strong></td>
            <td>${datos.totalPollos.toLocaleString()}</td>
            <td>${datos.totalPeso.toFixed(2)} KG</td>
        `;
        tablaReporteTiendas.appendChild(fila);
    });

    // Agregar fila de totales generales
    const filaTotales = document.createElement('tr');
    filaTotales.classList.add('table-info', 'fw-bold');
    filaTotales.innerHTML = `
        <td>TOTAL GENERAL</td>
        <td>${totalGeneralPollos.toLocaleString()} pollos</td>
        <td>${totalGeneralPeso.toFixed(2)} KG</td>
    `;
    tablaReporteTiendas.appendChild(filaTotales);

    // Agregar información de resumen
    const filaResumen = document.createElement('tr');
    filaResumen.classList.add('table-light');
    const tiendaInfo = tiendaSeleccionada ? `Tienda: ${tiendaSeleccionada}` : 'Todas las tiendas';
    filaResumen.innerHTML = `
        <td colspan="3" class="text-muted small">
            <span class="badge bg-primary">${totalRegistros} registros</span>
            <span class="badge bg-success ms-2">${Object.keys(reporte).length} tiendas</span>
            <span class="badge bg-info ms-2">Fecha: ${fecha}</span>
            <span class="badge bg-warning ms-2">${tiendaInfo}</span>
        </td>
    `;
    tablaReporteTiendas.appendChild(filaResumen);
}

// Función para mostrar resultado vacío
function mostrarResultadoVacio(fecha, tiendaSeleccionada) {
    const tablaReporteTiendas = document.getElementById('tablaReporteTiendas');

    let mensaje = `No hay salidas registradas para la fecha ${fecha}`;

    if (tiendaSeleccionada) {
        mensaje = `No hay salidas registradas para ${tiendaSeleccionada} en la fecha ${fecha}`;
    }

    tablaReporteTiendas.innerHTML = `
        <tr>
            <td colspan="3" class="text-muted py-4">
                <div class="text-center">
                    <i style="font-size: 2rem;">📭</i>
                    <p class="mt-2">${mensaje}</p>
                </div>
            </td>
        </tr>
    `;
}

// Función para mostrar alertas
function mostrarAlerta(tipo, mensaje) {
    // Crear elemento de alerta
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo === 'error' ? 'danger' : 'success'} alert-dismissible fade show position-fixed`;
    alerta.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
    `;
    alerta.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(alerta);

    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
        if (alerta.parentNode) {
            alerta.remove();
        }
    }, 5000);
}

// Agregar botón de exportación al HTML
// Función para agregar botón de exportación al HTML
function agregarBotonExportarReporte() {
    const cardReporte = document.querySelector('#reporteTiendas .card.p-4:last-child');
    if (!cardReporte) {
        console.warn('No se encontró el card del reporte');
        return;
    }

    const titulo = cardReporte.querySelector('h5');
    if (!titulo) {
        console.warn('No se encontró el título del reporte');
        return;
    }

    // Verificar si ya existe el botón
    if (document.getElementById('btnExportarReporteExcel')) {
        console.log('El botón de exportación ya existe');
        return;
    }

    // Crear contenedor para botones
    const contenedorBotones = document.createElement('div');
    contenedorBotones.className = 'd-flex justify-content-end gap-2 mb-3';

    // Botón de exportar a Excel
    const btnExportarExcel = document.createElement('button');
    btnExportarExcel.id = 'btnExportarReporteExcel';
    btnExportarExcel.className = 'btn btn-success btn-sm';
    btnExportarExcel.innerHTML = '<span>📊 Exportar a Excel</span>';
    btnExportarExcel.onclick = exportarReporteTiendasExcel;

    // Botón de exportar a CSV (alternativa)
    const btnExportarCSV = document.createElement('button');
    btnExportarCSV.className = 'btn btn-secondary btn-sm';
    btnExportarCSV.innerHTML = '<span>📄 Exportar a CSV</span>';
    btnExportarCSV.onclick = exportarReporteTiendasCSV;

    contenedorBotones.appendChild(btnExportarExcel);
    contenedorBotones.appendChild(btnExportarCSV);

    // Insertar después del título
    titulo.insertAdjacentElement('afterend', contenedorBotones);

    console.log('✅ Botones de exportación agregados');
}
// Función para exportar reporte a Excel
// Función para exportar reporte a Excel - VERSIÓN CORREGIDA
async function exportarReporteTiendasExcel() {
    console.log('📤 Iniciando exportación del reporte...');

    const fecha = document.getElementById('reporteFecha').value;
    const tienda = document.getElementById('reporteTienda').value || 'TODAS';
    const tabla = document.getElementById('tablaReporteTiendas');

    console.log('📊 Datos para exportar:', { fecha, tienda, tablaExiste: !!tabla });

    // Verificar si hay datos para exportar
    if (!tabla) {
        mostrarAlerta('error', 'No se encontró la tabla de datos');
        return;
    }

    // Verificar si hay contenido en la tabla (excluyendo el mensaje de "Seleccione una fecha")
    const primeraCelda = tabla.rows[0]?.cells[0]?.textContent || '';
    if (tabla.rows.length === 0 ||
        primeraCelda.includes('Seleccione') ||
        primeraCelda.includes('No hay') ||
        primeraCelda.includes('Cargando')) {
        mostrarAlerta('error', 'No hay datos para exportar. Genere el reporte primero.');
        return;
    }

    try {
        // Crear libro de Excel usando SheetJS (xlsx)
        const wb = XLSX.utils.book_new();

        // Preparar datos para la hoja
        const datos = [];

        // 1. Título y metadata
        datos.push(['REPORTE DE TIENDAS - AVICRUZ SAC']);
        datos.push([]); // Línea vacía
        datos.push(['Fecha del reporte:', fecha]);
        datos.push(['Tienda filtrada:', tienda]);
        datos.push(['Generado:', new Date().toLocaleString('es-PE')]);
        datos.push([]); // Línea vacía

        // 2. Encabezados de la tabla
        const encabezados = ['TIENDA', 'TOTAL POLLOS', 'PESO TOTAL (KG)'];
        datos.push(encabezados);

        // 3. Datos de la tabla (excluyendo filas de totales y resumen)
        const filas = tabla.querySelectorAll('tbody tr');
        let tieneDatos = false;

        filas.forEach(fila => {
            const celdas = fila.cells;
            if (celdas.length >= 3) {
                const textoPrimeraCelda = celdas[0].textContent.trim();

                // Ignorar filas de totales, resumen o sin datos
                if (!textoPrimeraCelda.includes('TOTAL') &&
                    !textoPrimeraCelda.includes('Seleccione') &&
                    !textoPrimeraCelda.includes('No hay') &&
                    textoPrimeraCelda !== '') {

                    const filaDatos = [];

                    // Columna 1: Tienda
                    filaDatos.push(textoPrimeraCelda);

                    // Columna 2: Total Pollos (convertir a número)
                    const pollosText = celdas[1].textContent.trim();
                    const pollosNum = pollosText.replace(/[^\d]/g, '') || '0';
                    filaDatos.push(parseInt(pollosNum) || 0);

                    // Columna 3: Peso Total (extraer número)
                    const pesoText = celdas[2].textContent.trim();
                    const pesoNum = parseFloat(pesoText.replace(/[^\d.]/g, '')) || 0;
                    filaDatos.push(pesoNum);

                    datos.push(filaDatos);
                    tieneDatos = true;
                }
            }
        });

        if (!tieneDatos) {
            mostrarAlerta('error', 'No hay datos válidos para exportar');
            return;
        }

        // 4. Agregar totales si existen
        const filasArray = Array.from(filas);
        const filaTotales = filasArray.find(fila =>
            fila.cells[0]?.textContent.includes('TOTAL GENERAL')
        );

        if (filaTotales) {
            datos.push([]); // Línea vacía
            datos.push(['TOTAL GENERAL',
                parseInt(filaTotales.cells[1]?.textContent.replace(/[^\d]/g, '') || '0'),
                parseFloat(filaTotales.cells[2]?.textContent.replace(/[^\d.]/g, '') || '0')
            ]);
        }

        console.log('📝 Datos preparados para Excel:', datos);

        // Crear hoja de cálculo
        const ws = XLSX.utils.aoa_to_sheet(datos);

        // Ajustar ancho de columnas
        const wscols = [
            { wch: 30 }, // Tienda
            { wch: 15 }, // Total Pollos
            { wch: 20 }  // Peso Total
        ];
        ws['!cols'] = wscols;

        // Agregar estilo a las cabeceras (opcional)
        if (!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }); // Fusionar título

        // Agregar hoja al libro
        XLSX.utils.book_append_sheet(wb, ws, 'Reporte Tiendas');

        // Generar nombre de archivo
        const nombreArchivo = `Reporte_Tiendas_${fecha}_${tienda.replace(/\s+/g, '_')}.xlsx`;
        console.log('💾 Guardando archivo:', nombreArchivo);

        // Escribir archivo
        XLSX.writeFile(wb, nombreArchivo);

        mostrarAlerta('success', `✅ Reporte exportado: ${nombreArchivo}`);

    } catch (error) {
        console.error('❌ Error al exportar a Excel:', error);
        mostrarAlerta('error', `Error al exportar: ${error.message}`);
    }
}

// Función alternativa usando CSV (más simple y confiable)
function exportarReporteTiendasCSV() {
    console.log('📤 Exportando a CSV...');

    const fecha = document.getElementById('reporteFecha').value;
    const tienda = document.getElementById('reporteTienda').value || 'TODAS';
    const tabla = document.getElementById('tablaReporteTiendas');

    // Verificar datos
    if (!tabla || tabla.rows.length === 0) {
        mostrarAlerta('error', 'No hay datos para exportar');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";

    // Encabezado del archivo
    csvContent += "REPORTE DE TIENDAS - AVICRUZ SAC\r\n";
    csvContent += `Fecha: ${fecha}\r\n`;
    csvContent += `Tienda: ${tienda}\r\n`;
    csvContent += `Generado: ${new Date().toLocaleString()}\r\n\r\n`;

    // Encabezados de la tabla
    csvContent += "TIENDA,TOTAL POLLOS,PESO TOTAL (KG)\r\n";

    // Datos de la tabla
    const filas = tabla.querySelectorAll('tbody tr');
    let tieneDatos = false;

    filas.forEach(fila => {
        const celdas = fila.cells;
        if (celdas.length >= 3) {
            const tiendaTexto = celdas[0].textContent.trim();

            // Solo exportar datos reales (no mensajes ni totales)
            if (tiendaTexto &&
                !tiendaTexto.includes('Seleccione') &&
                !tiendaTexto.includes('No hay') &&
                !tiendaTexto.includes('TOTAL')) {

                const pollos = celdas[1].textContent.trim().replace(/[^\d]/g, '') || '0';
                const peso = celdas[2].textContent.trim().replace(/[^\d.]/g, '') || '0';

                csvContent += `"${tiendaTexto}",${pollos},${peso}\r\n`;
                tieneDatos = true;
            }
        }
    });

    if (!tieneDatos) {
        mostrarAlerta('error', 'No hay datos válidos para exportar');
        return;
    }

    // Agregar línea de totales si existe
    const filasArray = Array.from(filas);
    const filaTotales = filasArray.find(fila =>
        fila.cells[0]?.textContent.includes('TOTAL GENERAL')
    );

    if (filaTotales) {
        csvContent += "\r\n";
        csvContent += `"TOTAL GENERAL",${filaTotales.cells[1]?.textContent.replace(/[^\d]/g, '') || '0'},${filaTotales.cells[2]?.textContent.replace(/[^\d.]/g, '') || '0'}\r\n`;
    }

    // Crear enlace de descarga
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_Tiendas_${fecha}_${tienda.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);

    console.log('💾 Descargando archivo CSV...');
    link.click();
    document.body.removeChild(link);

    mostrarAlerta('success', '✅ Reporte exportado exitosamente (CSV)');
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', function () {
    // Generar reporte automáticamente al cargar la página
    setTimeout(() => {
        generarReporteTiendas();
    }, 500);

    // Agregar botón de exportación
    agregarBotonExportarReporte();

    // Configurar evento para cambiar entre pestañas
    const tabButtons = document.querySelectorAll('#tabMenu button[data-bs-toggle="tab"]');
    tabButtons.forEach(button => {
        button.addEventListener('shown.bs.tab', function (event) {
            const targetId = event.target.getAttribute('data-bs-target');

            if (targetId === '#reporteTiendas') {
                // Generar reporte automáticamente al cambiar a la pestaña
                setTimeout(generarReporteTiendas, 100);
            }
        });
    });
});

// Hacer funciones disponibles globalmente
window.generarReporteTiendas = generarReporteTiendas;
window.exportarReporteTiendasExcel = exportarReporteTiendasExcel;