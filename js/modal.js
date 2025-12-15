// modal.js

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

    modalEl.querySelector('#btnConfirmAdd').addEventListener('click', () => {
        onConfirm();
        bs.hide();
    });

    modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());
}
function abrirSalida(idRegistro) {
  const html = `
  <div class="modal fade" id="modalSalida">
    <div class="modal-dialog">
      <div class="modal-content p-3">
        <h5>Salida de Producto</h5>

        <select id="tienda" class="form-select mb-2">
          <option>Tienda A</option>
          <option>Tienda B</option>
          <option>Tienda C</option>
        </select>

        <input type="number" id="pollosSalida" class="form-control mb-2" placeholder="Cantidad de pollos">
        <input type="number" id="pesoSalida" class="form-control mb-2" placeholder="Peso neto">

        <button class="btn btn-success" id="confirmarSalida">Confirmar</button>
      </div>
    </div>
  </div>
  `;

  document.body.insertAdjacentHTML('beforeend', html);
  const modal = new bootstrap.Modal(document.getElementById('modalSalida'));
  modal.show();

  document.getElementById('confirmarSalida').onclick = async () => {
    const tienda = document.getElementById('tienda').value;
    const cantidadPollos = Number(document.getElementById('pollosSalida').value);
    const pesoNeto = Number(document.getElementById('pesoSalida').value);

    await registrarSalida({
      producto: 'POLLO VIVO',
      tienda,
      cantidadPollos,
      pesoNeto
    });

    modal.hide();
  };
}

// salidaaa
function mostrarAlertaStock(producto, cantidad) {
  const html = `
  <div class="alert alert-danger alert-dismissible fade show" role="alert">
    ⚠️ <strong>Stock Bajo:</strong> ${producto} (${cantidad} pollos)
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  </div>
  `;
  document.getElementById('alertas').innerHTML += html;
}
