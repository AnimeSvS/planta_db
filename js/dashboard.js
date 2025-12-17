// js/dashboard.js - Dashboard mejorado con gráficos

// Variables globales para los gráficos
let stockChartInstance = null;
let tiendasChartInstance = null;
let movimientosChartInstance = null;
let pesoChartInstance = null;

// Inicializar dashboard cuando se carga la pestaña
document.addEventListener('DOMContentLoaded', function () {
    // Configurar fecha actual por defecto
    const hoy = new Date();
    document.getElementById('dashboardFechaInicio')?.value = hoy.toISOString().split('T')[0];
    document.getElementById('dashboardFechaFin')?.value = hoy.toISOString().split('T')[0];

    // Event listener para cambiar período
    document.getElementById('dashboardPeriodo')?.addEventListener('change', function () {
        const rangoFechasDiv = document.getElementById('rangoFechasDiv');
        if (this.value === 'personalizado') {
            rangoFechasDiv?.classList.remove('d-none');
        } else {
            rangoFechasDiv?.classList.add('d-none');
        }
        actualizarDashboard();
    });

    // Event listeners para fechas personalizadas
    document.getElementById('dashboardFechaInicio')?.addEventListener('change', actualizarDashboard);
    document.getElementById('dashboardFechaFin')?.addEventListener('change', actualizarDashboard);

    // Inicializar dashboard
    setTimeout(actualizarDashboard, 1000);
});

// Función principal para actualizar dashboard
async function actualizarDashboard() {
    console.log('🔄 Actualizando dashboard...');

    try {
        // Obtener período seleccionado
        const periodo = document.getElementById('dashboardPeriodo')?.value || 'mes';

        // Calcular rango de fechas según período
        let fechaInicio, fechaFin;

        switch (periodo) {
            case 'hoy':
                fechaInicio = new Date();
                fechaFin = new Date();
                break;
            case 'ayer':
                fechaInicio = new Date();
                fechaFin = new Date();
                fechaInicio.setDate(fechaInicio.getDate() - 1);
                fechaFin.setDate(fechaFin.getDate() - 1);
                break;
            case 'semana':
                fechaInicio = new Date();
                fechaFin = new Date();
                fechaInicio.setDate(fechaInicio.getDate() - 7);
                break;
            case 'mes':
                fechaInicio = new Date();
                fechaFin = new Date();
                fechaInicio.setMonth(fechaInicio.getMonth() - 1);
                break;
            case 'trimestre':
                fechaInicio = new Date();
                fechaFin = new Date();
                fechaInicio.setMonth(fechaInicio.getMonth() - 3);
                break;
            case 'personalizado':
                const inicioStr = document.getElementById('dashboardFechaInicio')?.value;
                const finStr = document.getElementById('dashboardFechaFin')?.value;
                if (inicioStr && finStr) {
                    fechaInicio = new Date(inicioStr);
                    fechaFin = new Date(finStr);
                } else {
                    fechaInicio = new Date();
                    fechaFin = new Date();
                    fechaInicio.setMonth(fechaInicio.getMonth() - 1);
                }
                break;
        }

        // Asegurar que fechaFin sea el final del día
        fechaFin.setHours(23, 59, 59, 999);
        fechaInicio.setHours(0, 0, 0, 0);

        console.log('📅 Período seleccionado:', {
            periodo,
            fechaInicio: fechaInicio.toLocaleDateString(),
            fechaFin: fechaFin.toLocaleDateString()
        });

        // Cargar todos los datos en paralelo
        const [
            datosKPIs,
            datosStock,
            datosTiendas,
            datosMovimientos,
            datosPeso,
            datosResumen
        ] = await Promise.all([
            obtenerKPIs(fechaInicio, fechaFin),
            obtenerDatosStock(fechaInicio, fechaFin),
            obtenerDatosTiendas(fechaInicio, fechaFin),
            obtenerDatosMovimientos(fechaInicio, fechaFin),
            obtenerDatosPeso(fechaInicio, fechaFin),
            obtenerResumenTiendas(fechaInicio, fechaFin)
        ]);

        // Actualizar KPIs
        actualizarKPIs(datosKPIs);

        // Renderizar gráficos
        renderizarGraficoStock(datosStock);
        renderizarGraficoTiendas(datosTiendas);
        renderizarGraficoMovimientos(datosMovimientos);
        renderizarGraficoPeso(datosPeso);

        // Actualizar tabla de resumen
        actualizarTablaResumen(datosResumen);

        console.log('✅ Dashboard actualizado correctamente');

    } catch (error) {
        console.error('❌ Error actualizando dashboard:', error);
        mostrarNotificacionError('Error al cargar el dashboard');
    }
}

