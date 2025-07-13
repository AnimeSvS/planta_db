const PESO_JABA = 6.73;
let currentEditId = null;
const registrosRef = db.collection('registros');
const eliminadosRef = db.collection('eliminados');

// Utilitarios
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

// Obtener timestamp para inicio y fin de día (sin hora)
function getInicioDelDia(fecha) {
  // fecha: Date object con día a filtrar
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}
function getFinDelDia(fecha) {
  const inicio = getInicioDelDia(fecha);
  return new Date(inicio.getTime() + 24 * 60 * 60 * 1000); // +1 día
}

function calcular(cj, pj, pb) {
  const totalJ = PESO_JABA * cj;
  const cPollos = cj * pj;
  const neto = pb - totalJ;
  const prom = neto / cPollos;
  return { totalJ, cPollos, neto, prom };
}

function formatearID(num) {
  return 'PLEP' + String(num).padStart(5, '0');
}

async function renderTabla(dataArray, tbodyId) {
  const tbody = document.getElementById(tbodyId);
  tbody.innerHTML = '';
  dataArray.forEach(d => {
    const { totalJ, cPollos, neto, prom } = calcular(d.cantidadJabas, d.pollosPorJaba, d.pesoBruto);
    const fechaFormateada = formatearFecha(d.fecha);
    tbody.innerHTML += `
      <tr>
        <td>${d.id}</td><td>${fechaFormateada}</td><td>${d.producto}</td>
        <td>${d.cantidadJabas}</td><td>${PESO_JABA.toFixed(2)} KG</td><td>${totalJ.toFixed(2)} KG</td>
        <td>${d.pollosPorJaba}</td><td>${cPollos}</td><td>${d.pesoBruto.toFixed(2)} KG</td>
        <td>${neto.toFixed(2)} KG</td><td>${prom.toFixed(3)} KG</td>
        ${tbodyId === 'tablaRegistros' ?
        `<td><button class="btn btn-warning btn-sm btnEditar" data-id="${d.id}">✏️</button></td>
           <td><button class="btn btn-danger btn-sm btnEliminar" data-id="${d.id}">🗑️</button></td>` : ''}
      </tr>`;
  });

  if (tbodyId === 'tablaRegistros') {
    tbody.querySelectorAll('.btnEditar').forEach(b => b.addEventListener('click', abrirEditar));
    tbody.querySelectorAll('.btnEliminar').forEach(b => b.addEventListener('click', eliminarRegistro));
  }
}

// Cargar datos usando rango de fechas
async function cargarDatosPorDia(fecha, coleccion, tbodyId) {
  const collectionRef = coleccion === 'registros' ? registrosRef : eliminadosRef;

  const inicioDia = getInicioDelDia(fecha);
  const finDia = getFinDelDia(fecha);

  const snapshot = await collectionRef
    .where('fecha', '>=', firebase.firestore.Timestamp.fromDate(inicioDia))
    .where('fecha', '<', firebase.firestore.Timestamp.fromDate(finDia))
    .get();

  const dataArray = snapshot.docs.map(doc => doc.data());

  // if (dataArray.length === 0) {
  // alert(`No se encontraron datos en la fecha ${fecha.toLocaleDateString()}`);
  // }

  await renderTabla(dataArray, tbodyId);
}

// Convierte valor de input type=date ("yyyy-mm-dd") a Date objeto inicio día
function fechaInputADate(fechaInput) {
  if (!fechaInput) return null;
  const partes = fechaInput.split('-'); // [yyyy, mm, dd]
  if (partes.length !== 3) return null;
  return new Date(partes[0], partes[1] - 1, partes[2]);
}

// Carga inicial solo muestra datos del día actual
async function cargarDatosInicial() {
  const hoy = new Date();
  await cargarDatosPorDia(hoy, 'registros', 'tablaRegistros');
  await cargarDatosPorDia(hoy, 'eliminados', 'tablaEliminados');
}

// Editar y eliminar
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

async function eliminarRegistro(e) {
  if (!confirm('¿Eliminar?')) return;
  const id = e.target.dataset.id;
  const snap = await registrosRef.where('id', '==', id).get();
  if (snap.empty) {
    alert('Registro no encontrado');
    return;
  }
  const d = snap.docs[0].data();
  await eliminadosRef.add({ ...d, fechaEliminacion: firebase.firestore.Timestamp.fromDate(new Date()) });
  await registrosRef.doc(snap.docs[0].id).delete();
  cargarDatosInicial();
}

// Exportar a Excel
function exportarTabla(idWrapper, nombreArchivo) {
  const table = document.getElementById(idWrapper);
  const wb = XLSX.utils.table_to_book(table, { sheet: "Sheet1" });
  XLSX.writeFile(wb, nombreArchivo);
}




// Formato fecha para guardar Timestamp actual
function ahoraTimestamp() {
  return firebase.firestore.Timestamp.fromDate(new Date());
}

