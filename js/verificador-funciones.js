// js/verificador-funciones.js

class VerificadorFunciones {
    constructor() {
        this.funcionesRequeridas = [
            // Funciones de registros
            'cargarPaginaRegistros',
            'anteriorPagina',
            'siguientePagina',
            'buscarRegistrosPorFecha',
            'limpiarBusquedaRegistros',
            'exportarRegistrosAXLS',

            // Funciones de salidas
            'cargarPaginaSalidas',
            'anteriorPaginaSalidas',
            'siguientePaginaSalidas',
            'buscarSalidasPorFecha',
            'limpiarBusquedaSalidas',
            'exportarSalidasAXLS',

            // Funciones de inventario
            'cargarInventarioPorFecha',
            'fechaInventarioAnterior',
            'fechaInventarioSiguiente',
            'irAFechaInventario',
            'cargarInventarioFechaHoy',
            'mostrarModalPrecio',

            // Funciones de reportes
            'generarReporteTiendas',
            'exportarReporteTiendasExcel',

            // Funciones CRUD
            'agregarRegistro',
            'abrirEditar',
            'eliminarRegistro',
            'abrirEditarSalida',
            'confirmarEliminarSalida',
            'registrarSalida'
        ];
    }

    verificar() {
        console.log('🔍 Verificando funciones disponibles...');

        const faltantes = [];
        const disponibles = [];

        this.funcionesRequeridas.forEach(funcName => {
            if (typeof window[funcName] === 'function') {
                disponibles.push(funcName);
            } else {
                faltantes.push(funcName);
            }
        });

        console.log(`✅ ${disponibles.length} funciones disponibles`);

        if (faltantes.length > 0) {
            console.warn(`⚠️ ${faltantes.length} funciones faltantes:`, faltantes);

            // Intentar cargar funciones faltantes dinámicamente
            this.cargarFuncionesFaltantes(faltantes);
        }

        return {
            disponibles,
            faltantes,
            todasDisponibles: faltantes.length === 0
        };
    }

    cargarFuncionesFaltantes(faltantes) {
        // Si falta limpiarBusquedaSalidas, definirla
        if (faltantes.includes('limpiarBusquedaSalidas')) {
            this.definirLimpiarBusquedaSalidas();
        }

        // Si falta buscarSalidasPorFecha, definirla
        if (faltantes.includes('buscarSalidasPorFecha')) {
            this.definirBuscarSalidasPorFecha();
        }

        // Agregar más definiciones según sea necesario...
    }

    definirLimpiarBusquedaSalidas() {
        console.log('📝 Definindo limpiarBusquedaSalidas...');

        window.limpiarBusquedaSalidas = function () {
            console.log('🧹 Limpiando búsqueda de salidas (función alternativa)...');

            const inputFecha = document.getElementById('buscarFechaSalidas');
            if (inputFecha) {
                inputFecha.value = '';
            }

            // Mostrar paginación
            const paginationNav = document.querySelector('nav[aria-label="Paginación de salidas"]');
            if (paginationNav) {
                paginationNav.style.display = 'flex';
            }

            // Recargar datos
            if (typeof cargarPaginaSalidas === 'function') {
                return cargarPaginaSalidas('primera');
            } else if (typeof cargarSalidas === 'function') {
                return cargarSalidas();
            } else {
                console.error('No se puede recargar salidas');
                return Promise.resolve();
            }
        };

        console.log('✅ limpiarBusquedaSalidas definida');
    }

    definirBuscarSalidasPorFecha() {
        console.log('📝 Definindo buscarSalidasPorFecha...');

        window.buscarSalidasPorFecha = async function () {
            console.log('🔍 Buscando salidas por fecha (función alternativa)...');

            const fechaStr = document.getElementById('buscarFechaSalidas')?.value;
            if (!fechaStr) {
                alert('Seleccione una fecha para buscar');
                return;
            }

            try {
                const fecha = fechaInputADate(fechaStr);
                if (!fecha) {
                    alert('Fecha inválida');
                    return;
                }

                const inicioDia = getInicioDelDia(fecha);
                const finDia = getFinDelDia(fecha);

                const tbody = document.getElementById('tablaSalidas');
                if (!tbody) {
                    alert('Tabla no encontrada');
                    return;
                }

                tbody.innerHTML = '<tr><td colspan="13" class="text-muted">Buscando...</td></tr>';

                // Usar referencia directa si salidasRef no está disponible
                const ref = window.salidasRef || db.collection('salidas');

                const snapshot = await ref
                    .where('fecha', '>=', firebase.firestore.Timestamp.fromDate(inicioDia))
                    .where('fecha', '<', firebase.firestore.Timestamp.fromDate(finDia))
                    .orderBy('fecha', 'desc')
                    .get();

                if (snapshot.empty) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="13" class="text-muted">
                                No hay salidas para ${fechaStr}
                            </td>
                        </tr>
                    `;
                    return;
                }

                // Renderizar resultados
                tbody.innerHTML = '';
                snapshot.forEach(doc => {
                    const d = doc.data();
                    const totalPollos = d.totalPollos || 0;
                    const neto = d.pesoNeto || d.neto || 0;
                    const bruto = d.bruto || 0;
                    const promedio = d.promedio || (totalPollos > 0 ? neto / totalPollos : 0);

                    tbody.innerHTML += `
                        <tr>
                            <td>${d.id || doc.id}</td>
                            <td>${formatearFecha(d.fecha)}</td>
                            <td>${d.producto || 'POLLO BENEFICIADO'}</td>
                            <td>${d.tinas || 0}</td>
                            <td>${(d.kgPorTina || 0).toFixed(2)} KG</td>
                            <td>${d.tinas || 0}</td>
                            <td>${d.pollosPorTina || 0}</td>
                            <td>${totalPollos}</td>
                            <td>${bruto.toFixed(2)} KG</td>
                            <td>${neto.toFixed(2)} KG</td>
                            <td>${promedio.toFixed(3)} KG</td>
                            <td>
                                <button class="btn btn-warning btn-sm" onclick="abrirEditarSalida('${doc.id}')">✏️</button>
                            </td>
                            <td>
                                <button class="btn btn-danger btn-sm" onclick="confirmarEliminarSalida('${doc.id}')">🗑️</button>
                            </td>
                        </tr>
                    `;
                });

            } catch (error) {
                console.error('Error buscando salidas:', error);
                alert(`Error: ${error.message}`);
            }
        };

        console.log('✅ buscarSalidasPorFecha definida');
    }
}

// Inicializar verificador
const verificador = new VerificadorFunciones();

// Verificar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        verificador.verificar();
    }, 1000);
});

window.verificadorFunciones = verificador;
console.log('✅ Verificador de funciones cargado');