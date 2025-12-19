// js/inventario.js - VERSIÓN CORREGIDA PARA CÁLCULO DIARIO

let inventarioFechaData = {
    fecha: new Date(),
    fechaTexto: '',
    ingresosPollos: 0,      // Pollo Vivo ingresado
    salidasPollos: 0,       // Pollo Beneficiado salido
    netoPollos: 0,          // Ingresos - Salidas
    ingresosPeso: 0,        // Peso Pollo Vivo
    salidasPeso: 0,         // Peso Pollo Beneficiado
    netoPeso: 0,            // Peso neto
    valor: 0,
    movimientos: [],
    distribucion: []
};
let modalPrecioAbierto = false;
let PRECIO_KG = 8.50;

// Cargar precio desde localStorage
function cargarPrecioGuardado() {
    try {
        const precioGuardado = localStorage.getItem('precio_kg_inventario');
        if (precioGuardado) {
            PRECIO_KG = parseFloat(precioGuardado);
            console.log('💰 Precio cargado desde localStorage:', PRECIO_KG);
        } else {
            // Valor por defecto
            PRECIO_KG = 8.50;
            localStorage.setItem('precio_kg_inventario', PRECIO_KG);
            console.log('💰 Precio por defecto establecido:', PRECIO_KG);
        }

        // Actualizar display inmediatamente
        actualizarDisplayPrecio();

    } catch (error) {
        console.error('❌ Error al cargar precio:', error);
        PRECIO_KG = 8.50;
        actualizarDisplayPrecio();
    }
}
// Función robusta para actualizar TODOS los textos de precio en la página
function actualizarDisplayPrecio() {
    // Formatear el precio con 2 decimales
    const precioFormateado = PRECIO_KG.toFixed(2);
    const precioFormateadoConSimbolo = `S/ ${precioFormateado}`;

    console.log('🔄 Actualizando precio a:', precioFormateadoConSimbolo);

    // 1. Actualizar elementos con IDs específicos
    const elementosConIds = [
        'precioActual',        // En el encabezado
        'precioDisplay'        // En el KPI de valor estimado
    ];

    elementosConIds.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = precioFormateado;
            console.log(`✅ ID "${id}" actualizado`);
        }
    });

    // 2. Buscar y actualizar TODOS los elementos que muestran el precio x kg
    // Patrones de búsqueda más amplios
    const patrones = [
        'x kg',
        'por kg',
        'kg',
        'S/'
    ];

    // Buscar en todo el contenido de la página
    const todosElementos = document.querySelectorAll('body *:not(script):not(style):not(meta):not(link)');

    todosElementos.forEach(elemento => {
        if (elemento.children.length === 0 && elemento.textContent) {
            const textoOriginal = elemento.textContent.trim();

            // Verificar si el texto contiene referencia al precio
            let textoModificado = textoOriginal;

            // Caso 1: "A S/ 8.50 x kg" (el que se muestra en la imagen)
            if (textoOriginal.includes('A S/') && textoOriginal.includes('x kg')) {
                textoModificado = `A S/ ${precioFormateado} x kg`;
            }
            // Caso 2: "Precio: S/ 8.50 x kg"
            else if (textoOriginal.includes('Precio:') && textoOriginal.includes('S/') && textoOriginal.includes('kg')) {
                textoModificado = `Precio: S/ ${precioFormateado} x kg`;
            }
            // Caso 3: "S/ 8.50 x kg" (sin "A")
            else if (textoOriginal.includes('S/') && textoOriginal.includes('x kg')) {
                const regex = /S\/\s*[\d.,]+\s*x\s*kg/i;
                if (regex.test(textoOriginal)) {
                    textoModificado = textoOriginal.replace(regex, `S/ ${precioFormateado} x kg`);
                }
            }
            // Caso 4: Solo "S/ 8.50"
            else if (textoOriginal.includes('S/') && /S\/\s*[\d.,]+/.test(textoOriginal)) {
                // Verificar que no sea parte de un valor más grande (como S/ 1810.23)
                const tieneSoloPrecio = /^S\/\s*[\d.,]+$/.test(textoOriginal.trim()) ||
                    /^S\/\s*[\d.,]+\s*x?\s*kg?$/i.test(textoOriginal.trim());

                if (tieneSoloPrecio && !textoOriginal.includes('1810') && !textoOriginal.includes('1875')) {
                    // Reemplazar solo el precio del kg, no los valores totales
                    const regexPrecioSimple = /S\/\s*[\d.,]+/;
                    textoModificado = textoOriginal.replace(regexPrecioSimple, `S/ ${precioFormateado}`);
                }
            }

            // Actualizar si hubo cambio
            if (textoModificado !== textoOriginal && textoModificado.includes(precioFormateado)) {
                elemento.textContent = textoModificado;
                console.log(`📝 Texto actualizado: "${textoOriginal}" → "${textoModificado}"`);
            }
        }
    });

    // 3. Actualizar el valor estimado del inventario
    const valorEstimadoElement = document.getElementById('inventarioValor');
    if (valorEstimadoElement && inventarioFechaData) {
        const valorTotal = Math.max(0, inventarioFechaData.netoPeso) * PRECIO_KG;
        valorEstimadoElement.textContent = `S/ ${valorTotal.toFixed(2)}`;
        console.log('💰 Valor estimado actualizado:', valorTotal.toFixed(2));
    }

    // 4. Función especial para el texto específico del KPI
    actualizarTextoKPIPrecio();

    console.log('✅ Precio actualizado en toda la página');
}

