// js/event-manager.js

// ============================================
// GESTOR UNIFICADO DE EVENTOS
// ============================================

class EventManager {
    constructor() {
        this.handlers = new Map();
        this.delegatedHandlers = new Map();
        this.initialized = false;
    }

    /**
     * Inicializar el gestor de eventos
     */
    init() {
        if (this.initialized) return;

        console.log('🚀 Inicializando gestor de eventos...');

        // Configurar delegación de eventos
        this.setupEventDelegation();

        // Configurar listeners específicos
        this.setupSpecificListeners();

        // Configurar listeners para pestañas
        this.setupTabListeners();

        this.initialized = true;
        console.log('✅ Gestor de eventos inicializado');
    }

    /**
     * Configurar delegación de eventos (patrón más eficiente)
     */
    setupEventDelegation() {
        // Delegación principal en el documento
        document.addEventListener('click', this.handleDelegatedClick.bind(this));
        document.addEventListener('submit', this.handleDelegatedSubmit.bind(this));
        document.addEventListener('change', this.handleDelegatedChange.bind(this));
        document.addEventListener('input', this.handleDelegatedInput.bind(this));
    }

    /**
     * Manejar clicks delegados
     */
    handleDelegatedClick(event) {
        const target = event.target;

        // Botones de exportación
        if (target.closest('#btnExportarExcel')) {
            event.preventDefault();
            this.safeExecute(() => exportarRegistrosAXLS(), 'Exportar registros');
            return;
        }

        if (target.closest('#btnExportarExcelSalidas')) {
            event.preventDefault();
            this.safeExecute(() => exportarSalidasAXLS(), 'Exportar salidas');
            return;
        }

        if (target.closest('#btnExportarReporteExcel')) {
            event.preventDefault();
            this.safeExecute(() => exportarReporteTiendasExcel(), 'Exportar reporte tiendas');
            return;
        }

        // Botones de búsqueda
        if (target.closest('#btnBuscarFecha')) {
            event.preventDefault();
            const fecha = document.getElementById('buscarFecha')?.value;
            if (!fecha) {
                this.showToast('Seleccione una fecha para buscar', 'warning');
                return;
            }
            this.safeExecute(() => buscarRegistrosPorFecha(fecha), 'Buscar registros');
            return;
        }

        if (target.closest('#btnBuscarFechaSalidas')) {
            event.preventDefault();
            const fecha = document.getElementById('buscarFechaSalidas')?.value;
            if (!fecha) {
                this.showToast('Seleccione una fecha para buscar', 'warning');
                return;
            }
            this.safeExecute(() => buscarSalidasPorFecha(), 'Buscar salidas');
            return;
        }

        // Botones de limpiar
        if (target.closest('#btnLimpiarBusqueda')) {
            event.preventDefault();
            this.safeExecute(() => limpiarBusquedaRegistros(), 'Limpiar búsqueda registros');
            return;
        }

        if (target.closest('#btnLimpiarBusquedaSalidas')) {
            event.preventDefault();
            this.safeExecute(() => limpiarBusquedaSalidas(), 'Limpiar búsqueda salidas');
            return;
        }

        // Botones de paginación
        if (target.closest('#btnPaginaAnterior')) {
            event.preventDefault();
            this.safeExecute(() => anteriorPagina(), 'Página anterior registros');
            return;
        }

        if (target.closest('#btnPaginaSiguiente')) {
            event.preventDefault();
            this.safeExecute(() => siguientePagina(), 'Página siguiente registros');
            return;
        }

        if (target.closest('#btnPaginaAnteriorSalidas')) {
            event.preventDefault();
            this.safeExecute(() => anteriorPaginaSalidas(), 'Página anterior salidas');
            return;
        }

        if (target.closest('#btnPaginaSiguienteSalidas')) {
            event.preventDefault();
            this.safeExecute(() => siguientePaginaSalidas(), 'Página siguiente salidas');
            return;
        }

        // Botones de inventario
        if (target.closest('[onclick*="fechaInventarioAnterior"]')) {
            event.preventDefault();
            this.safeExecute(() => fechaInventarioAnterior(), 'Fecha anterior inventario');
            return;
        }

        if (target.closest('[onclick*="fechaInventarioSiguiente"]')) {
            event.preventDefault();
            this.safeExecute(() => fechaInventarioSiguiente(), 'Fecha siguiente inventario');
            return;
        }

        if (target.closest('[onclick*="irAFechaInventario"]')) {
            event.preventDefault();
            this.safeExecute(() => irAFechaInventario(), 'Ir a fecha inventario');
            return;
        }

        if (target.closest('[onclick*="cargarInventarioFechaHoy"]')) {
            event.preventDefault();
            this.safeExecute(() => cargarInventarioFechaHoy(), 'Inventario hoy');
            return;
        }

        // Botones de acción en tablas (editar/eliminar)
        if (target.closest('.btnEditar')) {
            event.preventDefault();
            const id = target.closest('.btnEditar').dataset.id;
            this.safeExecute(() => abrirEditar({ target: { dataset: { id } } }), 'Abrir edición');
            return;
        }

        if (target.closest('.btnEliminar')) {
            event.preventDefault();
            const id = target.closest('.btnEliminar').dataset.id;
            this.safeExecute(() => eliminarRegistro({ target: { dataset: { id } } }), 'Eliminar registro');
            return;
        }

        // Botones de modal precio
        if (target.closest('[onclick*="mostrarModalPrecio"]')) {
            event.preventDefault();
            this.safeExecute(() => mostrarModalPrecio(), 'Mostrar modal precio');
            return;
        }
    }

