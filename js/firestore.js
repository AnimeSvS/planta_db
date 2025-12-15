// firestore.js
let paginaActual = 1;  // Página inicial
let totalRegistros = 0; // Total de registros

// Función para cargar los datos por día en la tabla con soporte de paginación
// Función para cargar los datos por día en la tabla con soporte de paginación
async function cargarDatosPorDia(fecha, coleccion, tbodyId, paginaActual) {
    const collectionRef = coleccion === 'registros' ? registrosRef : eliminadosRef;
    const inicioDia = getInicioDelDia(fecha);
    const finDia = getFinDelDia(fecha);

    let query = collectionRef;

    // Si estamos buscando por fecha, agregamos el filtro
    if (coleccion === 'registros') {
        query = query
            .where('fecha', '>=', firebase.firestore.Timestamp.fromDate(inicioDia))
            .where('fecha', '<', firebase.firestore.Timestamp.fromDate(finDia));
    } else {
        query = query
            .where('fechaEliminacion', '>=', firebase.firestore.Timestamp.fromDate(inicioDia))
            .where('fechaEliminacion', '<', firebase.firestore.Timestamp.fromDate(finDia));
    }

    // Paginación: manejamos la paginación con Firestore
    const registrosPorPagina = 10;  // Número de registros por página
    let offset = (paginaActual - 1) * registrosPorPagina;

    query = query.limit(registrosPorPagina);

    // Si no estamos en la primera página, usamos startAfter para empezar desde el último documento visible
    if (paginaActual > 1) {
        const lastDoc = await getLastDocument(coleccion, paginaActual - 1);
        query = query.startAfter(lastDoc);
    }

    // Ejecutamos la consulta y obtenemos los resultados
    const snapshot = await query.get();
    const dataArray = snapshot.docs.map(doc => doc.data());

    // Renderizamos la tabla
    await renderTabla(dataArray, tbodyId);

    // Actualizamos la paginación
    actualizarPaginacion(paginaActual, snapshot.size, snapshot.docs.length);
}

// Función para obtener el último documento de la página anterior
async function getLastDocument(coleccion, paginaAnterior) {
    const collectionRef = coleccion === 'registros' ? registrosRef : eliminadosRef;
    const query = collectionRef.orderBy('fecha').limit(paginaAnterior * 10);  // Aseguramos que la consulta tenga suficientes registros
    const snapshot = await query.get();
    return snapshot.docs[snapshot.docs.length - 1];  // Retornamos el último documento de la página anterior
}

// Función para actualizar la paginación
function actualizarPaginacion(paginaActual, totalRegistros, numDocs) {
    const registrosPorPagina = 10;  // Número de registros por página
    const totalPaginas = Math.ceil(totalRegistros / registrosPorPagina);

    const btnPaginaAnterior = document.getElementById('btnPaginaAnterior');
    const btnPaginaSiguiente = document.getElementById('btnPaginaSiguiente');

    // Habilitar o deshabilitar los botones de paginación
    btnPaginaAnterior.disabled = paginaActual <= 1;
    btnPaginaSiguiente.disabled = numDocs < registrosPorPagina || paginaActual >= totalPaginas;
}


// Esta función elimina un registro
async function eliminarRegistro(e) {
    const id = e.target.dataset.id;

    // Obtener el registro para mostrar la confirmación
    const snap = await registrosRef.where('id', '==', id).get();
    if (snap.empty) {
        alert('Registro no encontrado');
        return;
    }
    const registro = snap.docs[0].data();

    // Llamamos a la función para mostrar el modal de confirmación
    mostrarConfirmacionEliminacion(registro, async () => {
        // Esta función se ejecuta cuando el usuario confirma la eliminación
        await eliminadosRef.add({
            ...registro,
            fechaEliminacion: firebase.firestore.Timestamp.fromDate(new Date()) // Añadimos la fecha de eliminación
        });

        // Eliminar el registro de la colección de registros
        await registrosRef.doc(snap.docs[0].id).delete();

        // Recargamos la tabla después de eliminar el registro
        cargarDatosInicial();
    });
}