// Función específica para actualizar el texto en el KPI
function actualizarTextoKPIPrecio() {
    const precioFormateado = PRECIO_KG.toFixed(2);

    // Buscar el contenedor del KPI de valor estimado
    const kpiValorEstimado = document.querySelector('.card.border-warning.shadow-sm');
    if (kpiValorEstimado) {
        // Buscar todos los elementos small dentro del KPI
        const elementosSmall = kpiValorEstimado.querySelectorAll('small');

        elementosSmall.forEach(elemento => {
            const texto = elemento.textContent.trim();
            // Buscar el que dice "A S/ 8.50 x kg"
            if (texto.includes('A S/') && texto.includes('x kg')) {
                elemento.textContent = `A S/ ${precioFormateado} x kg`;
                console.log('🎯 KPI pequeño actualizado:', elemento.textContent);
                return;
            }
        });
    }

    // También buscar en el encabezado del inventario
    const headerPrecio = document.querySelector('.d-flex.align-items-center.justify-content-end span');
    if (headerPrecio) {
        const texto = headerPrecio.textContent.trim();
        if (texto.includes('Precio:')) {
            headerPrecio.innerHTML = `Precio: <strong>S/ ${precioFormateado} x kg</strong>`;
            console.log('🎯 Encabezado actualizado:', headerPrecio.textContent);
        }
    }
}

// Versión ALTERNATIVA más directa (usa esta si la anterior no funciona)
function actualizarDisplayPrecioDirecto() {
    const precioFormateado = PRECIO_KG.toFixed(2);

    console.log('🎯 Actualizando precio directamente...');

    // Método 1: Buscar por contenido exacto
    const elementos = document.querySelectorAll('*');

    elementos.forEach(el => {
        if (el.children.length === 0) {
            const texto = el.textContent.trim();

            // Buscar el texto específico que muestra el precio
            if (texto === 'A S/ 8.50 x kg' ||
                texto === 'A S/ 8.50 x kg' ||
                texto.includes('A S/') && texto.includes('x kg')) {

                el.textContent = `A S/ ${precioFormateado} x kg`;
                console.log('✅ Texto encontrado y actualizado:', el.textContent);
            }

            // Buscar "Precio: S/ 8.50 x kg"
            if (texto.includes('Precio: S/') && texto.includes('x kg')) {
                el.textContent = `Precio: S/ ${precioFormateado} x kg`;
                console.log('✅ Texto del precio actualizado:', el.textContent);
            }
        }
    });

    // Método 2: Buscar por estructura HTML
    const kpiCard = document.querySelector('.card.border-warning.shadow-sm .card-body');
    if (kpiCard) {
        const smallElements = kpiCard.querySelectorAll('small');
        smallElements.forEach(small => {
            if (small.textContent.includes('A S/')) {
                small.textContent = `A S/ ${precioFormateado} x kg`;
            }
        });
    }

    // Actualizar también los elementos con IDs
    const precioActual = document.getElementById('precioActual');
    const precioDisplay = document.getElementById('precioDisplay');

    if (precioActual) precioActual.textContent = precioFormateado;
    if (precioDisplay) precioDisplay.textContent = precioFormateado;

    console.log('✅ Precio actualizado directamente');
}
// Cálculo principal de inventario por fecha
async function cargarInventarioPorFecha(fecha = null) {
    try {
        const fechaObj = fecha ? new Date(fecha) : new Date();
        fechaObj.setHours(0, 0, 0, 0);

        console.log('📦 Calculando inventario para:', fechaObj.toLocaleDateString());

        // 1. Obtener TODOS los ingresos del día (Pollo Vivo)
        const ingresosDia = await obtenerIngresosDelDia(fechaObj);

        // 2. Obtener TODAS las salidas del día (Pollo Beneficiado)
        const salidasDia = await obtenerSalidasDelDia(fechaObj);

        // 3. Calcular totales
        const totalIngresosPollos = calcularTotalIngresosPollos(ingresosDia);
        const totalIngresosPeso = calcularTotalIngresosPeso(ingresosDia);
        const totalSalidasPollos = calcularTotalSalidasPollos(salidasDia);
        const totalSalidasPeso = calcularTotalSalidasPeso(salidasDia);

        // 4. Calcular neto del día
        const netoPollos = totalIngresosPollos - totalSalidasPollos;
        const netoPeso = totalIngresosPeso - totalSalidasPeso;

        // 5. Obtener distribución por tienda
        const distribucion = await cargarDistribucionPorFecha(fechaObj);

        // 6. Calcular valor total (basado en el neto)
        const valorTotal = Math.max(0, netoPeso) * PRECIO_KG;

        // 7. Actualizar datos
        inventarioFechaData = {
            fecha: fechaObj,
            fechaTexto: fechaObj.toLocaleDateString('es-PE'),
            ingresosPollos: totalIngresosPollos,
            salidasPollos: totalSalidasPollos,
            netoPollos: netoPollos,
            ingresosPeso: totalIngresosPeso,
            salidasPeso: totalSalidasPeso,
            netoPeso: netoPeso,
            valor: valorTotal,
            ingresosCount: ingresosDia.length,
            salidasCount: salidasDia.length,
            movimientos: [...ingresosDia, ...salidasDia],
            distribucion: distribucion
        };

        // 8. Renderizar en interfaz
        renderizarInventarioFecha();
        actualizarControlesFecha(fechaObj);

        console.log('✅ Inventario calculado:', {
            fecha: fechaObj.toLocaleDateString(),
            ingresosPollos: totalIngresosPollos,
            salidasPollos: totalSalidasPollos,
            netoPollos: netoPollos,
            ingresosPeso: totalIngresosPeso.toFixed(2),
            salidasPeso: totalSalidasPeso.toFixed(2),
            netoPeso: netoPeso.toFixed(2)
        });

    } catch (error) {
        console.error('❌ Error al cargar inventario:', error);
        mostrarErrorInventario('Error: ' + error.message);
    }
}

