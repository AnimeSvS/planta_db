async function renderTabla(dataArray, tbodyId) {
  const tbody = document.getElementById(tbodyId);
  tbody.innerHTML = '';

  dataArray.forEach(d => {
    const pesoJaba = d.pesoJaba || 0;

    // 🔢 CÁLCULOS (MISMO QUE INGRESOS)
    const { totalJ, cPollos, neto, prom } = calcular(
      d.cantidadJabas,
      d.pollosPorJaba,
      d.pesoBruto,
      pesoJaba
    );

    const fechaFormateada =
      tbodyId === 'tablaEliminados' && d.fechaEliminacion
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

        ${(tbodyId === 'tablaRegistros' || tbodyId === 'tablaSalidas') ? `
          <td>
            <button class="btn btn-warning btn-sm btnEditar" data-id="${d.id}">✏️</button>
          </td>
          <td>
            <button class="btn btn-danger btn-sm btnEliminar" data-id="${d.id}">🗑️</button>
          </td>
        ` : ''}

        ${tbodyId === 'tablaRegistros' ? `
    
        ` : ''}
      </tr>
    `;
  });

  // 🔗 EVENTOS
  if (tbodyId === 'tablaRegistros' || tbodyId === 'tablaSalidas') {
    tbody.querySelectorAll('.btnEditar')
      .forEach(b => b.addEventListener('click', abrirEditar));

    tbody.querySelectorAll('.btnEliminar')
      .forEach(b => b.addEventListener('click', eliminarRegistro));
  }

  if (tbodyId === 'tablaRegistros') {
    tbody.querySelectorAll('.btnSalida')
      .forEach(b => b.addEventListener('click', () => abrirSalida(b.dataset.id)));
  }
}

// table.js - MODIFICAR cargarSalidas para ser más confiable
async function cargarSalidas() {
  const tbody = document.getElementById('tablaSalidas');
  if (!tbody) {
    console.error('No se encontró tablaSalidas');
    return;
  }

  tbody.innerHTML = '<tr><td colspan="13" class="text-muted">Cargando...</td></tr>';

  try {
    const snap = await salidasRef.orderBy('fecha', 'desc').limit(50).get();

    if (snap.empty) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="13" class="text-muted">No hay salidas registradas</td>
                </tr>
            `;
      return;
    }

    tbody.innerHTML = '';

    snap.forEach(doc => {
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

    console.log('✅ Tabla de salidas actualizada');

    // 🔹 ASIGNAR EVENTOS A LOS BOTONES DE BUSQUEDA (si existen)
    asignarEventosBusquedaSalidas();

  } catch (error) {
    console.error('❌ Error al cargar salidas:', error);
    tbody.innerHTML = `
            <tr>
                <td colspan="13" class="text-danger">Error al cargar: ${error.message}</td>
            </tr>
        `;
  }
}

// Función para asignar eventos a los botones de búsqueda en salidas
function asignarEventosBusquedaSalidas() {
  const btnBuscar = document.getElementById('btnBuscarFechaSalidas');
  const btnLimpiar = document.getElementById('btnLimpiarBusquedaSalidas');
  // const btnImprimir = document.getElementById('btnImprimirSalidas');
  const btnExportar = document.getElementById('btnExportarExcelSalidas');

  if (btnBuscar) {
    btnBuscar.onclick = buscarSalidasPorFecha;
  }

  if (btnLimpiar) {
    btnLimpiar.onclick = limpiarBusquedaSalidas;
  }

  // if (btnImprimir) {
  //   btnImprimir.onclick = () => imprimirResumen('tablaSalidas');
  // }

  if (btnExportar) {
    btnExportar.onclick = exportarSalidasAXLS;
  }
}

// AGREGAR función para asignar eventos
function asignarEventosSalidas() {
  // Buscar
  document.getElementById('btnBuscarFechaSalidas')?.addEventListener('click', buscarSalidasPorFecha);

  // Limpiar
  document.getElementById('btnLimpiarBusquedaSalidas')?.addEventListener('click', limpiarBusquedaSalidas);

  // Imprimir
  // document.getElementById('btnImprimirSalidas')?.addEventListener('click', () => {
  //   imprimirResumen('tablaSalidas');
  // });

  // Exportar Excel
  document.getElementById('btnExportarExcelSalidas')?.addEventListener('click', exportarSalidasAXLS);
}
function agregarEventListenersSalidas() {
  // Botón Buscar
  document.getElementById('btnBuscarFechaSalidas')?.addEventListener('click', () => {
    const fecha = document.getElementById('buscarFechaSalidas').value;
    if (fecha) {
      buscarSalidasPorFecha(fecha);
    }
  });

  // Botón Limpiar
  document.getElementById('btnLimpiarBusquedaSalidas')?.addEventListener('click', () => {
    document.getElementById('buscarFechaSalidas').value = '';
    cargarSalidas();
  });

  // Botón Imprimir
  // document.getElementById('btnImprimirSalidas')?.addEventListener('click', () => {
  //   imprimirResumen('tablaSalidas');
  // });

  // Botón Exportar Excel
  document.getElementById('btnExportarExcelSalidas')?.addEventListener('click', () => {
    exportarSalidasAXLS();
  });
}

async function buscarSalidasPorFecha(fecha) {
  const inicio = getInicioDelDia(new Date(fecha));
  const fin = getFinDelDia(new Date(fecha));

  try {
    const snap = await salidasRef
      .where('fecha', '>=', firebase.firestore.Timestamp.fromDate(inicio))
      .where('fecha', '<', firebase.firestore.Timestamp.fromDate(fin))
      .orderBy('fecha', 'desc')
      .get();

    const tbody = document.getElementById('tablaSalidas');
    tbody.innerHTML = '';

    if (snap.empty) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="13" class="text-muted">No hay salidas en esta fecha</td>
                </tr>
            `;
      return;
    }

    snap.forEach(doc => {
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

  } catch (error) {
    console.error('Error al buscar salidas por fecha:', error);
    alert('Error al buscar salidas');
  }
}

// Hacer función disponible globalmente
window.cargarSalidas = cargarSalidas;

window.mostrarReporteTiendas = mostrarReporteTiendas;
window.renderTabla = renderTabla;