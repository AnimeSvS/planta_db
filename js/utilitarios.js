// utilitarios.js - VERSIÓN CORREGIDA (eliminar duplicados)

function fechaInputADate(fechaInput) {
    if (!fechaInput) return null;
    const partes = fechaInput.split('-'); // [yyyy, mm, dd]
    if (partes.length !== 3) return null;
    return new Date(partes[0], partes[1] - 1, partes[2]);
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
    return 'PLIP' + String(num).padStart(5, '0');
}

function ahoraTimestamp() {
    return firebase.firestore.Timestamp.fromDate(new Date());
}

// Hacer funciones disponibles globalmente
window.fechaInputADate = fechaInputADate;
window.getInicioDelDia = getInicioDelDia;
window.getFinDelDia = getFinDelDia;
window.calcular = calcular;
window.formatearID = formatearID;
window.ahoraTimestamp = ahoraTimestamp;