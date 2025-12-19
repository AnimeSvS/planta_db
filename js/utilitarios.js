// utilitarios.js - VERSIÓN CORREGIDA (eliminar duplicados)

function fechaInputADate(fechaInput) {
    if (!fechaInput) return null;
    const partes = fechaInput.split('-'); // [yyyy, mm, dd]
    if (partes.length !== 3) return null;
    return new Date(partes[0], partes[1] - 1, partes[2]);
}


// -----------------------
function getInicioDelDia(fecha) {
    const inicio = new Date(fecha);
    inicio.setHours(0, 0, 0, 0);
    return inicio;
}

function getFinDelDia(fecha) {
    const fin = new Date(fecha);
    fin.setHours(23, 59, 59, 999);
    return fin;
}

function mostrarNotificacion(mensaje, tipo = 'info') {
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
    alerta.style.cssText = 'top: 20px; right: 20px; z-index: 9999;';
    alerta.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(alerta);

    setTimeout(() => {
        if (alerta.parentNode) {
            alerta.remove();
        }
    }, 3000);
}
// ---------------------

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
// En utilitarios.js, asegurar todas las funciones necesarias
function formatearFecha(timestamp) {
    if (!timestamp || !timestamp.toDate) return 'Fecha inválida';
    return timestamp.toDate().toLocaleString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}
// Reemplazar alerts por un sistema centralizado
function mostrarAlerta(mensaje, tipo = 'error') {
    const tipos = {
        success: { clase: 'alert-success', icono: '✅' },
        error: { clase: 'alert-danger', icono: '❌' },
        warning: { clase: 'alert-warning', icono: '⚠️' },
        info: { clase: 'alert-info', icono: 'ℹ️' }
    };

    const config = tipos[tipo] || tipos.error;
    mostrarNotificacionDiscreta(mensaje, tipo);
}

// Hacer funciones disponibles globalmente
window.fechaInputADate = fechaInputADate;
window.getInicioDelDia = getInicioDelDia;
window.getFinDelDia = getFinDelDia;
window.calcular = calcular;
window.formatearID = formatearID;
window.ahoraTimestamp = ahoraTimestamp;