// FUNCIÓN 1: Obtener KPIs principales
async function obtenerKPIs(fechaInicio, fechaFin) {
    try {
        // 1. Obtener stock actual
        const stockSnap = await db.collection('stock').get();
        let totalPollos = 0;
        let totalPeso = 0;

        stockSnap.forEach(doc => {
            const data = doc.data();
            totalPollos += data.cantidadPollos || 0;
            totalPeso += data.pesoNeto || 0;
        });

        // 2. Obtener ingresos del período
        const ingresosSnapshot = await db.collection('registros')
            .where('fecha', '>=', firebase.firestore.Timestamp.fromDate(fechaInicio))
            .where('fecha', '<=', firebase.firestore.Timestamp.fromDate(fechaFin))
            .get();

        let ingresosCount = 0;
        ingresosSnapshot.forEach(doc => {
            const data = doc.data();
            ingresosCount += data.cantidadJabas * data.pollosPorJaba || 0;
        });

        // 3. Obtener salidas del período
        const salidasSnapshot = await db.collection('salidas')
            .where('fecha', '>=', firebase.firestore.Timestamp.fromDate(fechaInicio))
            .where('fecha', '<=', firebase.firestore.Timestamp.fromDate(fechaFin))
            .get();

        let salidasCount = 0;
        salidasSnapshot.forEach(doc => {
            const data = doc.data();
            salidasCount += data.totalPollos || 0;
        });

        // 4. Obtener datos del período anterior para comparación
        const diasPeriodo = Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24));
        const fechaInicioAnterior = new Date(fechaInicio);
        const fechaFinAnterior = new Date(fechaFin);
        fechaInicioAnterior.setDate(fechaInicioAnterior.getDate() - diasPeriodo);
        fechaFinAnterior.setDate(fechaFinAnterior.getDate() - diasPeriodo);

        const ingresosAnterioresSnapshot = await db.collection('registros')
            .where('fecha', '>=', firebase.firestore.Timestamp.fromDate(fechaInicioAnterior))
            .where('fecha', '<=', firebase.firestore.Timestamp.fromDate(fechaFinAnterior))
            .get();

        let ingresosAnteriores = 0;
        ingresosAnterioresSnapshot.forEach(doc => {
            const data = doc.data();
            ingresosAnteriores += data.cantidadJabas * data.pollosPorJaba || 0;
        });

        const salidasAnterioresSnapshot = await db.collection('salidas')
            .where('fecha', '>=', firebase.firestore.Timestamp.fromDate(fechaInicioAnterior))
            .where('fecha', '<=', firebase.firestore.Timestamp.fromDate(fechaFinAnterior))
            .get();

        let salidasAnteriores = 0;
        salidasAnterioresSnapshot.forEach(doc => {
            const data = doc.data();
            salidasAnteriores += data.totalPollos || 0;
        });

        // Calcular variaciones porcentuales
        const variacionIngresos = ingresosAnteriores > 0
            ? ((ingresosCount - ingresosAnteriores) / ingresosAnteriores * 100).toFixed(1)
            : 0;

        const variacionSalidas = salidasAnteriores > 0
            ? ((salidasCount - salidasAnteriores) / salidasAnteriores * 100).toFixed(1)
            : 0;

        return {
            totalPollos,
            totalPeso: totalPeso.toFixed(2),
            ingresosCount,
            salidasCount,
            variacionIngresos,
            variacionSalidas
        };

    } catch (error) {
        console.error('Error obteniendo KPIs:', error);
        return {
            totalPollos: 0,
            totalPeso: '0.00',
            ingresosCount: 0,
            salidasCount: 0,
            variacionIngresos: 0,
            variacionSalidas: 0
        };
    }
}