    /**
     * Manejar submits delegados
     */
    handleDelegatedSubmit(event) {
        const form = event.target;

        // Formulario de registro principal
        if (form.id === 'formRegistro') {
            event.preventDefault();
            event.stopPropagation();

            if (!form.checkValidity()) {
                form.classList.add('was-validated');
                return;
            }

            this.safeExecute(async () => {
                await agregarRegistro(form);
                this.showToast('✅ Registro agregado exitosamente', 'success');
            }, 'Agregar registro');
            return;
        }

        // Formulario de salida
        if (form.id === 'formSalida') {
            event.preventDefault();
            event.stopPropagation();

            if (!form.checkValidity()) {
                form.classList.add('was-validated');
                return;
            }

            this.safeExecute(async () => {
                // Obtener valores
                const tinas = Number(document.getElementById('salidaJabas').value);
                const pollosPorTina = Number(document.getElementById('salidaPollosJaba').value);
                const kgPorTina = Number(document.getElementById('salidaPesoPorTina').value);
                const pesoBruto = Number(document.getElementById('salidaPesoBruto').value);
                const destinoSelect = document.getElementById('salidaDestino');
                let tienda = '';

                if (destinoSelect.value === 'OTRO') {
                    tienda = document.getElementById('otroDestino').value.trim();
                    if (!tienda) {
                        this.showToast('Ingrese un destino válido', 'warning');
                        return;
                    }
                } else {
                    tienda = destinoSelect.value;
                }

                // Mostrar confirmación
                if (typeof mostrarConfirmacionSalida === 'function') {
                    mostrarConfirmacionSalida(pesoBruto, async () => {
                        const totalPollos = tinas * pollosPorTina;
                        const totalTinas = kgPorTina * tinas;
                        const pesoNeto = pesoBruto - totalTinas;

                        const datosSalida = {
                            producto: 'POLLO BENEFICIADO',
                            tienda: tienda,
                            tinas: tinas,
                            kgPorTina: kgPorTina,
                            totalTinas: totalTinas,
                            pollosPorTina: pollosPorTina,
                            totalPollos: totalPollos,
                            bruto: pesoBruto,
                            pesoNeto: pesoNeto,
                            promedio: totalPollos > 0 ? (pesoNeto / totalPollos) : 0,
                            fecha: firebase.firestore.Timestamp.fromDate(new Date())
                        };

                        await registrarSalida(datosSalida);
                        form.reset();
                        form.classList.remove('was-validated');
                        document.getElementById('otroDestinoDiv').classList.add('d-none');

                        // Recargar datos
                        if (typeof cargarSalidas === 'function') {
                            await cargarSalidas();
                        }

                        this.showToast('✅ Salida registrada exitosamente', 'success');
                    });
                }
            }, 'Registrar salida');
            return;
        }

        // Formulario de reporte tiendas
        if (form.id === 'formReporteTiendas') {
            event.preventDefault();
            event.stopPropagation();

            if (!form.checkValidity()) {
                form.classList.add('was-validated');
                return;
            }

            this.safeExecute(() => generarReporteTiendas(), 'Generar reporte tiendas');
            return;
        }
    }

