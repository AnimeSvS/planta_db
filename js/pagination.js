// Variables globales para manejar la paginación
const PAGE_SIZE = 10;
let lastVisible = null;  // Último documento visible
let firstVisible = null;  // Primer documento visible
let pageStack = [];  // Pila de navegación para la paginación

// Función para cargar la página de registros
// Función para cargar la página de registros
async function cargarPaginaRegistros(fecha, direccion = 'primera') {
    // Si no se pasa fecha, usamos un rango por defecto (últimos 30 días)
    const inicioDia = getInicioDelDia(fecha || new Date());
    const finDia = getFinDelDia(fecha || new Date());

    let query = registrosRef.orderBy('fecha').limit(PAGE_SIZE);

    // Si se pasa una fecha, filtramos por el rango de la fecha
    if (fecha) {
        query = query
            .where('fecha', '>=', firebase.firestore.Timestamp.fromDate(inicioDia))
            .where('fecha', '<', firebase.firestore.Timestamp.fromDate(finDia));
    }

    // Si estamos navegando a la siguiente página, ajustamos la consulta
    if (direccion === 'siguiente' && lastVisible) {
        query = query.startAfter(lastVisible);
    } else if (direccion === 'anterior' && pageStack.length > 1) {
        pageStack.pop();  // Retiramos el primer elemento de la pila para ir hacia atrás
        const prevFirstVisible = pageStack[pageStack.length - 1];
        query = query.startAt(prevFirstVisible).limit(PAGE_SIZE);  // Establecemos el punto de inicio
    } else if (direccion === 'primera') {
        pageStack = [];  // Reiniciamos la pila cuando vamos a la primera página
    }

    // Ejecutamos la consulta y obtenemos los resultados
    const snapshot = await query.get();

    // Si hay resultados, actualizamos los valores de `firstVisible` y `lastVisible`
    if (!snapshot.empty) {
        firstVisible = snapshot.docs[0];
        lastVisible = snapshot.docs[snapshot.docs.length - 1];
        if (direccion === 'siguiente' || direccion === 'primera') {
            pageStack.push(firstVisible);  // Añadimos el primer documento visible a la pila
        }
    } else {
        // Si no hay más registros en la siguiente página
        if (direccion === 'siguiente') {
            alert('No hay más registros.');
        }
    }

    // Renderizamos la tabla con los nuevos datos
    const dataArray = snapshot.docs.map(doc => doc.data());
    await renderTabla(dataArray, 'tablaRegistros');

    // Actualizamos el estado de los botones de paginación
    actualizarBotonesPaginacion(snapshot.size);
}

// Función para ir a la página anterior
function anteriorPagina() {
    if (pageStack.length > 1) {
        cargarPaginaRegistros(new Date(), 'anterior');  // Llama a la función para cargar la página anterior
    }
}

// Función para ir a la página siguiente
function siguientePagina() {
    cargarPaginaRegistros(new Date(), 'siguiente');  // Llama a la función para cargar la siguiente página
}


// Función para actualizar los botones de paginación
function actualizarBotonesPaginacion(numItems) {
    const btnPrev = document.getElementById('btnPaginaAnterior');
    const btnNext = document.getElementById('btnPaginaSiguiente');

    // Habilitar o deshabilitar los botones de acuerdo a la lógica de la paginación
    btnPrev.disabled = pageStack.length <= 1;  // Deshabilitar el botón de "Anterior" si no hay más páginas anteriores
    btnNext.disabled = numItems < PAGE_SIZE;  // Deshabilitar el botón de "Siguiente" si no hay más registros
}


// Cargar la primera página de registros cuando se inicia la aplicación
window.addEventListener('load', () => {
    cargarPaginaRegistros(new Date(), 'primera'); // Llamar para cargar los primeros registros
});