// Listeners registro y edición
document.getElementById('formRegistro').addEventListener('submit', async function (e) {
  e.preventDefault();
  if (!this.checkValidity()) {
    this.classList.add('was-validated');
    return;
  }
  const cantidad = Number(document.getElementById('cantidadJabas').value);
  const pollosJaba = Number(document.getElementById('pollosPorJaba').value);
  const pesoBr = Number(document.getElementById('pesoBruto').value);

  mostrarConfirmacionPesoBruto(pesoBr, async () => {
    const last = await registrosRef.orderBy('id', 'desc').limit(1).get();
    const nextIdNum = last.empty ? 10001 : Number(last.docs[0].data().id.slice(4)) + 1;
    const nextId = formatearID(nextIdNum);
    const obj = {
      id: nextId,
      fecha: ahoraTimestamp(),  // <-- Guardar como Timestamp
      producto: 'POLLO VIVO',
      cantidadJabas: cantidad,
      pollosPorJaba: pollosJaba,
      pesoBruto: pesoBr
    };
    await registrosRef.add(obj);
    this.classList.remove('was-validated');
    this.reset();
    cargarDatosInicial();
  });
});

document.getElementById('formEdit').addEventListener('submit', async function (e) {
  e.preventDefault();
  if (!this.checkValidity()) {
    this.classList.add('was-validated');
    return;
  }
  const cantidad = Number(document.getElementById('editCantidadJabas').value);
  const pollosJaba = Number(document.getElementById('editPollosPorJaba').value);
  const pesoBr = Number(document.getElementById('editPesoBruto').value);
  const snap = await registrosRef.where('id', '==', currentEditId).get();
  if (snap.empty) {
    alert('Registro no encontrado');
    return;
  }
  const docId = snap.docs[0].id;
  await registrosRef.doc(docId).update({ cantidadJabas: cantidad, pollosPorJaba: pollosJaba, pesoBruto: pesoBr });
  this.classList.remove('was-validated');
  bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
  cargarDatosInicial();
});

// Botones Buscar y Limpiar filtro fecha
document.getElementById('btnBuscarFecha').addEventListener('click', () => {
  const fechaStr = document.getElementById('buscarFecha').value;
  if (!fechaStr) {
    alert('Seleccione una fecha para buscar');
    return;
  }
  const fecha = fechaInputADate(fechaStr);
  cargarDatosPorDia(fecha, 'registros', 'tablaRegistros');
  cargarDatosPorDia(fecha, 'eliminados', 'tablaEliminados');
});

document.getElementById('btnLimpiarBusqueda').addEventListener('click', () => {
  document.getElementById('buscarFecha').value = '';
  cargarDatosInicial();
});

/// Confirmación modal
function mostrarConfirmacionPesoBruto(pesoBruto, onConfirm) {
  const modalHtml = `
  <div class="modal fade" id="confirmModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered"><div class="modal-content p-4">
      <h5 class="modal-title mb-3">Confirmar Peso Bruto</h5>
      <p>El peso bruto ingresado es: <strong>${pesoBruto.toFixed(2)} KG</strong></p>
      <p>¿Está seguro de agregar este peso bruto?</p>
      <div class="text-end">
        <button data-bs-dismiss="modal" class="btn btn-secondary me-2">Cancelar</button>
        <button class="btn btn-primary" id="btnConfirmAdd">Confirmar</button>
      </div>
    </div></div></div>`;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  const modalEl = document.getElementById('confirmModal');
  const bs = new bootstrap.Modal(modalEl);
  bs.show();
  modalEl.querySelector('#btnConfirmAdd').addEventListener('click', () => { onConfirm(); bs.hide(); });
  modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());
}

//imprimir
function imprimirResumen(tbodyId) {
  const tabla = document.getElementById(tbodyId);
  if (!tabla) {
    alert('Tabla no encontrada para imprimir.');
    return;
  }

  // Detección de Opera Mini
  const esOperaMini = navigator.userAgent.includes('Opera Mini');

  const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];
  const hoy = new Date();
  const fechaStr = `${String(hoy.getDate()).padStart(2, '0')}/${meses[hoy.getMonth()]}/${hoy.getFullYear()}`;

  const filas = tabla.querySelectorAll('tr');
  let contenido = '';
  filas.forEach(fila => {
    const celdas = fila.querySelectorAll('td');
    if (celdas.length > 8) {
      const id = celdas[0].textContent.trim();
      const pesoBruto = celdas[8].textContent.trim();
      contenido += `${id}\t${pesoBruto}\n`;
    }
  });

  const textoImprimir = `
---------------------------------------
FECHA\t : \t${fechaStr}
---------------------------------------
ID\tP. BRUTO (KG)
---------------------------------------
${contenido}---------------------------------------
ENCARGADA:\tSr. Juana C.C
---------------------------------------
  `;

  if (esOperaMini) {
    // Si es Opera Mini, redirigir a una página imprimible
    const resumenURL = `data:text/plain;charset=utf-8,${encodeURIComponent(textoImprimir)}`;
    window.location.href = resumenURL;
    return;
  }

  // Si NO es Opera Mini, usar impresión normal
  const ventanaImpresion = window.open('', '_blank', 'width=600,height=600');
  if (!ventanaImpresion) {
    alert("No se pudo abrir la ventana de impresión. Puede estar bloqueada por el navegador.");
    return;
  }

  ventanaImpresion.document.write(`
    <html>
      <head>
        <title>Imprimir Resumen</title>
        <style>
          body {
            font-family: monospace;
            white-space: pre;
            padding: 20px;
            font-size: 14px;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
          }
          pre {
            text-align: center;
          }
        </style>
      </head>
      <body>
        <pre>${textoImprimir}</pre>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              // No se cierra automáticamente para evitar bloqueos
            }, 300);
          }
        </script>
      </body>
    </html>
  `);
  ventanaImpresion.document.close();
}


document.getElementById('btnImprimir').addEventListener('click', () => {
  imprimirResumen('tablaRegistros');
});

// Carga inicial al abrir la página


