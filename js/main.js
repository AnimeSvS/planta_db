// main.js

document.getElementById('btnLimpiarBusqueda').addEventListener('click', () => {
    document.getElementById('buscarFecha').value = '';
    cargarDatosInicial();
});

document.getElementById('btnImprimir').addEventListener('click', () => {
    imprimirResumen('tablaRegistros');
});

document.getElementById('btnExportarExcel').addEventListener('click', () => {
    exportarDatosDiaAXLS();
});

document.getElementById('btnBuscarFecha').addEventListener('click', () => {
    const fechaStr = document.getElementById('buscarFecha').value;
    if (!fechaStr) {
        alert('Seleccione una fecha para buscar');
        return;
    }
    const fecha = fechaInputADate(fechaStr);
    cargarPaginaRegistros(fecha, 'primera'); // Llamamos a cargar los registros desde la fecha seleccionada
    cargarDatosPorDia(fecha, 'eliminados', 'tablaEliminados');  // Opcional: Si tienes que cargar eliminados
});
document.getElementById('formReporteTiendas')
    ?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fecha = document.getElementById('reporteFecha').value;
        const tienda = document.getElementById('reporteTienda').value;

        if (!fecha) {
            alert('Seleccione una fecha');
            return;
        }

        await mostrarReporteTiendas(new Date(fecha), tienda);
    });

async function cargarDashboard() {
    const { totalPollos, totalPeso } = await obtenerTotalesDashboard();
    document.getElementById('totalPollos').textContent = totalPollos;
    document.getElementById('totalPeso').textContent = totalPeso.toFixed(2) + ' KG';
}


window.addEventListener('load', () => {
    cargarDashboard();
});

document.getElementById('btnVerReporte').addEventListener('click', async () => {
    const fecha = document.getElementById('fechaReporte').value;
    if (!fecha) {
        alert('Por favor seleccione una fecha.');
        return;
    }

    const fechaObj = new Date(fecha);
    await mostrarReporteTiendas(fechaObj);
});
window.addEventListener('load', () => {
    verificarStockBajo();
});
window.addEventListener('load', () => {
    cargarDashboard();
});