// FUNCIÓN 2: Actualizar KPIs en la interfaz
function actualizarKPIs(datos) {
    document.getElementById('totalPollos').textContent = datos.totalPollos.toLocaleString();
    document.getElementById('totalPeso').textContent = datos.totalPeso + ' KG';
    document.getElementById('ingresosHoy').textContent = datos.ingresosCount.toLocaleString();
    document.getElementById('salidasHoy').textContent = datos.salidasCount.toLocaleString();

    // Actualizar variaciones con colores
    const variacionIngresosEl = document.getElementById('variacionIngresos');
    const variacionSalidasEl = document.getElementById('variacionSalidas');

    if (variacionIngresosEl) {
        variacionIngresosEl.textContent = `${datos.variacionIngresos >= 0 ? '+' : ''}${datos.variacionIngresos}%`;
        variacionIngresosEl.className = datos.variacionIngresos >= 0 ? 'text-success' : 'text-danger';
    }

    if (variacionSalidasEl) {
        variacionSalidasEl.textContent = `${datos.variacionSalidas >= 0 ? '+' : ''}${datos.variacionSalidas}%`;
        variacionSalidasEl.className = datos.variacionSalidas >= 0 ? 'text-success' : 'text-danger';
    }
}

// FUNCIÓN 3: Obtener datos para gráfico de stock
async function obtenerDatosStock(fechaInicio, fechaFin) {
    try {
        // Obtener los últimos 7 días de stock
        const dias = [];
        const datos = [];

        for (let i = 6; i >= 0; i--) {
            const fecha = new Date();
            fecha.setDate(fecha.getDate() - i);
            dias.push(fecha.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric' }));

            // Obtener stock para cada día (simplificado)
            // En una implementación real, deberías almacenar snapshots diarios
            datos.push(Math.floor(Math.random() * 1000) + 500); // Datos de ejemplo
        }

        return { dias, datos };
    } catch (error) {
        console.error('Error obteniendo datos de stock:', error);
        return { dias: [], datos: [] };
    }
}

// FUNCIÓN 4: Renderizar gráfico de stock
function renderizarGraficoStock(datos) {
    const ctx = document.getElementById('stockChart');
    if (!ctx) return;

    // Destruir gráfico anterior si existe
    if (stockChartInstance) {
        stockChartInstance.destroy();
    }

    stockChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: datos.dias,
            datasets: [{
                label: 'Pollos en Stock',
                data: datos.datos,
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `Stock: ${context.parsed.y.toLocaleString()} pollos`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return value.toLocaleString() + ' pollos';
                        }
                    }
                }
            }
        }
    });
}

// FUNCIÓN 5: Obtener datos por tienda
async function obtenerDatosTiendas(fechaInicio, fechaFin) {
    try {
        const snapshot = await db.collection('salidas')
            .where('fecha', '>=', firebase.firestore.Timestamp.fromDate(fechaInicio))
            .where('fecha', '<=', firebase.firestore.Timestamp.fromDate(fechaFin))
            .get();

        const datosTiendas = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            const tienda = data.tienda || 'Sin tienda';

            if (!datosTiendas[tienda]) {
                datosTiendas[tienda] = 0;
            }

            datosTiendas[tienda] += data.totalPollos || 0;
        });

        // Convertir a arrays para Chart.js
        const tiendas = Object.keys(datosTiendas);
        const valores = Object.values(datosTiendas);

        return { tiendas, valores };
    } catch (error) {
        console.error('Error obteniendo datos por tienda:', error);
        return { tiendas: [], valores: [] };
    }
}

