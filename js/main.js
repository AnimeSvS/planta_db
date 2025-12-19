// main.js - VERSIÓN SIMPLIFICADA
document.addEventListener('DOMContentLoaded', async function () {
    try {
        console.log('🚀 Inicializando aplicación...');

        // Inicializar gestor de eventos
        if (typeof eventManager !== 'undefined') {
            eventManager.init();
        }

        // Inicializar sistema
        if (typeof inicializarSistema === 'function') {
            await inicializarSistema();
        }

        // Cargar inventario si está en la pestaña activa
        if (document.getElementById('inventario').classList.contains('active')) {
            if (typeof inicializarInventario === 'function') {
                setTimeout(() => inicializarInventario(), 500);
            }
        }

        console.log('✅ Aplicación inicializada');

    } catch (error) {
        console.error('❌ Error al inicializar aplicación:', error);
        eventManager?.showToast('Error al inicializar aplicación', 'error');
    }
});