// Función para mostrar el modal de confirmación de eliminación
function mostrarConfirmacionEliminacion(registro, onConfirm) {
    const modalExistente = document.getElementById('confirmModal');
    if (modalExistente) {
        const bsPrevio = bootstrap.Modal.getInstance(modalExistente);
        if (bsPrevio) {
            bsPrevio.hide();
        }
        modalExistente.remove();
    }

    const modalHtml = `
        <div class="modal fade" id="confirmModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content p-4">
                    <h5 class="modal-title mb-3">Confirmar Eliminación</h5>
                    <p>¿Está seguro de eliminar el registro con peso bruto: <strong>${registro.pesoBruto.toFixed(2)} KG</strong>?</p>
                    <p>Este cambio no se puede deshacer.</p>
                    <div class="text-end">
                        <button data-bs-dismiss="modal" class="btn btn-secondary me-2">Cancelar</button>
                        <button class="btn btn-danger" id="btnConfirmDelete">Eliminar</button>
                    </div>
                </div>
            </div>
        </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('confirmModal');
    const bs = new bootstrap.Modal(modalEl);
    bs.show();

    modalEl.querySelector('#btnConfirmDelete').addEventListener('click', () => {
        onConfirm(); // Se ejecuta la función pasada por parámetro (eliminar el registro)
        bs.hide(); // Cierra el modal después de confirmar
    });

    modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove()); // Eliminar modal del DOM cuando se cierre
}

// Función para eliminar la fila correspondiente de la tabla
function eliminarFilaDeLaTabla(id) {
    const tbody = document.getElementById('tablaRegistros');
    const filas = Array.from(tbody.getElementsByTagName('tr'));

    // Buscar la fila que corresponde al ID y eliminarla
    filas.forEach(fila => {
        const td = fila.querySelector('td');  // Suponiendo que el ID está en la primera columna
        if (td && td.textContent === id) {
            fila.remove();
        }
    });
}

// Esta función abre el modal de edición con los datos del registro
async function abrirEditar(e) {
    currentEditId = e.target.dataset.id;
    const snap = await registrosRef.where('id', '==', currentEditId).get();
    if (snap.empty) {
        alert('Registro no encontrado');
        return;
    }
    const d = snap.docs[0].data();
    document.getElementById('editId').value = d.id;
    document.getElementById('editFecha').value = formatearFecha(d.fecha);
    document.getElementById('editProducto').value = d.producto;
    document.getElementById('editCantidadJabas').value = d.cantidadJabas;
    document.getElementById('editPollosPorJaba').value = d.pollosPorJaba;
    document.getElementById('editPesoBruto').value = d.pesoBruto;
    new bootstrap.Modal(document.getElementById('editModal')).show();
}

// Función para agregar un nuevo registro a Firestore
// Función para agregar un nuevo registro a Firestore
async function agregarRegistro(form) {
    const cantidad = Number(document.getElementById('cantidadJabas').value); // Obtener la cantidad de jabas
    const pollosJaba = Number(document.getElementById('pollosPorJaba').value); // Obtener los pollos por jaba
    const pesoBr = Number(document.getElementById('pesoBruto').value); // Obtener el peso bruto

    // Obtener el valor de PESO_JABA desde el input
    const pesoJaba = parseFloat(document.getElementById('inputPesoJaba').value);  // Aquí obtenemos el valor ingresado de peso por jaba

    // Validar si el valor de pesoJaba es correcto
    if (isNaN(pesoJaba) || pesoJaba <= 0) {
        alert('Por favor, ingresa un valor válido para el peso por jaba.');
        return;  // Salir si el valor no es válido
    }

    // Mostrar la confirmación del peso bruto antes de guardar
    mostrarConfirmacionPesoBruto(pesoBr, async () => {
        // Obtener el último ID registrado de la base de datos
        const lastDoc = await registrosRef.orderBy('id', 'desc').limit(1).get();

        // Si no hay registros, asignamos el primer ID
        let nextIdNum = 10001;  // Si no hay registros, comenzamos desde 10001

        if (!lastDoc.empty) {
            // Si hay registros, tomamos el último ID
            const lastId = lastDoc.docs[0].data().id;
            const lastIdNum = Number(lastId.slice(4)); // Extraemos el número del ID (por ejemplo, PLEP00001 -> 1)
            nextIdNum = lastIdNum + 1;  // Incrementamos el número para el siguiente ID
        }

        // Generamos el siguiente ID
        const nextId = formatearID(nextIdNum);

        // Crear el objeto con los datos del registro
        const obj = {
            id: nextId,
            fecha: ahoraTimestamp(),  // Guardamos el Timestamp de la fecha actual
            producto: 'POLLO VIVO',  // Producto fijo
            cantidadJabas: cantidad,
            pollosPorJaba: pollosJaba,
            pesoBruto: pesoBr,
            pesoJaba: pesoJaba  // Incluir el valor de PESO_JABA
        };

        // Añadimos el nuevo registro a la base de datos
        await registrosRef.add(obj);
        // 🔹 ACTUALIZAR STOCK
        const stockRef = db.collection('stock').doc(obj.producto);
        const stockSnap = await stockRef.get();

        const { cPollos, neto } = calcular(
            cantidad,
            pollosJaba,
            pesoBr,
            pesoJaba
        );

        if (!stockSnap.exists) {
            await stockRef.set({
                producto: obj.producto,
                cantidadPollos: cPollos,
                pesoNeto: neto
            });
        } else {
            const stock = stockSnap.data();
            await stockRef.update({
                cantidadPollos: stock.cantidadPollos + cPollos,
                pesoNeto: stock.pesoNeto + neto
            });
        }

        form.reset();  // Limpiar el formulario

        // Recargamos los datos después de agregar el nuevo registro
        cargarDatosInicial();
    });
}


// Función para renderizar los datos de la tabla
async function renderTabla(dataArray, tbodyId) {
    const tbody = document.getElementById(tbodyId);
    tbody.innerHTML = '';  // Limpiamos la tabla antes de agregar los nuevos registros

    dataArray.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
                <td>${item.id}</td>
                <td>${formatearFecha(item.fecha)}</td>
                <td>${item.producto}</td>
                <td>${item.cantidadJabas}</td>
                <td>${item.pollosPorJaba}</td>
                <td>${item.pesoBruto}</td>
                <td>
                    <button class="btn btn-warning" data-id="${item.id}" onclick="abrirEditar(event)">Editar</button>
                    <button class="btn btn-danger" data-id="${item.id}" onclick="eliminarRegistro(event)">Eliminar</button>
                </td>
            `;
        tbody.appendChild(row);
    });

    // Actualizamos las flechas de paginación
    actualizarPaginacion();
}

