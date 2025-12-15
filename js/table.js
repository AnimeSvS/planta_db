async function renderTabla(dataArray, tbodyId) {
    const tbody = document.getElementById(tbodyId);
    tbody.innerHTML = '';

    dataArray.forEach(d => {
        // Usamos el valor de pesoJaba del registro (en lugar de la constante PESO_JABA)
        const pesoJaba = d.pesoJaba || 0;  // Asegurándonos de que siempre haya un valor (por defecto 0 si no existe)

        // Luego, pasamos el valor de pesoJaba a la función calcular
        const { totalJ, cPollos, neto, prom } = calcular(d.cantidadJabas, d.pollosPorJaba, d.pesoBruto, pesoJaba);

        const fechaFormateada = tbodyId === 'tablaEliminados' && d.fechaEliminacion
            ? formatearFecha(d.fechaEliminacion)
            : formatearFecha(d.fecha);

        tbody.innerHTML += `
      <tr>
        <td>${d.id}</td>
        <td>${fechaFormateada}</td>
        <td>${d.producto}</td>
        <td>${d.cantidadJabas}</td>
        <td>${pesoJaba.toFixed(2)} KG</td>
        <td>${totalJ.toFixed(2)} KG</td>
        <td>${d.pollosPorJaba}</td>
        <td>${cPollos}</td>
        <td>${d.pesoBruto.toFixed(2)} KG</td>
        <td>${neto.toFixed(2)} KG</td>
        <td>${prom.toFixed(3)} KG</td>
        ${tbodyId === 'tablaRegistros' ?
                `<td><button class="btn btn-warning btn-sm btnEditar" data-id="${d.id}">✏️</button></td>
             <td><button class="btn btn-danger btn-sm btnEliminar" data-id="${d.id}">🗑️</button></td>
             <td><button class="btn btn-primary btn-sm btnSalida" data-id="${d.id}">🏪 Salida</button></td>
             ` : ''}
      </tr>`;
    });

    if (tbodyId === 'tablaRegistros') {
        tbody.querySelectorAll('.btnEditar').forEach(b => b.addEventListener('click', abrirEditar));
        tbody.querySelectorAll('.btnEliminar').forEach(b => b.addEventListener('click', eliminarRegistro));
    }
}
tbody.querySelectorAll('.btnSalida').forEach(b =>
    b.addEventListener('click', () => abrirSalida(b.dataset.id))
);

// ------------------reporte tiendas
async function mostrarReporteTiendas(fecha, tiendaFiltro = '') {
    const data = await obtenerReportePorTienda(fecha);
    const tbody = document.getElementById('tablaReporteTiendas');
    tbody.innerHTML = '';

    Object.keys(data).forEach(tienda => {
        if (tiendaFiltro && tienda !== tiendaFiltro) return;

        tbody.innerHTML += `
      <tr>
        <td>${tienda}</td>
        <td>${data[tienda].pollos}</td>
        <td>${data[tienda].peso.toFixed(2)}</td>
      </tr>
    `;
    });
}