    /**
     * Manejar cambios delegados
     */
    handleDelegatedChange(event) {
        const target = event.target;

        // Cambios en select de destino
        if (target.id === 'salidaDestino') {
            const otroDiv = document.getElementById('otroDestinoDiv');
            if (target.value === 'OTRO') {
                otroDiv?.classList.remove('d-none');
                document.getElementById('otroDestino')?.setAttribute('required', 'required');
            } else {
                otroDiv?.classList.add('d-none');
                document.getElementById('otroDestino')?.removeAttribute('required');
                document.getElementById('otroDestino').value = '';
            }
            return;
        }

        if (target.id === 'editSalidaDestino') {
            const otroDiv = document.getElementById('editOtroDestinoDiv');
            if (target.value === 'OTRO') {
                otroDiv?.classList.remove('d-none');
            } else {
                otroDiv?.classList.add('d-none');
                document.getElementById('editOtroDestino').value = '';
            }
            return;
        }
    }

    /**
     * Manejar inputs delegados
     */
    handleDelegatedInput(event) {
        const target = event.target;

        // Validación en tiempo real para formulario de salida
        if (['salidaJabas', 'salidaPollosJaba', 'salidaPesoPorTina', 'salidaPesoBruto'].includes(target.id)) {
            this.validarFormularioSalidaEnTiempoReal();
            return;
        }

        // Validación en tiempo real para formulario de registro
        if (['cantidadJabas', 'pollosPorJaba', 'pesoBruto', 'inputPesoJaba'].includes(target.id)) {
            this.validarFormularioRegistroEnTiempoReal();
            return;
        }
    }