// Obtener ingresos del día (Pollo Vivo)
async function obtenerIngresosDelDia(fecha) {
    try {
        const inicioDia = getInicioDelDia(fecha);
        const finDia = getFinDelDia(fecha);

        const snapshot = await db.collection('registros')
            .where('fecha', '>=', firebase.firestore.Timestamp.fromDate(inicioDia))
            .where('fecha', '<', firebase.firestore.Timestamp.fromDate(finDia))
            .orderBy('fecha', 'asc')
            .get();

        const ingresos = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            const pesoJaba = data.pesoJaba || 1.2;
            const { cPollos, neto } = calcular(
                data.cantidadJabas || 0,
                data.pollosPorJaba || 0,
                data.pesoBruto || 0,
                pesoJaba
            );

            ingresos.push({
                id: doc.id,
                tipo: 'INGRESO',
                producto: 'POLLO VIVO',
                cantidad: data.cantidadJabas || 0,
                pollosPorUnidad: data.pollosPorJaba || 0,
                totalPollos: cPollos,
                pesoBruto: data.pesoBruto || 0,
                pesoNeto: neto,
                fecha: data.fecha,
                timestamp: data.fecha?.toDate() || new Date()
            });
        });

        return ingresos;
    } catch (error) {
        console.error('Error obteniendo ingresos:', error);
        return [];
    }
}

// Obtener salidas del día (Pollo Beneficiado)
async function obtenerSalidasDelDia(fecha) {
    try {
        const inicioDia = getInicioDelDia(fecha);
        const finDia = getFinDelDia(fecha);

        const snapshot = await db.collection('salidas')
            .where('fecha', '>=', firebase.firestore.Timestamp.fromDate(inicioDia))
            .where('fecha', '<', firebase.firestore.Timestamp.fromDate(finDia))
            .orderBy('fecha', 'asc')
            .get();

        const salidas = [];
        snapshot.forEach(doc => {
            const data = doc.data();

            salidas.push({
                id: doc.id,
                tipo: 'SALIDA',
                producto: 'POLLO BENEFICIADO',
                tienda: data.tienda || 'Sin destino',
                tinas: data.tinas || 0,
                pollosPorTina: data.pollosPorTina || 0,
                totalPollos: data.totalPollos || 0,
                pesoNeto: data.pesoNeto || 0,
                fecha: data.fecha,
                timestamp: data.fecha?.toDate() || new Date()
            });
        });

        return salidas;
    } catch (error) {
        console.error('Error obteniendo salidas:', error);
        return [];
    }
}

// Calcular total de pollos ingresados
function calcularTotalIngresosPollos(ingresos) {
    return ingresos.reduce((total, ingreso) => total + (ingreso.totalPollos || 0), 0);
}

// Calcular total de peso ingresado
function calcularTotalIngresosPeso(ingresos) {
    return ingresos.reduce((total, ingreso) => total + (ingreso.pesoNeto || 0), 0);
}

// Calcular total de pollos salidos
function calcularTotalSalidasPollos(salidas) {
    return salidas.reduce((total, salida) => total + (salida.totalPollos || 0), 0);
}

// Calcular total de peso salido
function calcularTotalSalidasPeso(salidas) {
    return salidas.reduce((total, salida) => total + (salida.pesoNeto || 0), 0);
}