// FUNCIÓN 6: Renderizar gráfico por tienda
function renderizarGraficoTiendas(datos) {
    const ctx = document.getElementById('tiendasChart');
    if (!ctx) return;

    // Destruir gráfico anterior si existe
    if (tiendasChartInstance) {
        tiendasChartInstance.destroy();
    }

    // Colores para las tiendas
    const colores = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
        '#9966FF', '#FF9F40', '#8AC926', '#1982C4',
        '#6A4C93', '#FF595E'
    ];

    tiendasChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: datos.tiendas,
            datasets: [{
                data: datos.valores,
                backgroundColor: colores,
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const porcentaje = Math.round((context.parsed / total) * 100);
                            return `${context.label}: ${context.parsed.toLocaleString()} pollos (${porcentaje}%)`;
                        }
                    }
                }
            }
        }
    });
}

// FUNCIÓN 7: Obtener datos de movimientos
async function obtenerDatosMovimientos(fechaInicio, fechaFin) {
    try {
        // Generar datos para los últimos 14 días
        const dias = [];
        const ingresos = [];
        const salidas = [];

        const hoy = new Date();
        for (let i = 13; i >= 0; i--) {
            const fecha = new Date();
            fecha.setDate(fecha.getDate() - i);
            dias.push(fecha.getDate());

            // Datos de ejemplo (en producción, consultarías Firestore)
            ingresos.push(Math.floor(Math.random() * 100) + 20);
            salidas.push(Math.floor(Math.random() * 80) + 10);
        }

        return { dias, ingresos, salidas };
    } catch (error) {
        console.error('Error obteniendo datos de movimientos:', error);
        return { dias: [], ingresos: [], salidas: [] };
    }
}

