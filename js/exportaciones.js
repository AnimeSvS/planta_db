// exportaciones.js

// Función para imprimir tabla
// function imprimirResumen(tablaId) {
//     const tabla = document.getElementById(tablaId);
//     if (!tabla || tabla.rows.length <= 1) {
//         alert('No hay datos para imprimir');
//         return;
//     }

//     const ventana = window.open('', '_blank');
//     ventana.document.write(`
//         <html>
//         <head>
//             <title>Reporte AVICRUZ SAC</title>
//             <style>
//                 body { font-family: Arial; padding: 20px; }
//                 h2 { text-align: center; }
//                 table { width: 100%; border-collapse: collapse; margin-top: 20px; }
//                 th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
//                 th { background-color: #f2f2f2; }
//             </style>
//         </head>
//         <body>
//             <h2>AVICRUZ SAC - Reporte de Inventario</h2>
//             <p>Fecha: ${new Date().toLocaleDateString('es-PE')}</p>
//             ${tabla.outerHTML}
//         </body>
//         </html>
//     `);
//     ventana.document.close();
//     ventana.print();
// }

// Función para exportar a Excel

function exportarSalidasAXLS() {
    const tabla = document.getElementById('tablaSalidas');
    if (!tabla || tabla.rows.length <= 1) {
        alert('No hay datos para exportar');
        return;
    }

    let csv = [];
    // Encabezados
    const headers = [];
    tabla.querySelectorAll('thead th').forEach(th => {
        headers.push(th.textContent.trim());
    });
    csv.push(headers.join(','));

    // Datos
    Array.from(tabla.rows).forEach(row => {
        const rowData = [];
        Array.from(row.cells).forEach(cell => {
            rowData.push(cell.textContent.trim());
        });
        csv.push(rowData.join(','));
    });

    // Descargar
    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `salidas_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
}
// exportaciones.js - AGREGAR

// Función para exportar registros a Excel
async function exportarRegistrosAXLS() {
    const fechaStr = document.getElementById('buscarFecha').value;
    const fecha = fechaInputADate(fechaStr) || new Date();

    const inicioDia = getInicioDelDia(fecha);
    const finDia = getFinDelDia(fecha);

    const snapshot = await registrosRef
        .where('fecha', '>=', firebase.firestore.Timestamp.fromDate(inicioDia))
        .where('fecha', '<', firebase.firestore.Timestamp.fromDate(finDia))
        .orderBy('fecha')
        .get();

    const dataArray = snapshot.docs.map(doc => doc.data());
    if (dataArray.length === 0) {
        alert('No hay datos para exportar en la fecha seleccionada.');
        return;
    }

    // Construir tabla HTML para Excel
    let tablaContenido = '<table border="1"><thead><tr>';
    const columnas = ['ID', 'Fecha', 'Producto', 'Jabas', 'Kg/Jaba', 'Total Jabas', 'Pollos/Jaba', 'Total Pollos', 'Bruto', 'Neto', 'Promedio'];
    columnas.forEach(col => tablaContenido += `<th>${col}</th>`);
    tablaContenido += '</tr></thead><tbody>';

    dataArray.forEach(d => {
        const pesoJaba = d.pesoJaba || 0;
        const { totalJ, cPollos, neto, prom } = calcular(d.cantidadJabas, d.pollosPorJaba, d.pesoBruto, pesoJaba);

        tablaContenido += `<tr>
            <td>${d.id}</td><td>${formatearFecha(d.fecha)}</td><td>${d.producto}</td>
            <td>${d.cantidadJabas}</td><td>${pesoJaba.toFixed(2)} KG</td><td>${totalJ.toFixed(2)} KG</td>
            <td>${d.pollosPorJaba}</td><td>${cPollos}</td><td>${d.pesoBruto.toFixed(2)} KG</td>
            <td>${neto.toFixed(2)} KG</td><td>${prom.toFixed(3)} KG</td>
        </tr>`;
    });

    tablaContenido += '</tbody></table>';

    // Crear y descargar archivo
    const blob = new Blob([`
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head><meta charset="UTF-8"></head><body>${tablaContenido}</body></html>
    `], { type: 'application/vnd.ms-excel' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registros_${new Date().toISOString().slice(0, 10)}.xls`;
    a.click();
    URL.revokeObjectURL(url);
}
// exportaciones.js - AGREGAR