// Renderizar inventario en la interfaz (VERSIÓN MEJORADA)
function renderizarInventarioFecha() {
    try {
        console.log('🎨 Renderizando inventario...');

        // Actualizar fecha display
        document.getElementById('fechaDisplay').textContent = inventarioFechaData.fechaTexto || '--/--/----';

        // 1. ACTUALIZAR KPIs PRINCIPALES
        // Total Pollos (Neto = Ingresos - Salidas)
        document.getElementById('inventarioTotalPollos').textContent =
            inventarioFechaData.netoPollos.toLocaleString();

        // Peso Total (Neto)
        document.getElementById('inventarioPesoTotal').textContent =
            `${inventarioFechaData.netoPeso.toFixed(2)} KG`;

        // Valor Estimado
        document.getElementById('inventarioValor').textContent =
            `S/ ${inventarioFechaData.valor.toFixed(2)}`;

        // 2. ACTUALIZAR MOVIMIENTOS DEL DÍA
        document.getElementById('ingresosDia').textContent = inventarioFechaData.ingresosCount;
        document.getElementById('salidasDia').textContent = inventarioFechaData.salidasCount;
        document.getElementById('ultimaActualizacion').textContent =
            new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

        // 3. CALCULAR Y MOSTRAR PROMEDIOS
        const totalMovimientos = inventarioFechaData.ingresosCount + inventarioFechaData.salidasCount;
        document.getElementById('totalMovimientos').textContent =
            `${totalMovimientos} movimientos registrados`;

        // Promedio de peso por pollo (neto)
        const promedioPeso = inventarioFechaData.netoPollos > 0
            ? inventarioFechaData.netoPeso / inventarioFechaData.netoPollos
            : 0;
        document.getElementById('promedioPeso').textContent = promedioPeso.toFixed(3);

        // Promedio de pollos por movimiento
        const promedioPollos = totalMovimientos > 0
            ? inventarioFechaData.netoPollos / totalMovimientos
            : 0;
        document.getElementById('promedioPollos').textContent = promedioPollos.toFixed(1);

        // 4. RENDERIZAR TABLA DE PRODUCTOS DETALLADA
        const tbody = document.getElementById('tablaInventario');
        tbody.innerHTML = '';

        // Producto 1: POLLO VIVO (INGRESOS)
        if (inventarioFechaData.ingresosPollos > 0) {
            tbody.innerHTML += `
                <tr class="table-success">
                    <td><strong>🐔 POLLO VIVO (INGRESOS)</strong></td>
                    <td>${inventarioFechaData.ingresosPollos.toLocaleString()}</td>
                    <td>${inventarioFechaData.ingresosPeso.toFixed(2)} KG</td>
                    <td>S/ ${(inventarioFechaData.ingresosPeso * PRECIO_KG).toFixed(2)}</td>
                    <td>${inventarioFechaData.fechaTexto}</td>
                    <td><span class="badge bg-success">INGRESADO</span></td>
                </tr>
            `;
        }

        // Producto 2: POLLO BENEFICIADO (SALIDAS)
        if (inventarioFechaData.salidasPollos > 0) {
            tbody.innerHTML += `
                <tr class="table-danger">
                    <td><strong>🍗 POLLO BENEFICIADO (SALIDAS)</strong></td>
                    <td>${inventarioFechaData.salidasPollos.toLocaleString()}</td>
                    <td>${inventarioFechaData.salidasPeso.toFixed(2)} KG</td>
                    <td>S/ ${(inventarioFechaData.salidasPeso * PRECIO_KG).toFixed(2)}</td>
                    <td>${inventarioFechaData.fechaTexto}</td>
                    <td><span class="badge bg-danger">VENDIDO</span></td>
                </tr>
            `;
        }

        // Producto 3: NETO (DIFERENCIA)
        tbody.innerHTML += `
            <tr class="table-primary fw-bold">
                <td><strong>📊 NETO DEL DÍA (INGRESOS - SALIDAS)</strong></td>
                <td>${inventarioFechaData.netoPollos.toLocaleString()}</td>
                <td>${inventarioFechaData.netoPeso.toFixed(2)} KG</td>
                <td>S/ ${inventarioFechaData.valor.toFixed(2)}</td>
                <td>${inventarioFechaData.fechaTexto}</td>
                <td>
                    <span class="badge ${inventarioFechaData.netoPollos > 0 ? 'bg-success' :
                inventarioFechaData.netoPollos < 0 ? 'bg-danger' : 'bg-secondary'
            }">
                        ${inventarioFechaData.netoPollos > 0 ? 'RESTANTE' :
                inventarioFechaData.netoPollos < 0 ? 'DÉFICIT' : 'EQUILIBRIO'}
                    </span>
                </td>
            </tr>
        `;

        // 5. AGREGAR DETALLE DE MOVIMIENTOS (expandible)
        if (inventarioFechaData.movimientos.length > 0) {
            tbody.innerHTML += `
                <tr id="detalleMovimientosRow">
                    <td colspan="6" class="p-0">
                        <div class="accordion" id="accordionMovimientos">
                            <div class="accordion-item">
                                <h2 class="accordion-header">
                                    <button class="accordion-button collapsed" type="button" 
                                            data-bs-toggle="collapse" data-bs-target="#collapseMovimientos">
                                        📝 Ver detalle de ${inventarioFechaData.movimientos.length} movimientos
                                    </button>
                                </h2>
                                <div id="collapseMovimientos" class="accordion-collapse collapse" 
                                     data-bs-parent="#accordionMovimientos">
                                    <div class="accordion-body p-0">
                                        <table class="table table-sm mb-0">
                                            <thead>
                                                <tr>
                                                    <th>Tipo</th>
                                                    <th>Hora</th>
                                                    <th>Producto</th>
                                                    <th>Cantidad</th>
                                                    <th>Pollos</th>
                                                    <th>Peso</th>
                                                    <th>Destino</th>
                                                </tr>
                                            </thead>
                                            <tbody id="detalleMovimientosBody">
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            `;

            // Llenar detalle de movimientos
            setTimeout(() => {
                const detalleBody = document.getElementById('detalleMovimientosBody');
                if (detalleBody) {
                    inventarioFechaData.movimientos.sort((a, b) =>
                        (b.timestamp || new Date()) - (a.timestamp || new Date())
                    );

                    inventarioFechaData.movimientos.forEach(mov => {
                        const hora = mov.timestamp
                            ? mov.timestamp.toLocaleTimeString('es-PE', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })
                            : '--:--';

                        detalleBody.innerHTML += `
                            <tr class="${mov.tipo === 'INGRESO' ? 'table-success' : 'table-danger'}">
                                <td><span class="badge ${mov.tipo === 'INGRESO' ? 'bg-success' : 'bg-danger'}">
                                    ${mov.tipo === 'INGRESO' ? '⬆️' : '⬇️'} ${mov.tipo}
                                </span></td>
                                <td>${hora}</td>
                                <td>${mov.producto}</td>
                                <td>${mov.tipo === 'INGRESO' ? `${mov.cantidad} jabas` : `${mov.tinas} tinas`}</td>
                                <td>${mov.totalPollos}</td>
                                <td>${mov.pesoNeto?.toFixed(2) || '0.00'} KG</td>
                                <td>${mov.tienda || 'N/A'}</td>
                            </tr>
                        `;
                    });
                }
            }, 100);
        }

        // 6. RENDERIZAR DISTRIBUCIÓN POR TIENDA
        renderizarDistribucionTiendasFecha();

        console.log('✅ Inventario renderizado exitosamente');

    } catch (error) {
        console.error('❌ Error renderizando inventario:', error);
        mostrarErrorInventario(error.message);
    }
}

