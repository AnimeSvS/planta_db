// inicializacion.js - MODIFICADO para incluir reporte de tiendas

async function inicializarSistema() {
    try {
        console.log('🔄 Inicializando sistema...');

        // 1. Cargar registros
        if (typeof cargarPaginaRegistros === 'function') {
            await cargarPaginaRegistros(new Date(), 'primera');
            console.log('✅ Registros cargados con paginación');
        }

        // 2. Cargar salidas con paginación
        if (typeof cargarPaginaSalidas === 'function') {
            await cargarPaginaSalidas('primera');
            console.log('✅ Salidas cargadas con paginación');
        }

  

        // 4. Verificar stock bajo
        if (typeof verificarStockBajo === 'function') {
            await verificarStockBajo();
            console.log('✅ Stock verificado');
        }

        // 5. Agregar botón de exportación en reporte de tiendas
        if (typeof agregarBotonExportarReporte === 'function') {
            agregarBotonExportarReporte();
            console.log('✅ Botón de exportación agregado');
        }

        console.log('🎉 Sistema inicializado correctamente');

    } catch (error) {
        console.error('❌ Error al inicializar sistema:', error);
    }
}
// inicializacion.js - Actualizar para incluir dashboard

async function inicializarSistema() {
    try {
        console.log('🔄 Inicializando sistema...');

        // 1. Cargar registros
        if (typeof cargarPaginaRegistros === 'function') {
            await cargarPaginaRegistros(new Date(), 'primera');
            console.log('✅ Registros cargados con paginación');
        }

        // 2. Cargar salidas con paginación
        if (typeof cargarPaginaSalidas === 'function') {
            await cargarPaginaSalidas('primera');
            console.log('✅ Salidas cargadas con paginación');
        }

    
  

        // 5. Verificar stock bajo
        if (typeof verificarStockBajo === 'function') {
            await verificarStockBajo();
            console.log('✅ Stock verificado');
        }

        // 6. Agregar botón de exportación en reporte de tiendas
        if (typeof agregarBotonExportarReporte === 'function') {
            agregarBotonExportarReporte();
            console.log('✅ Botón de exportación agregado');
        }

        console.log('🎉 Sistema inicializado correctamente');

    } catch (error) {
        console.error('❌ Error al inicializar sistema:', error);
    }
}
// Hacer función disponible globalmente
window.inicializarSistema = inicializarSistema;