// FUNCIÓN 8: Renderizar gráfico de movimientos
function renderizarGraficoMovimientos(datos) {
    const ctx = document.getElementById('movimientosChart');
    if (!ctx) return;

    if (movimientosChartInstance) {
        movimientosChartInstance.destroy();
    }

    movimientosChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: datos.dias.map(d => `Día ${d}`),
            datasets: [
                {
                    label: 'Ingresos',
                    data: datos.ingresos,
                    backgroundColor: 'rgba(40, 167, 69, 0.7)',
                    borderColor: '#28a745',
                    borderWidth: 1
                },
                {
                    label: 'Salidas',
                    data: datos.salidas,
                    backgroundColor: 'rgba(220, 53, 69, 0.7)',
                    borderColor: '#dc3545',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    stacked: false,
                },
                y: {
                    stacked: false,
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return value.toLocaleString() + ' pollos';
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.dataset.label}: ${context.parsed.y.toLocaleString()} pollos`;
                        }
                    }
                }
            }
        }
    });
}

// FUNCIÓN 9: Obtener datos de peso promedio
async function obtenerDatosPeso(fechaInicio, fechaFin) {
    try {
        // Datos de ejemplo para peso promedio
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
        const pesoPromedio = [1.8, 1.85, 1.9, 1.87, 1.92, 1.88];

        return { meses, pesoPromedio };
    } catch (error) {
        console.error('Error obteniendo datos de peso:', error);
        return { meses: [], pesoPromedio: [] };
    }
}

// FUNCIÓN 10: Renderizar gráfico de peso promedio
function renderizarGraficoPeso(datos) {
    const ctx = document.getElementById('pesoChart');
    if (!ctx) return;

    if (pesoChartInstance) {
        pesoChartInstance.destroy();
    }

    pesoChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: datos.meses,
            datasets: [{
                label: 'Peso Promedio (KG)',
                data: datos.pesoPromedio,
                borderColor: '#ffc107',
                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false,
                    min: 1.5,
                    ticks: {
                        callback: function (value) {
                            return value.toFixed(2) + ' KG';
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `Peso: ${context.parsed.y.toFixed(3)} KG`;
                        }
                    }
                }
            }
        }
    });
}

// FUNCIÓN 11: Obtener resumen por tienda
async function obtenerResumenTiendas(fechaInicio, fechaFin) {
    try {
        const snapshot = await db.collection('salidas')
            .where('fecha', '>=', firebase.firestore.Timestamp.fromDate(fechaInicio))
            .where('fecha', '<=', firebase.firestore.Timestamp.fromDate(fechaFin))
            .orderBy('tienda')
            .get();

        const resumen = {};

        snapshot.forEach(doc => {
            const data = doc.data();
            const tienda = data.tienda || 'Sin tienda';

            if (!resumen[tienda]) {
                resumen[tienda] = {
                    pollos: 0,
                    peso: 0,
                    ultimaFecha: data.fecha,
                    promedio: 0,
                    count: 0
                };
            }

            resumen[tienda].pollos += data.totalPollos || 0;
            resumen[tienda].peso += data.pesoNeto || 0;
            resumen[tienda].count += 1;

            // Mantener la fecha más reciente
            if (data.fecha && data.fecha.toDate) {
                const fechaDoc = data.fecha.toDate();
                if (!resumen[tienda].ultimaFecha || fechaDoc > resumen[tienda].ultimaFecha.toDate()) {
                    resumen[tienda].ultimaFecha = data.fecha;
                }
            }
        });

        // Calcular promedios
        Object.keys(resumen).forEach(tienda => {
            if (resumen[tienda].count > 0 && resumen[tienda].pollos > 0) {
                resumen[tienda].promedio = resumen[tienda].peso / resumen[tienda].pollos;
            }
        });

        return resumen;
    } catch (error) {
        console.error('Error obteniendo resumen:', error);
        return {};
    }
}

// FUNCIÓN 12: Actualizar tabla de resumen
function actualizarTablaResumen(resumen) {
    const tbody = document.getElementById('tablaResumenDashboard');
    if (!tbody) return;

    if (Object.keys(resumen).length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">
                    No hay datos para el período seleccionado
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    Object.entries(resumen).forEach(([tienda, datos]) => {
        const fechaFormateada = datos.ultimaFecha && datos.ultimaFecha.toDate
            ? datos.ultimaFecha.toDate().toLocaleDateString('es-PE')
            : 'N/A';

        html += `
            <tr>
                <td><strong>${tienda}</strong></td>
                <td>${datos.pollos.toLocaleString()}</td>
                <td>${datos.peso.toFixed(2)} KG</td>
                <td>${datos.promedio.toFixed(3)} KG/pollo</td>
                <td>${fechaFormateada}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// FUNCIÓN 13: Actualizar automáticamente al cambiar de pestaña
function inicializarDashboardTab() {
    const tabButtons = document.querySelectorAll('#tabMenu button[data-bs-toggle="tab"]');
    tabButtons.forEach(button => {
        button.addEventListener('shown.bs.tab', function (event) {
            const targetId = event.target.getAttribute('data-bs-target');
            if (targetId === '#dashboard') {
                setTimeout(actualizarDashboard, 300);
            }
        });
    });
}

// FUNCIÓN 14: Mostrar notificaciones
function mostrarNotificacionError(mensaje) {
    const notificacion = document.createElement('div');
    notificacion.className = 'alert alert-danger alert-dismissible fade show position-fixed';
    notificacion.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notificacion.innerHTML = `
        ❌ ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(notificacion);

    setTimeout(() => {
        if (notificacion.parentNode) {
            notificacion.remove();
        }
    }, 5000);
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', function () {
    inicializarDashboardTab();
    console.log('✅ Dashboard inicializado');
});

// Hacer funciones disponibles globalmente
window.actualizarDashboard = actualizarDashboard;