// Renderizar distribución por tienda (actualizada)
function renderizarDistribucionTiendasFecha() {
    const tbody = document.getElementById('tablaDistribucionTiendas');
    tbody.innerHTML = '';

    if (!inventarioFechaData.distribucion || inventarioFechaData.distribucion.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">
                    No hay distribuciones para esta fecha
                </td>
            </tr>
        `;
        document.getElementById('totalDistribucion').textContent = '0 tiendas';
        return;
    }

    document.getElementById('totalDistribucion').textContent =
        `${inventarioFechaData.distribucion.length} tiendas`;

    // Ordenar por cantidad de pollos (descendente)
    inventarioFechaData.distribucion
        .sort((a, b) => b.pollos - a.pollos)
        .forEach(item => {
            const fechaFormateada = item.ultimoEnvio
                ? item.ultimoEnvio.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
                : '--:--';

            tbody.innerHTML += `
                <tr>
                    <td><strong>🏪 ${item.tienda}</strong></td>
                    <td>${item.pollos.toLocaleString()}</td>
                    <td>${item.peso.toFixed(2)} KG</td>
                    <td><span class="badge bg-info">${item.envios}</span></td>
                    <td><small>${fechaFormateada}</small></td>
                </tr>
            `;
        });
}

// Cargar distribución por fecha (actualizada)
async function cargarDistribucionPorFecha(fecha) {
    try {
        const inicioDia = getInicioDelDia(fecha);
        const finDia = getFinDelDia(fecha);

        const salidasSnap = await db.collection('salidas')
            .where('fecha', '>=', firebase.firestore.Timestamp.fromDate(inicioDia))
            .where('fecha', '<', firebase.firestore.Timestamp.fromDate(finDia))
            .get();

        const distribucion = {};
        salidasSnap.forEach(doc => {
            const data = doc.data();
            const tienda = data.tienda || 'SIN ESPECIFICAR';

            if (!distribucion[tienda]) {
                distribucion[tienda] = {
                    pollos: 0,
                    peso: 0,
                    envios: 0,
                    ultimoEnvio: null
                };
            }

            distribucion[tienda].pollos += data.totalPollos || 0;
            distribucion[tienda].peso += data.pesoNeto || 0;
            distribucion[tienda].envios += 1;

            const fechaEnvio = data.fecha?.toDate();
            if (!distribucion[tienda].ultimoEnvio ||
                fechaEnvio > distribucion[tienda].ultimoEnvio) {
                distribucion[tienda].ultimoEnvio = fechaEnvio;
            }
        });

        return Object.entries(distribucion).map(([tienda, datos]) => ({
            tienda,
            ...datos
        }));

    } catch (error) {
        console.error('Error cargando distribución:', error);
        return [];
    }
}

// Actualizar controles de fecha
function actualizarControlesFecha(fecha) {
    const fechaInput = document.getElementById('fechaInventario');
    if (fechaInput) {
        fechaInput.value = fecha.toISOString().split('T')[0];

        // Deshabilitar fechas futuras
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        fechaInput.max = hoy.toISOString().split('T')[0];
    }
}

// Funciones de navegación por fecha
function fechaInventarioAnterior() {
    const nuevaFecha = new Date(inventarioFechaData.fecha);
    nuevaFecha.setDate(nuevaFecha.getDate() - 1);
    cargarInventarioPorFecha(nuevaFecha);
}

function fechaInventarioSiguiente() {
    const nuevaFecha = new Date(inventarioFechaData.fecha);
    nuevaFecha.setDate(nuevaFecha.getDate() + 1);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (nuevaFecha <= hoy) {
        cargarInventarioPorFecha(nuevaFecha);
    } else {
        mostrarNotificacion('⚠️ No puedes ver fechas futuras', 'warning');
    }
}

function irAFechaInventario() {
    const input = document.getElementById('fechaInventario');
    if (input.value) {
        cargarInventarioPorFecha(input.value);
    }
}

function cargarInventarioFechaHoy() {
    cargarInventarioPorFecha(new Date());
}

// Modal para editar precio
function mostrarModalPrecio() {
    // Si el modal ya está abierto, no hacer nada
    if (modalPrecioAbierto) return;

    modalPrecioAbierto = true;
    // Crear modal de forma más limpia
    const modalHtml = `
        <div class="modal fade" id="modalPrecioInventario" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-dark">
                        <h5 class="modal-title">💰 Editar Precio por Kilogramo</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label fw-bold">Precio actual (S/ por kg)</label>
                            <div class="input-group input-group-lg">
                                <span class="input-group-text">S/</span>
                                <input type="text" 
                                       id="inputNuevoPrecio" 
                                       class="form-control precio-input" 
                                       value="${PRECIO_KG.toFixed(2)}"
                                       placeholder="Ej: 8.50"
                                       autofocus>
                            </div>
                            <div class="form-text">Escribe el nuevo precio con dos decimales</div>
                        </div>
                        
                        <!-- Botones de cambio rápido -->
                        <div class="d-flex gap-2 mt-3 justify-content-center">
                            <button type="button" class="btn btn-sm btn-outline-success" 
                                    onclick="ajustarPrecio(0.10)">+0.10</button>
                            <button type="button" class="btn btn-sm btn-outline-danger" 
                                    onclick="ajustarPrecio(-0.10)">-0.10</button>
                            <button type="button" class="btn btn-sm btn-outline-secondary" 
                                    onclick="resetearPrecio()">Reset</button>
                        </div>
                        
                        <!-- Preview del cambio -->
                        <div class="mt-4 p-3 border rounded bg-light" id="previewCambioPrecio">
                            <small class="text-muted d-block mb-1">Vista previa del cambio:</small>
                            <div class="d-flex justify-content-between">
                                <span>Precio actual:</span>
                                <strong class="text-dark">S/ ${PRECIO_KG.toFixed(2)}</strong>
                            </div>
                            <div class="d-flex justify-content-between mt-1">
                                <span>Nuevo precio:</span>
                                <strong id="precioNuevoPreview" class="text-primary">S/ ${PRECIO_KG.toFixed(2)}</strong>
                            </div>
                            <div class="d-flex justify-content-between mt-1">
                                <span>Diferencia:</span>
                                <span id="diferenciaPreview" class="text-muted">Sin cambios</span>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="guardarPrecioDesdeModal()">
                            💾 Guardar Cambios
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Eliminar modal anterior si existe
    const modalExistente = document.getElementById('modalPrecioInventario');
    if (modalExistente) {
        modalExistente.remove();
    }

    // Agregar nuevo modal al documento
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Obtener referencia al modal
    const modalElement = document.getElementById('modalPrecioInventario');

    // Configurar evento para cuando se cierra el modal
    modalElement.addEventListener('hidden.bs.modal', function () {
        modalPrecioAbierto = false;
        this.remove();
    });

    // Configurar input
    const inputPrecio = document.getElementById('inputNuevoPrecio');
    if (inputPrecio) {
        // Configurar validación de entrada
        inputPrecio.addEventListener('input', function (e) {
            // Limpiar input: solo números y un punto decimal
            this.value = this.value.replace(/[^0-9.]/g, '');

            // Solo un punto decimal
            const partes = this.value.split('.');
            if (partes.length > 2) {
                this.value = partes[0] + '.' + partes.slice(1).join('');
            }

            // Limitar a 2 decimales
            if (partes.length === 2 && partes[1].length > 2) {
                this.value = partes[0] + '.' + partes[1].substring(0, 2);
            }

            // Actualizar vista previa
            actualizarVistaPreviaPrecio(this.value);
        });

        // Seleccionar todo el texto al hacer focus
        inputPrecio.addEventListener('focus', function () {
            this.select();
        });

        // Permitir guardar con Enter
        inputPrecio.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                guardarPrecioDesdeModal();
            }
        });

        // Inicializar vista previa
        actualizarVistaPreviaPrecio(inputPrecio.value);
    }

    // Mostrar modal
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}


