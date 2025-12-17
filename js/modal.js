// modal.js

// Mostrar confirmación de peso bruto
function mostrarConfirmacionPesoBruto(pesoBruto, onConfirm) {
  const modalExistente = document.getElementById('confirmModal');
  if (modalExistente) {
    modalExistente.remove();
  }

  const modalHtml = `
    <div class="modal fade" id="confirmModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content p-4">
                <h5 class="modal-title mb-3">Confirmar Operación</h5>
                <p>El peso bruto ingresado es: <strong>${pesoBruto.toFixed(2)} KG</strong></p>
                <p>¿Está seguro de continuar?</p>
                <div class="text-end">
                    <button data-bs-dismiss="modal" class="btn btn-secondary me-2">Cancelar</button>
                    <button class="btn btn-primary" id="btnConfirmAdd">Confirmar</button>
                </div>
            </div>
        </div>
    </div>`;

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

// Mostrar confirmación de eliminación
function mostrarConfirmacionEliminacion(registro, onConfirm) {
  const modalExistente = document.getElementById('confirmEliminarModal');
  if (modalExistente) {
    modalExistente.remove();
  }

  const tipo = registro.tipo === 'SALIDA' ? 'Salida' : 'Ingreso';

  const modalHtml = `
    <div class="modal fade" id="confirmEliminarModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content p-4">
                <h5 class="modal-title mb-3 text-danger">Confirmar Eliminación</h5>
                <p>¿Está seguro de eliminar este ${tipo}?</p>
                <p><strong>Detalles:</strong></p>
                <ul>
                    <li>Pollos: ${registro.totalPollos || 0}</li>
                    <li>Peso Neto: ${(registro.pesoNeto || 0).toFixed(2)} KG</li>
                    <li>Fecha: ${formatearFecha(registro.fecha)}</li>
                </ul>
                <p class="text-danger"><strong>⚠️ Este cambio afectará el stock disponible</strong></p>
                <div class="text-end">
                    <button data-bs-dismiss="modal" class="btn btn-secondary me-2">Cancelar</button>
                    <button class="btn btn-danger" id="btnConfirmDelete">Eliminar</button>
                </div>
            </div>
        </div>
    </div>`;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  const modalEl = document.getElementById('confirmEliminarModal');
  const bs = new bootstrap.Modal(modalEl);
  bs.show();

  modalEl.querySelector('#btnConfirmDelete').addEventListener('click', () => {
    onConfirm();
    bs.hide();
  });

  modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());
}
// modal.js - ELIMINAR la función mostrarAlertaStock o modificar
function mostrarAlertaStock(producto, cantidad) {
  // Solo actualizar UI sin alerta
  console.log(`Stock bajo: ${producto} - ${cantidad} unidades`);
  // Opcional: Mostrar notificación discreta en la UI
  mostrarNotificacionDiscreta(`Stock de ${producto} bajo: ${cantidad} unidades`);
}

// salida
function mostrarConfirmacionSalida(pesoBruto, onConfirm) {
  const modalExistente = document.getElementById('confirmSalidaModal');
  if (modalExistente) {
    modalExistente.remove();
  }

  const modalHtml = `
    <div class="modal fade" id="confirmSalidaModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content p-4">
                <h5 class="modal-title mb-3">Confirmar Operación</h5>
                <p>El peso bruto ingresado es: <strong>${pesoBruto.toFixed(2)} KG</strong></p>
                <p>¿Está seguro de continuar?</p>
                <div class="text-end">
                    <button data-bs-dismiss="modal" class="btn btn-secondary me-2">Cancelar</button>
                    <button class="btn btn-primary" id="btnConfirmAddSalida">Confirmar</button>
                </div>
            </div>
        </div>
    </div>`;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  const modalEl = document.getElementById('confirmSalidaModal');
  const bs = new bootstrap.Modal(modalEl);
  bs.show();

  modalEl.querySelector('#btnConfirmAddSalida').addEventListener('click', () => {
    onConfirm();
    bs.hide();
  });

  modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());
}

// Hacer disponible globalmente
window.mostrarConfirmacionSalida = mostrarConfirmacionSalida;
console.log('✅ mostrarConfirmacionSalida disponible globalmente');
// modal.js - ACTUALIZAR para agregar más tipos de notificaciones

function mostrarNotificacionDiscreta(mensaje, tipo = 'info') {
  // Determinar clase CSS según el tipo
  let clase = '';
  let icono = '';

  switch (tipo) {
    case 'success':
      clase = 'alert-success';
      icono = '✅';
      break;
    case 'error':
      clase = 'alert-danger';
      icono = '❌';
      break;
    case 'warning':
      clase = 'alert-warning';
      icono = '⚠️';
      break;
    default:
      clase = 'alert-info';
      icono = 'ℹ️';
  }

  // Crear notificación
  const notificacion = document.createElement('div');
  notificacion.className = `stock-notification alert ${clase} alert-dismissible fade show position-fixed`;
  notificacion.style.cssText = 'top: 10px; right: 10px; z-index: 1050; max-width: 300px;';
  notificacion.innerHTML = `
        <div class="d-flex align-items-center">
            <span style="margin-right: 8px;">${icono}</span>
            <small style="flex-grow: 1;">${mensaje}</small>
            <button type="button" class="btn-close btn-sm" data-bs-dismiss="alert"></button>
        </div>
    `;

  document.body.appendChild(notificacion);

  // Auto-remover después de 5 segundos
  setTimeout(() => {
    if (notificacion.parentNode) {
      notificacion.remove();
    }
  }, 5000);
}

// Agregar alias para compatibilidad
function mostrarNotificacionExito(mensaje) {
  mostrarNotificacionDiscreta(mensaje, 'success');
}

function mostrarNotificacionError(mensaje) {
  mostrarNotificacionDiscreta(mensaje, 'error');
}

// Hacer disponibles globalmente
window.mostrarNotificacionDiscreta = mostrarNotificacionDiscreta;
window.mostrarNotificacionExito = mostrarNotificacionExito;
window.mostrarNotificacionError = mostrarNotificacionError;