// Función para actualizar la paginación
function actualizarPaginacion(paginaActual, totalRegistros) {
    const registrosPorPagina = 10;  // Cambiar si se necesitan más o menos registros por página
    const totalPaginas = Math.ceil(totalRegistros / registrosPorPagina);

    // Obtener los botones
    const btnPaginaAnterior = document.getElementById('btnPaginaAnterior');
    const btnPaginaSiguiente = document.getElementById('btnPaginaSiguiente');

    // Habilitar o deshabilitar los botones de paginación
    if (paginaActual <= 1) {
        btnPaginaAnterior.disabled = false;
    } else {
        btnPaginaAnterior.disabled = false;
    }

    if (paginaActual >= totalPaginas) {
        btnPaginaSiguiente.disabled = false;
    } else {
        btnPaginaSiguiente.disabled = false;
    }
}


// Función que se ejecuta al cargar la página o después de realizar cualquier cambio
async function cargarDatosInicial() {
    await cargarDatosPorDia(new Date(), 'registros', 'tablaRegistros', paginaActual);  // Cargamos los registros de la página actual
    await cargarDatosPorDia(new Date(), 'eliminados', 'tablaEliminados', paginaActual);  // Cargamos los eliminados (si es necesario)
}
async function registrarSalida({ producto, tienda, cantidadPollos, pesoNeto }) {
    const stockRef = db.collection('stock').doc(producto);
    const stockSnap = await stockRef.get();

    if (!stockSnap.exists) {
        alert('No hay stock disponible');
        return;
    }

    const stock = stockSnap.data();

    if (stock.cantidadPollos < cantidadPollos) {
        alert('Stock insuficiente');
        return;
    }

    // 1️⃣ Descontar stock
    await stockRef.update({
        cantidadPollos: stock.cantidadPollos - cantidadPollos,
        pesoNeto: stock.pesoNeto - pesoNeto
    });

    // 2️⃣ Registrar salida
    await db.collection('salidas').add({
        producto,
        tienda,
        cantidadPollos,
        pesoNeto,
        fecha: ahoraTimestamp()
    });

    alert('Salida registrada correctamente');
}
// --------------reporte tienda
async function obtenerReportePorTienda(fecha) {
    const inicio = getInicioDelDia(fecha);
    const fin = getFinDelDia(fecha);

    const snap = await db.collection('salidas')
        .where('fecha', '>=', firebase.firestore.Timestamp.fromDate(inicio))
        .where('fecha', '<', firebase.firestore.Timestamp.fromDate(fin))
        .get();

    const reporte = {};

    snap.forEach(doc => {
        const d = doc.data();
        if (!reporte[d.tienda]) {
            reporte[d.tienda] = { pollos: 0, peso: 0 };
        }
        reporte[d.tienda].pollos += d.cantidadPollos;
        reporte[d.tienda].peso += d.pesoNeto;
    });

    return reporte;
}
// ----------------stock bajo
async function verificarStockBajo() {
    const snap = await db.collection('stock').get();

    snap.forEach(doc => {
        const d = doc.data();
        if (d.cantidadPollos <= 100) {
            mostrarAlertaStock(d.producto, d.cantidadPollos);
        }
    });
}
// dashboard---
async function obtenerTotalesDashboard() {
    let totalPollos = 0;
    let totalPeso = 0;

    const stockSnap = await db.collection('stock').get();

    stockSnap.forEach(doc => {
        const d = doc.data();
        totalPollos += d.cantidadPollos;
        totalPeso += d.pesoNeto;
    });

    return { totalPollos, totalPeso };
}


