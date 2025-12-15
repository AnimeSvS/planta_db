// utilitarios.js

function formatearFecha(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const aa = String(date.getFullYear()).slice(2);
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${aa} ${hh}:${min}`;
}

function getInicioDelDia(fecha) {
    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

function getFinDelDia(fecha) {
    const inicio = getInicioDelDia(fecha);
    return new Date(inicio.getTime() + 24 * 60 * 60 * 1000); // +1 día
}

function calcular(cj, pj, pb, pesoJaba) {
    const totalJ = pesoJaba * cj;  // Total Jabas
    const cPollos = cj * pj;      // Cantidad de Pollos
    const neto = pb - totalJ;     // Peso Neto
    const prom = neto / cPollos;  // Promedio por Pollo
    return { totalJ, cPollos, neto, prom };
}


function formatearID(num) {
    return 'PLEP' + String(num).padStart(5, '0');
}

function fechaInputADate(fechaInput) {
    if (!fechaInput) return null;
    const partes = fechaInput.split('-'); // [yyyy, mm, dd]
    if (partes.length !== 3) return null;
    return new Date(partes[0], partes[1] - 1, partes[2]);
}

function ahoraTimestamp() {
    return firebase.firestore.Timestamp.fromDate(new Date());
}