function resetearPrecio() {
    const input = document.getElementById('inputNuevoPrecio');
    if (!input) return;

    input.value = '8.50';
    actualizarVistaPreviaPrecio(input.value);
}

// Función para ajustar precio desde botones
function ajustarPrecio(cantidad) {
    const input = document.getElementById('inputNuevoPrecio');
    if (!input) return;

    let valor = parseFloat(input.value) || PRECIO_KG;
    valor = Math.max(0.01, Math.round((valor + cantidad) * 100) / 100);
    input.value = valor.toFixed(2);

    // Actualizar vista previa
    actualizarVistaPreviaPrecio(input.value);
}
// Función auxiliar para cambiar precio desde botones
function cambiarPrecioInput(cantidad) {
    const input = document.getElementById('inputNuevoPrecio');
    if (!input) return;

    let valor = parseFloat(input.value) || PRECIO_KG;
    valor = Math.round((valor + cantidad) * 100) / 100; // Evitar errores de decimales
    if (valor < 0.01) valor = 0.01;
    input.value = valor.toFixed(2);
}

// Función para guardar desde el modal
function guardarPrecioDesdeInput() {
    const input = document.getElementById('inputNuevoPrecio');
    if (!input) return;

    const nuevoPrecioStr = input.value.replace(',', '.');
    const nuevoPrecio = parseFloat(nuevoPrecioStr);

    if (isNaN(nuevoPrecio) || nuevoPrecio <= 0) {
        alert('❌ Ingrese un precio válido (mayor a 0)');
        input.focus();
        return;
    }

    PRECIO_KG = nuevoPrecio;
    localStorage.setItem('precio_kg_inventario', PRECIO_KG);
    actualizarDisplayPrecio();
    cargarInventarioPorFecha(inventarioFechaData.fecha);

    const modal = bootstrap.Modal.getInstance(document.getElementById('modalPrecioInventario'));
    if (modal) modal.hide();

    alert(`✅ Precio actualizado: S/ ${PRECIO_KG.toFixed(2)} por kg`);
}
// Función para actualizar vista previa del precio
function actualizarVistaPreviaPrecio(nuevoValorStr) {
    try {
        const nuevoValor = parseFloat(nuevoValorStr) || PRECIO_KG;

        // Actualizar preview de nuevo precio
        const precioNuevoPreview = document.getElementById('precioNuevoPreview');
        if (precioNuevoPreview) {
            precioNuevoPreview.textContent = `S/ ${nuevoValor.toFixed(2)}`;
            precioNuevoPreview.className = nuevoValor !== PRECIO_KG ? 'text-success fw-bold' : 'text-primary';
        }

        // Calcular y mostrar diferencia
        const diferencia = nuevoValor - PRECIO_KG;
        const diferenciaPorcentaje = PRECIO_KG > 0 ? (diferencia / PRECIO_KG) * 100 : 0;

        const diferenciaPreview = document.getElementById('diferenciaPreview');
        if (diferenciaPreview) {
            if (diferencia === 0) {
                diferenciaPreview.textContent = 'Sin cambios';
                diferenciaPreview.className = 'text-muted';
            } else if (diferencia > 0) {
                diferenciaPreview.innerHTML = `
                    <span class="text-success fw-bold">
                        ▲ +${diferencia.toFixed(2)} (${diferenciaPorcentaje.toFixed(1)}%)
                    </span>
                `;
            } else {
                diferenciaPreview.innerHTML = `
                    <span class="text-danger fw-bold">
                        ▼ ${diferencia.toFixed(2)} (${diferenciaPorcentaje.toFixed(1)}%)
                    </span>
                `;
            }
        }

    } catch (error) {
        console.error('Error actualizando vista previa:', error);
    }
}
// guardarPrecioDesdeModal: función principal para guardar el precio desde el modal
function guardarPrecioDesdeModal() {
    const input = document.getElementById('inputNuevoPrecio');
    if (!input) {
        alert('❌ No se encontró el campo de precio');
        return;
    }

    const nuevoPrecioStr = input.value.replace(',', '.');
    const nuevoPrecio = parseFloat(nuevoPrecioStr);

    // Validaciones
    if (isNaN(nuevoPrecio) || nuevoPrecio <= 0) {
        alert('❌ Ingrese un precio válido (mayor a 0)');
        input.focus();
        input.select();
        return;
    }

    if (nuevoPrecio > 99.99) {
        alert('❌ El precio no puede ser mayor a S/ 99.99');
        input.focus();
        input.select();
        return;
    }

    // Guardar el precio anterior para comparación
    const precioAnterior = PRECIO_KG;

    // Actualizar precio
    PRECIO_KG = nuevoPrecio;
    localStorage.setItem('precio_kg_inventario', PRECIO_KG);

    // DEBUG: Ver qué estamos actualizando
    console.log('===================================');
    console.log('🔄 ACTUALIZANDO PRECIO');
    console.log('Precio anterior:', precioAnterior);
    console.log('Precio nuevo:', PRECIO_KG);
    console.log('===================================');

    // Intentar TODOS los métodos de actualización
    actualizarDisplayPrecio();           // Método principal
    actualizarTextoKPIPrecio();          // Método específico
    actualizarDisplayPrecioDirecto();    // Método directo

    // Forzar actualización visual
    setTimeout(() => {
        // Buscar manualmente el texto
        const todosLosElementos = document.querySelectorAll('body *');

        todosLosElementos.forEach(el => {
            if (el.textContent && el.textContent.includes('8.50')) {
                console.log('🔍 Elemento con 8.50:', el.textContent);
                // Reemplazar cualquier 8.50 que sea el precio por kg
                const nuevoTexto = el.textContent.replace(/8\.50(?=\s*x?\s*kg)/g, PRECIO_KG.toFixed(2));
                if (nuevoTexto !== el.textContent) {
                    el.textContent = nuevoTexto;
                    console.log('🔄 Texto reemplazado:', nuevoTexto);
                }
            }
        });
    }, 100);

    // Recalcular inventario
    if (inventarioFechaData && inventarioFechaData.fecha) {
        cargarInventarioPorFecha(inventarioFechaData.fecha);
    }

    // Cerrar modal
    const modalElement = document.getElementById('modalPrecioInventario');
    if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) modal.hide();
    }

    // Mostrar mensaje de éxito
    alert(`✅ Precio actualizado a S/ ${PRECIO_KG.toFixed(2)} por kg`);

    // Forzar recarga de la página si es necesario (último recurso)
    setTimeout(() => {
        if (document.querySelector('small') && document.querySelector('small').textContent.includes('8.50')) {
            console.warn('⚠️ Precio no se actualizó, recargando...');
            location.reload();
        }
    }, 500);
}
// Actualizar display del precio en la interfaz
function actualizarDisplayPrecio() {
    // Actualizar en el KPI
    const valorEstimadoElement = document.getElementById('inventarioValor');
    if (valorEstimadoElement) {
        // El valor ya se recalcula en cargarInventarioPorFecha
        // Solo actualizamos el texto del precio
        const precioSubtexto = document.getElementById('precioPorKgDisplay');
        if (precioSubtexto) {
            precioSubtexto.textContent = `A S/ ${PRECIO_KG.toFixed(2)} x kg`;
        }
    }

    // Actualizar en otros lugares si existen
    document.querySelectorAll('.precio-display').forEach(el => {
        el.textContent = PRECIO_KG.toFixed(2);
    });
}
// Función de notificación
// Función simple de notificación
function mostrarNotificacion(mensaje, tipo = 'info') {
    // Si ya existe una notificación, quitarla
    const notificacionExistente = document.getElementById('notificacionGlobal');
    if (notificacionExistente) {
        notificacionExistente.remove();
    }

    const tiposClases = {
        'success': 'alert-success',
        'error': 'alert-danger',
        'warning': 'alert-warning',
        'info': 'alert-info'
    };

    const clase = tiposClases[tipo] || 'alert-info';

    const notificacionHtml = `
        <div id="notificacionGlobal" class="alert ${clase} alert-dismissible fade show position-fixed" 
             style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', notificacionHtml);

    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
        const notificacion = document.getElementById('notificacionGlobal');
        if (notificacion) notificacion.remove();
    }, 5000);
}

// Función para actualizar valor estimado en tiempo real
function actualizarValorEstimadoPreview(nuevoPrecio) {
    const valorActual = inventarioFechaData.netoPeso * PRECIO_KG;
    const valorNuevo = inventarioFechaData.netoPeso * nuevoPrecio;
    const diferenciaValor = valorNuevo - valorActual;

    // Podemos mostrar esta información en un tooltip o elemento adicional
    const previewCard = document.getElementById('previewCambioPrecio');
    if (previewCard) {
        // Agregar info de valor estimado si no existe
        let valorInfo = previewCard.querySelector('.valor-estimado-info');
        if (!valorInfo) {
            valorInfo = document.createElement('div');
            valorInfo.className = 'valor-estimado-info mt-2 border-top pt-2';
            previewCard.querySelector('.card-body').appendChild(valorInfo);
        }

        valorInfo.innerHTML = `
            <small class="text-muted">Valor estimado del inventario:</small><br>
            <small>
                Actual: <span class="fw-bold">S/ ${valorActual.toFixed(2)}</span><br>
                Nuevo: <span class="fw-bold ${diferenciaValor >= 0 ? 'text-success' : 'text-danger'}">
                    S/ ${valorNuevo.toFixed(2)}
                </span>
                ${diferenciaValor !== 0 ?
                `(<span class="${diferenciaValor >= 0 ? 'text-success' : 'text-danger'}">
                        ${diferenciaValor >= 0 ? '+' : ''}${diferenciaValor.toFixed(2)}
                    </span>)` : ''}
            </small>
        `;
    }
}

// Función guardarPrecioInventario mejorada
function guardarPrecioInventario() {
    const input = document.getElementById('inputNuevoPrecio');
    if (!input) {
        mostrarNotificacion('❌ No se encontró el campo de precio', 'error');
        return;
    }

    const nuevoPrecioStr = input.value.replace(',', '.');
    const nuevoPrecio = parseFloat(nuevoPrecioStr);

    // Validaciones
    if (isNaN(nuevoPrecio) || nuevoPrecio <= 0) {
        mostrarNotificacion('❌ Ingrese un precio válido (mayor a 0)', 'error');
        input.focus();
        input.select();
        return;
    }

    if (nuevoPrecio > 99.99) {
        mostrarNotificacion('❌ El precio no puede ser mayor a S/ 99.99', 'error');
        input.focus();
        input.select();
        return;
    }

    // Confirmar cambio si la diferencia es grande
    const diferencia = Math.abs(nuevoPrecio - PRECIO_KG);
    const diferenciaPorcentaje = (diferencia / PRECIO_KG) * 100;

    if (diferenciaPorcentaje > 20) {
        const confirmacion = confirm(
            `⚠️ Estás cambiando el precio en un ${diferenciaPorcentaje.toFixed(1)}%\n` +
            `De: S/ ${PRECIO_KG.toFixed(2)} a S/ ${nuevoPrecio.toFixed(2)}\n\n` +
            `¿Estás seguro de continuar?`
        );

        if (!confirmacion) {
            input.focus();
            input.select();
            return;
        }
    }

    // Actualizar precio
    PRECIO_KG = nuevoPrecio;
    localStorage.setItem('precio_kg_inventario', PRECIO_KG);

    // Actualizar display
    actualizarDisplayPrecio();

    // Recalcular inventario
    cargarInventarioPorFecha(inventarioFechaData.fecha);

    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalPrecioInventario'));
    if (modal) modal.hide();

    // Mostrar notificación
    const mensaje = `✅ Precio actualizado: S/ ${PRECIO_KG.toFixed(2)} por kg`;
    if (diferencia !== 0) {
        const direccion = nuevoPrecio > PRECIO_KG ? 'subió' : 'bajó';
        mostrarNotificacion(`${mensaje} (${direccion} ${diferencia.toFixed(2)})`, 'success');
    } else {
        mostrarNotificacion(mensaje, 'success');
    }
}
// Exportar inventario a Excel
function exportarInventarioExcel() {
    try {
        const data = [
            ['INVENTARIO DIARIO - AVICRUZ SAC', '', '', '', '', ''],
            ['Fecha del inventario:', inventarioFechaData.fechaTexto, '', '', '', ''],
            ['Precio por kg:', `S/ ${PRECIO_KG.toFixed(2)}`, '', '', '', ''],
            ['', '', '', '', '', ''],
            ['CONCEPTO', 'POLLOS', 'PESO (KG)', 'VALOR ESTIMADO', 'FECHA', 'ESTADO']
        ];

        // Ingresos (Pollo Vivo)
        if (inventarioFechaData.ingresosPollos > 0) {
            data.push([
                'POLLO VIVO (INGRESOS)',
                inventarioFechaData.ingresosPollos,
                inventarioFechaData.ingresosPeso.toFixed(2),
                `S/ ${(inventarioFechaData.ingresosPeso * PRECIO_KG).toFixed(2)}`,
                inventarioFechaData.fechaTexto,
                'INGRESADO'
            ]);
        }

        // Salidas (Pollo Beneficiado)
        if (inventarioFechaData.salidasPollos > 0) {
            data.push([
                'POLLO BENEFICIADO (SALIDAS)',
                inventarioFechaData.salidasPollos,
                inventarioFechaData.salidasPeso.toFixed(2),
                `S/ ${(inventarioFechaData.salidasPeso * PRECIO_KG).toFixed(2)}`,
                inventarioFechaData.fechaTexto,
                'VENDIDO'
            ]);
        }

        // Neto
        data.push([
            'NETO DEL DÍA (INGRESOS - SALIDAS)',
            inventarioFechaData.netoPollos,
            `${inventarioFechaData.netoPeso.toFixed(2)} KG`,
            `S/ ${inventarioFechaData.valor.toFixed(2)}`,
            inventarioFechaData.fechaTexto,
            inventarioFechaData.netoPollos > 0 ? 'RESTANTE' :
                inventarioFechaData.netoPollos < 0 ? 'DÉFICIT' : 'EQUILIBRIO'
        ]);

        // Crear libro de Excel
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Inventario');

        // Exportar
        const fecha = inventarioFechaData.fecha.toISOString().split('T')[0];
        XLSX.writeFile(wb, `inventario_${fecha}.xlsx`);

        mostrarNotificacion('📊 Inventario exportado a Excel', 'success');

    } catch (error) {
        console.error('❌ Error al exportar inventario:', error);
        mostrarNotificacion('Error al exportar: ' + error.message, 'danger');
    }
}

// Mostrar error en inventario
function mostrarErrorInventario(mensaje) {
    const tbody = document.getElementById('tablaInventario');
    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center text-danger py-4">
                <div>
                    <i style="font-size: 2rem;">❌</i>
                    <p class="mt-2">Error al cargar inventario</p>
                    <p class="small text-muted">${mensaje}</p>
                    <button onclick="cargarInventarioFechaHoy()" class="btn btn-sm btn-primary mt-2">
                        Reintentar
                    </button>
                </div>
            </td>
        </tr>
    `;
}