// Función para formatear la fecha de manera legible
function formatearFecha(timestamp) {
    const date = timestamp.toDate();
    return date.toLocaleString('es-PE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Función para obtener el inicio del día (00:00)
function getInicioDelDia(fecha) {
    const inicio = new Date(fecha);
    inicio.setHours(0, 0, 0, 0);
    return inicio;
}

// Función para obtener el final del día (23:59:59)
function getFinDelDia(fecha) {
    const fin = new Date(fecha);
    fin.setHours(23, 59, 59, 999);
    return fin;
}

// Función para generar un ID único para el nuevo registro
function formatearID(id) {
    return 'PLEP' + String(id).padStart(5, '0');
}

// Función para obtener la fecha y hora actual como Timestamp de Firestore
function ahoraTimestamp() {
    return firebase.firestore.Timestamp.fromDate(new Date());
}

// Función para mostrar una confirmación antes de registrar el peso bruto
function mostrarConfirmacionPesoBruto(pesoBruto, onConfirm) {
    const modalExistente = document.getElementById('confirmModal');
    if (modalExistente) {
        const bsPrevio = bootstrap.Modal.getInstance(modalExistente);
        if (bsPrevio) {
            bsPrevio.hide();
        }
        modalExistente.remove();
    }

    const modalHtml = `
        <div class="modal fade" id="confirmModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content p-4">
                    <h5 class="modal-title mb-3">Confirmación de Eliminación</h5>
                    <p>¿Está seguro de eliminar el registro con peso bruto: <strong>${pesoBruto.toFixed(2)} KG</strong>?</p>
                    <p>Este cambio no se puede deshacer.</p>
                    <div class="text-end">
                        <button data-bs-dismiss="modal" class="btn btn-secondary me-2">Cancelar</button>
                        <button class="btn btn-danger" id="btnConfirmDelete">Eliminar</button>
                    </div>
                </div>
            </div>
        </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('confirmModal');
    const bs = new bootstrap.Modal(modalEl);
    bs.show();

    modalEl.querySelector('#btnConfirmDelete').addEventListener('click', () => {
        onConfirm(); // Se ejecuta la función pasada por parámetro (eliminar el registro)
        bs.hide(); // Cierra el modal después de confirmar
    });

    modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove()); // Eliminar modal del DOM cuando se cierre
}
// Función para ir a la página anterior
function paginaAnterior() {
    if (paginaActual > 1) {
        paginaActual--;
        cargarDatosInicial();  // Recargamos los datos para la nueva página
    }
}

// Función para ir a la página siguiente
function paginaSiguiente() {
    const totalPaginas = Math.ceil(totalRegistros / 10);  // Total de páginas
    if (paginaActual < totalPaginas) {
        paginaActual++;
        cargarDatosInicial();  // Recargamos los datos para la nueva página
    }
}
