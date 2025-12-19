// pagination-salidas.js - Paginación para salidas

// Variables globales para manejar la paginación de salidas
const PAGE_SIZE_SALIDAS = 10;
let lastVisibleSalida = null;
let firstVisibleSalida = null;
let pageStackSalidas = [];
let currentPageSalidas = 1;

// Función para cargar página de salidas
async function cargarPaginaSalidas(direccion = 'primera') {
    const tbody = document.getElementById('tablaSalidas');
    if (!tbody) {
        console.error('No se encontró tablaSalidas');
        return;
    }

    tbody.innerHTML = '<tr><td colspan="13" class="text-muted">Cargando...</td></tr>';

    try {
        let query = salidasRef.orderBy('fecha', 'desc');

        // Paginación
        if (direccion === 'siguiente' && lastVisibleSalida) {
            query = query.startAfter(lastVisibleSalida).limit(PAGE_SIZE_SALIDAS);
        } else if (direccion === 'anterior' && pageStackSalidas.length > 1) {
            pageStackSalidas.pop();
            const prevFirstVisible = pageStackSalidas[pageStackSalidas.length - 1];
            query = query.startAt(prevFirstVisible).limit(PAGE_SIZE_SALIDAS);
        } else if (direccion === 'primera') {
            query = query.limit(PAGE_SIZE_SALIDAS);
            pageStackSalidas = [];
            currentPageSalidas = 1;
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="13" class="text-muted">No hay salidas registradas</td>
                </tr>
            `;
            actualizarBotonesPaginacionSalidas(0);
            return;
        }

        // Actualizar marcadores de paginación
        if (!snapshot.empty) {
            firstVisibleSalida = snapshot.docs[0];
            lastVisibleSalida = snapshot.docs[snapshot.docs.length - 1];
            if (direccion === 'siguiente' || direccion === 'primera') {
                pageStackSalidas.push(firstVisibleSalida);
                if (direccion === 'siguiente') currentPageSalidas++;
                if (direccion === 'anterior') currentPageSalidas--;
            }
        }

        // Renderizar tabla
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
                    <td>${(d.totalTinas || d.tinas || 0)}</td>
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

        actualizarBotonesPaginacionSalidas(snapshot.size);
        console.log(`📄 Página ${currentPageSalidas} de salidas cargada (${snapshot.size} registros)`);

    } catch (error) {
        console.error('❌ Error al cargar salidas:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="13" class="text-danger">Error al cargar: ${error.message}</td>
            </tr>
        `;
    }
}

// Función para ir a la página anterior de salidas
function anteriorPaginaSalidas() {
    if (pageStackSalidas.length > 1) {
        cargarPaginaSalidas('anterior');
    }
}

// Función para ir a la página siguiente de salidas
function siguientePaginaSalidas() {
    cargarPaginaSalidas('siguiente');
}

// Función para actualizar botones de paginación de salidas
function actualizarBotonesPaginacionSalidas(numItems) {
    const btnPrev = document.getElementById('btnPaginaAnteriorSalidas');
    const btnNext = document.getElementById('btnPaginaSiguienteSalidas');

    if (btnPrev && btnNext) {
        btnPrev.disabled = pageStackSalidas.length <= 1;
        btnNext.disabled = numItems < PAGE_SIZE_SALIDAS;

        // También actualizar las clases de Bootstrap
        const liPrev = document.getElementById('liPaginaAnteriorSalidas');
        const liNext = document.getElementById('liPaginaSiguienteSalidas');

        if (liPrev && liNext) {
            liPrev.classList.toggle('disabled', pageStackSalidas.length <= 1);
            liNext.classList.toggle('disabled', numItems < PAGE_SIZE_SALIDAS);
        }
    }
}

// Función para buscar salidas por fecha
// pagination-salidas.js - Función buscarSalidasPorFecha CORREGIDA

async function buscarSalidasPorFecha() {
    console.log('🔍 Iniciando búsqueda de salidas por fecha...');

    const fechaStr = document.getElementById('buscarFechaSalidas').value;
    console.log('📅 Fecha ingresada:', fechaStr);

    if (!fechaStr) {
        alert('Seleccione una fecha para buscar');
        return;
    }

    // Verificar que las funciones auxiliares existan
    if (typeof fechaInputADate !== 'function') {
        alert('Error: Función fechaInputADate no disponible');
        console.error('❌ fechaInputADate no está definida');
        return;
    }

    if (typeof getInicioDelDia !== 'function') {
        alert('Error: Función getInicioDelDia no disponible');
        console.error('❌ getInicioDelDia no está definida');
        return;
    }

    try {
        const fecha = fechaInputADate(fechaStr);
        console.log('📅 Fecha convertida:', fecha);

        if (!fecha) {
            alert('Fecha inválida');
            return;
        }

        const inicioDia = getInicioDelDia(fecha);
        const finDia = getFinDelDia(fecha);

        console.log('📅 Rango de búsqueda:', {
            inicio: inicioDia,
            fin: finDia
        });

        const tbody = document.getElementById('tablaSalidas');
        if (!tbody) {
            alert('Error: No se encontró la tabla de salidas');
            console.error('❌ tablaSalidas no encontrada en el DOM');
            return;
        }

        tbody.innerHTML = '<tr><td colspan="13" class="text-muted">🔍 Buscando salidas...</td></tr>';

        // Verificar que salidasRef exista
        if (!salidasRef) {
            alert('Error: Referencia a salidas no disponible');
            console.error('❌ salidasRef no está definida');
            return;
        }

        // Realizar la consulta
        console.log('📝 Ejecutando consulta a Firestore...');
        const snapshot = await salidasRef
            .where('fecha', '>=', firebase.firestore.Timestamp.fromDate(inicioDia))
            .where('fecha', '<', firebase.firestore.Timestamp.fromDate(finDia))
            .orderBy('fecha', 'desc')
            .get();

        console.log('✅ Consulta completada, documentos encontrados:', snapshot.size);

        if (snapshot.empty) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="13" class="text-muted">
                        📭 No hay salidas registradas para ${fechaStr}
                    </td>
                </tr>
            `;

            // Ocultar paginación cuando no hay resultados
            const paginationNav = document.querySelector('nav[aria-label="Paginación de salidas"]');
            if (paginationNav) {
                paginationNav.style.display = 'none';
            }

            return;
        }

        // Renderizar resultados
        tbody.innerHTML = '';
        let contador = 0;

        snapshot.forEach(doc => {
            contador++;
            const d = doc.data();
            console.log(`📄 Documento ${contador}:`, d);

            // Validar datos
            const totalPollos = d.totalPollos || 0;
            const neto = d.pesoNeto || d.neto || 0;
            const bruto = d.bruto || 0;
            const promedio = d.promedio || (totalPollos > 0 ? neto / totalPollos : 0);

            // Formatear fecha
            let fechaFormateada = 'Fecha no disponible';
            try {
                if (d.fecha && d.fecha.toDate) {
                    fechaFormateada = d.fecha.toDate().toLocaleDateString('es-PE', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                }
            } catch (error) {
                console.warn('Error formateando fecha:', error);
            }

            tbody.innerHTML += `
                <tr>
                    <td>${d.id || doc.id || 'N/A'}</td>
                    <td>${fechaFormateada}</td>
                    <td>${d.producto || 'POLLO BENEFICIADO'}</td>
                    <td>${d.tinas || 0}</td>
                    <td>${(d.kgPorTina || 0).toFixed(2)} KG</td>
                    <td>${(d.totalTinas || d.tinas || 0)}</td>
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

        console.log(`✅ ${contador} salidas encontradas para ${fechaStr}`);

        // Ocultar paginación cuando se hace búsqueda
        const paginationNav = document.querySelector('nav[aria-label="Paginación de salidas"]');
        if (paginationNav) {
            paginationNav.style.display = 'none';
        }

    } catch (error) {
        console.error('❌ Error al buscar salidas por fecha:', error);
        console.error('Detalles del error:', error.message, error.stack);

        const tbody = document.getElementById('tablaSalidas');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="13" class="text-danger">
                        ❌ Error al buscar: ${error.message}<br>
                        <small>Revisa la consola para más detalles</small>
                    </td>
                </tr>
            `;
        }

        alert(`Error al buscar salidas: ${error.message}`);
    }
}
// Función para limpiar búsqueda de salidas
function limpiarBusquedaSalidas() {
    document.getElementById('buscarFechaSalidas').value = '';

    // Mostrar paginación nuevamente
    const paginationNav = document.querySelector('nav[aria-label="Paginación de salidas"]');
    if (paginationNav) {
        paginationNav.style.display = 'flex';
    }

    // Cargar primera página
    cargarPaginaSalidas('primera');
}

// Hacer funciones disponibles globalmente
window.cargarPaginaSalidas = cargarPaginaSalidas;
window.anteriorPaginaSalidas = anteriorPaginaSalidas;
window.siguientePaginaSalidas = siguientePaginaSalidas;
window.buscarSalidasPorFecha = buscarSalidasPorFecha;
window.limpiarBusquedaSalidas = limpiarBusquedaSalidas;