    /**
     * Configurar listeners específicos (no delegados)
     */
    setupSpecificListeners() {
        // Listener para cambios en pestañas
        const tabButtons = document.querySelectorAll('#tabMenu button[data-bs-toggle="tab"]');
        tabButtons.forEach(button => {
            button.addEventListener('shown.bs.tab', (event) => {
                const targetId = event.target.getAttribute('data-bs-target');

                // Cargar inventario cuando se active la pestaña
                if (targetId === '#inventario') {
                    setTimeout(() => {
                        if (typeof inicializarInventario === 'function') {
                            this.safeExecute(() => inicializarInventario(), 'Inicializar inventario');
                        }
                    }, 100);
                }

                // Cargar reporte tiendas cuando se active la pestaña
                if (targetId === '#reporteTiendas') {
                    setTimeout(() => {
                        if (typeof generarReporteTiendas === 'function') {
                            this.safeExecute(() => generarReporteTiendas(), 'Generar reporte tiendas');
                        }
                    }, 100);
                }
            });
        });

        // Listener para modal de edición de salida
        document.getElementById('formEditSalida')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (!e.target.checkValidity()) {
                e.target.classList.add('was-validated');
                return;
            }

            await this.safeExecute(async () => {
                // Implementación de edición de salida
                const docRef = salidasRef.doc(currentSalidaEditId);
                const docSnap = await docRef.get();
                const oldData = docSnap.data();

                // Obtener nuevos valores y actualizar
                // ... (código de actualización)

                this.showToast('✅ Salida actualizada exitosamente', 'success');
            }, 'Actualizar salida');
        });
    }

    /**
     * Configurar listeners para pestañas
     */
    setupTabListeners() {
        // Configurar fecha por defecto en inventario
        const fechaInput = document.getElementById('fechaInventario');
        if (fechaInput) {
            const hoy = new Date();
            fechaInput.value = hoy.toISOString().split('T')[0];
            fechaInput.max = hoy.toISOString().split('T')[0];
        }

        // Configurar fecha por defecto en reporte tiendas
        const reporteFecha = document.getElementById('reporteFecha');
        if (reporteFecha) {
            const hoy = new Date();
            reporteFecha.value = hoy.toISOString().split('T')[0];
        }
    }

    /**
     * Validar formulario de salida en tiempo real
     */
    validarFormularioSalidaEnTiempoReal() {
        const tinas = parseFloat(document.getElementById('salidaJabas')?.value) || 0;
        const pollosPorTina = parseFloat(document.getElementById('salidaPollosJaba')?.value) || 0;
        const kgPorTina = parseFloat(document.getElementById('salidaPesoPorTina')?.value) || 0;
        const pesoBruto = parseFloat(document.getElementById('salidaPesoBruto')?.value) || 0;
        const btnRegistrar = document.querySelector('#formSalida button[type="submit"]');

        const esValido = tinas > 0 && pollosPorTina > 0 && kgPorTina > 0 && pesoBruto > 0;

        if (btnRegistrar) {
            btnRegistrar.disabled = !esValido;
            btnRegistrar.title = esValido
                ? 'Haga clic para registrar'
                : 'Complete todos los campos requeridos';
        }
    }

    /**
     * Validar formulario de registro en tiempo real
     */
    validarFormularioRegistroEnTiempoReal() {
        const cantidad = parseFloat(document.getElementById('cantidadJabas')?.value) || 0;
        const pollosJaba = parseFloat(document.getElementById('pollosPorJaba')?.value) || 0;
        const pesoBr = parseFloat(document.getElementById('pesoBruto')?.value) || 0;
        const pesoJaba = parseFloat(document.getElementById('inputPesoJaba')?.value) || 0;
        const btnRegistrar = document.querySelector('#formRegistro button[type="submit"]');

        const esValido = cantidad > 0 && pollosJaba > 0 && pesoBr > 0 && pesoJaba > 0;

        if (btnRegistrar) {
            btnRegistrar.disabled = !esValido;
            btnRegistrar.title = esValido
                ? 'Haga clic para registrar ingreso'
                : 'Complete todos los campos requeridos';
        }
    }

    /**
     * Ejecutar función de forma segura con manejo de errores
     */
    async safeExecute(fn, operationName = 'Operación') {
        try {
            // Mostrar indicador de carga
            this.showLoading(true, operationName);

            // Ejecutar función
            const result = await fn();

            // Ocultar indicador de carga
            this.showLoading(false);

            return result;

        } catch (error) {
            console.error(`❌ Error en ${operationName}:`, error);
            this.showToast(`❌ Error en ${operationName}: ${error.message}`, 'error');
            this.showLoading(false);
            throw error;
        }
    }

    /**
     * Mostrar/ocultar indicador de carga
     */
    showLoading(show, message = 'Procesando...') {
        // Buscar o crear overlay de carga
        let overlay = document.getElementById('loadingOverlay');

        if (show) {
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'loadingOverlay';
                overlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.5);
                    z-index: 9999;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                `;

                overlay.innerHTML = `
                    <div class="bg-white p-4 rounded shadow-lg">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Cargando...</span>
                        </div>
                        <div class="mt-2">${message}</div>
                    </div>
                `;

                document.body.appendChild(overlay);
            }
        } else {
            if (overlay) {
                overlay.remove();
            }
        }
    }

    /**
     * Mostrar notificación toast
     */
    showToast(message, type = 'info') {
        const tipos = {
            success: { clase: 'alert-success', icono: '✅' },
            error: { clase: 'alert-danger', icono: '❌' },
            warning: { clase: 'alert-warning', icono: '⚠️' },
            info: { clase: 'alert-info', icono: 'ℹ️' }
        };

        const config = tipos[type] || tipos.info;

        const toast = document.createElement('div');
        toast.className = `alert ${config.clase} alert-dismissible fade show position-fixed`;
        toast.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
        `;

        toast.innerHTML = `
            <div class="d-flex align-items-center">
                <span class="me-2">${config.icono}</span>
                <span>${message}</span>
                <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert"></button>
            </div>
        `;

        document.body.appendChild(toast);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }

    /**
     * Limpiar todos los event listeners
     */
    cleanup() {
        this.handlers.clear();
        this.delegatedHandlers.clear();
        this.initialized = false;
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================

// Crear instancia global
const eventManager = new EventManager();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    eventManager.init();
});

// También inicializar cuando se carguen las pestañas dinámicamente
document.querySelectorAll('#tabMenu button[data-bs-toggle="tab"]').forEach(tab => {
    tab.addEventListener('shown.bs.tab', () => {
        // Re-inicializar eventos para elementos que puedan haberse cargado dinámicamente
        setTimeout(() => {
            if (!eventManager.initialized) {
                eventManager.init();
            }
        }, 100);
    });
});

// ============================================
// EXPORTAR AL OBJETO GLOBAL
// ============================================

window.eventManager = eventManager;
window.safeExecute = (fn, operationName) => eventManager.safeExecute(fn, operationName);

console.log('✅ Gestor de eventos cargado');