// Función para exportar salidas a Excel
async function exportarSalidasAXLS() {
    const fechaStr = document.getElementById('buscarFechaSalidas')?.value || '';

    let dataArray = [];

    if (fechaStr) {
        // Exportar por fecha específica
        const fecha = fechaInputADate(fechaStr);
        const inicioDia = getInicioDelDia(fecha);
        const finDia = getFinDelDia(fecha);

        const snapshot = await salidasRef
            .where('fecha', '>=', firebase.firestore.Timestamp.fromDate(inicioDia))
            .where('fecha', '<', firebase.firestore.Timestamp.fromDate(finDia))
            .orderBy('fecha', 'desc')
            .get();

        dataArray = snapshot.docs.map(doc => doc.data());
    } else {
        // Exportar todas las salidas (usando paginación completa)
        const snapshot = await salidasRef
            .orderBy('fecha', 'desc')
            .get();

        dataArray = snapshot.docs.map(doc => doc.data());
    }

    if (dataArray.length === 0) {
        alert('No hay datos para exportar');
        return;
    }

    // Construir tabla HTML para Excel
    let tablaContenido = '<table border="1"><thead><tr>';
    const columnas = ['ID', 'Fecha', 'Producto', 'Tienda', 'Tinas', 'Kg/Tina', 'Pollos/Tina', 'Total Pollos', 'Bruto', 'Neto', 'Promedio'];
    columnas.forEach(col => tablaContenido += `<th>${col}</th>`);
    tablaContenido += '</tr></thead><tbody>';

    dataArray.forEach(d => {
        tablaContenido += `<tr>
            <td>${d.id || ''}</td>
            <td>${formatearFecha(d.fecha)}</td>
            <td>${d.producto || 'POLLO BENEFICIADO'}</td>
            <td>${d.tienda || ''}</td>
            <td>${d.tinas || 0}</td>
            <td>${(d.kgPorTina || 0).toFixed(2)}</td>
            <td>${d.pollosPorTina || 0}</td>
            <td>${d.totalPollos || 0}</td>
            <td>${(d.bruto || 0).toFixed(2)}</td>
            <td>${(d.pesoNeto || 0).toFixed(2)}</td>
            <td>${(d.promedio || 0).toFixed(3)}</td>
        </tr>`;
    });

    tablaContenido += '</tbody></table>';

    // Crear y descargar archivo
    const blob = new Blob([`
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head><meta charset="UTF-8"></head><body>${tablaContenido}</body></html>
    `], { type: 'application/vnd.ms-excel' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salidas_${new Date().toISOString().slice(0, 10)}.xls`;
    a.click();
    URL.revokeObjectURL(url);
}

// Funciones para buscar y limpiar salidas
async function buscarSalidasPorFecha() {
    const fechaStr = document.getElementById('buscarFechaSalidas').value;
    if (!fechaStr) {
        alert('Seleccione una fecha para buscar');
        return;
    }
    const fecha = fechaInputADate(fechaStr);

    const inicioDia = getInicioDelDia(fecha);
    const finDia = getFinDelDia(fecha);

    const snapshot = await salidasRef
        .where('fecha', '>=', firebase.firestore.Timestamp.fromDate(inicioDia))
        .where('fecha', '<', firebase.firestore.Timestamp.fromDate(finDia))
        .orderBy('fecha', 'desc')
        .get();

    const tbody = document.getElementById('tablaSalidas');
    tbody.innerHTML = '';

    // ... código para renderizar tabla ...
}

function limpiarBusquedaSalidas() {
    document.getElementById('buscarFechaSalidas').value = '';
    cargarSalidas();
}

// Hacer disponibles globalmente
window.exportarSalidasAXLS = exportarSalidasAXLS;
window.buscarSalidasPorFecha = buscarSalidasPorFecha;
window.limpiarBusquedaSalidas = limpiarBusquedaSalidas;
window.exportarRegistrosAXLS = exportarRegistrosAXLS;
// Hacer funciones disponibles globalmente
// window.imprimirResumen = imprimirResumen;
window.exportarDatosDiaAXLS = exportarDatosDiaAXLS;