// Inicializar listeners para actualización automática
function inicializarListenersInventario() {
    // Escuchar cambios en registros y salidas
    db.collection('registros').onSnapshot(() => {
        if (document.getElementById('inventario').classList.contains('active')) {
            console.log('🔄 Cambio en registros, actualizando inventario...');
            cargarInventarioPorFecha(inventarioFechaData.fecha);
        }
    });

    db.collection('salidas').onSnapshot(() => {
        if (document.getElementById('inventario').classList.contains('active')) {
            console.log('🔄 Cambio en salidas, actualizando inventario...');
            cargarInventarioPorFecha(inventarioFechaData.fecha);
        }
    });
}

// Inicializar inventario
// En tu función de inicialización
function inicializarInventario() {
    try {
        if (!document.getElementById('inventario')) {
            console.error('❌ Elemento #inventario no encontrado');
            return;
        }

        if (document.getElementById('inventario').classList.contains('active')) {
            console.log('📊 Inicializando inventario...');

            // 1. Cargar precio guardado (IMPORTANTE)
            cargarPrecioGuardado();

            // 2. Cargar inventario con fecha de hoy
            cargarInventarioPorFecha(new Date());

            // 3. Iniciar listeners
            inicializarListenersInventario();

            console.log('✅ Inventario inicializado con precio:', PRECIO_KG);
        }

    } catch (error) {
        console.error('❌ Error en inicializarInventario:', error);
    }
}

// Hacer funciones disponibles globalmente
window.cargarInventarioPorFecha = cargarInventarioPorFecha;
window.exportarInventarioExcel = exportarInventarioExcel;
window.mostrarModalPrecio = mostrarModalPrecio;
window.fechaInventarioAnterior = fechaInventarioAnterior;
window.fechaInventarioSiguiente = fechaInventarioSiguiente;
window.irAFechaInventario = irAFechaInventario;
window.cargarInventarioFechaHoy = cargarInventarioFechaHoy;
window.inicializarInventario = inicializarInventario;

console.log('✅ Módulo de inventario cargado');