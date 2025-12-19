// modal-salida.js - Manejo de modales para salidas

let currentSalidaEditId = null;

// Función para abrir modal de edición de salida
async function abrirEditarSalida(docId) {
    try {
        const docRef = salidasRef.doc(docId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            alert('Salida no encontrada');
            return;
        }

        const data = docSnap.data();
        currentSalidaEditId = docId;

        // Llenar formulario con datos existentes
        document.getElementById('editSalidaId').value = docId;
        document.getElementById('editSalidaFecha').value = formatearFecha(data.fecha);
        document.getElementById('editSalidaProducto').value = data.producto || 'POLLO BENEFICIADO';
        document.getElementById('editSalidaTinas').value = data.tinas || 1;
        document.getElementById('editSalidaPollosPorTina').value = data.pollosPorTina || 7;
        document.getElementById('editSalidaPesoTina').value = data.kgPorTina || 0;
        document.getElementById('editSalidaPesoBruto').value = data.bruto || 0;
        
        // Manejar destino/tienda
        const destinoSelect = document.getElementById('editSalidaDestino');
        const otroDestinoDiv = document.getElementById('editOtroDestinoDiv');
        const otroDestinoInput = document.getElementById('editOtroDestino');
        
        // Verificar si es una tienda de la lista o "OTRO"
        const tiendasLista = [
            'MARIANO MELGAR', 'PAUCARPATA', 'MIRAFLORES', 'SOCABAYA', 
            'CAYMA', 'ALTO SELVA ALEGRE', 'AVELINO (PRINCIPAL)', 'COLON'
        ];
        
        if (tiendasLista.includes(data.tienda)) {
            destinoSelect.value = data.tienda;
            otroDestinoDiv.classList.add('d-none');
        } else {
            destinoSelect.value = 'OTRO';
            otroDestinoDiv.classList.remove('d-none');
            otroDestinoInput.value = data.tienda || '';
        }

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('editSalidaModal'));
        modal.show();

    } catch (error) {
        console.error('Error al abrir edición de salida:', error);
        alert('Error al cargar los datos de la salida');
    }
}

// Función para confirmar eliminación de salida
function confirmarEliminarSalida(docId) {
    // Obtener datos de la salida
    salidasRef.doc(docId).get().then((docSnap) => {
        if (!docSnap.exists) {
            alert('Salida no encontrada');
            return;
        }

        const data = docSnap.data();
        
        // Llenar modal de confirmación
        document.getElementById('confirmSalidaId').textContent = docId;
        document.getElementById('confirmSalidaTienda').textContent = data.tienda || 'Sin tienda';
        document.getElementById('confirmSalidaPollos').textContent = data.totalPollos || 0;
        document.getElementById('confirmSalidaPeso').textContent = (data.pesoNeto || 0).toFixed(2);
        
        // Configurar botón de eliminar
        const btnEliminar = document.getElementById('btnConfirmEliminarSalida');
        btnEliminar.onclick = () => eliminarSalidaConfirmada(docId, data);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('confirmEliminarSalidaModal'));
        modal.show();
    }).catch(error => {
        console.error('Error al obtener datos de salida:', error);
        alert('Error al cargar los datos para eliminación');
    });
}

// Función para eliminar salida confirmada
async function eliminarSalidaConfirmada(docId, data) {
    try {
        // 1. Restaurar stock primero
        const stockRef = db.collection('stock').doc(data.producto);
        const stockSnap = await stockRef.get();
        
        if (stockSnap.exists) {
            const stock = stockSnap.data();
            await stockRef.update({
                cantidadPollos: firebase.firestore.FieldValue.increment(data.totalPollos || 0),
                pesoNeto: firebase.firestore.FieldValue.increment(data.pesoNeto || 0)
            });
        }

        // 2. Eliminar documento de salida
        await salidasRef.doc(docId).delete();
        
        // 3. Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('confirmEliminarSalidaModal'));
        modal.hide();
        
        // 4. Mostrar mensaje y recargar
        alert('✅ Salida eliminada exitosamente');
        
        // 5. Recargar datos
        if (typeof cargarSalidas === 'function') {
            await cargarSalidas();
        }
    
    } catch (error) {
        console.error('Error al eliminar salida:', error);
        alert('❌ Error al eliminar salida: ' + error.message);
    }
}

// Event listener para formulario de edición de salida
document.getElementById('formEditSalida')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!this.checkValidity()) {
        this.classList.add('was-validated');
        return;
    }

    try {
        // Obtener valores del formulario
        const tinas = Number(document.getElementById('editSalidaTinas').value);
        const pollosPorTina = Number(document.getElementById('editSalidaPollosPorTina').value);
        const kgPorTina = Number(document.getElementById('editSalidaPesoTina').value);
        const pesoBruto = Number(document.getElementById('editSalidaPesoBruto').value);
        
        // Calcular valores derivados
        const totalPollos = tinas * pollosPorTina;
        const pesoNeto = kgPorTina * tinas; // Fórmula: pesoNeto = kgPorTina × tinas
        
        // Obtener destino/tienda
        const destinoSelect = document.getElementById('editSalidaDestino');
        let tienda = '';
        
        if (destinoSelect.value === 'OTRO') {
            tienda = document.getElementById('editOtroDestino').value.trim();
            if (!tienda) {
                alert('Ingrese un destino válido');
                return;
            }
        } else {
            tienda = destinoSelect.value;
        }

        // Obtener datos actuales para calcular diferencia en stock
        const docRef = salidasRef.doc(currentSalidaEditId);
        const docSnap = await docRef.get();
        const oldData = docSnap.data();
        
        // Actualizar documento
        await docRef.update({
            tinas: tinas,
            pollosPorTina: pollosPorTina,
            kgPorTina: kgPorTina,
            bruto: pesoBruto,
            pesoNeto: pesoNeto,
            totalPollos: totalPollos,
            tienda: tienda,
            promedio: totalPollos > 0 ? (pesoNeto / totalPollos) : 0,
            fechaActualizacion: firebase.firestore.Timestamp.fromDate(new Date())
        });

        // Actualizar stock con la diferencia
        const stockRef = db.collection('stock').doc('POLLO BENEFICIADO');
        const stockSnap = await stockRef.get();
        
        if (stockSnap.exists) {
            const stock = stockSnap.data();
            // Restaurar stock antiguo y restar nuevo
            const diffPollos = (oldData.totalPollos || 0) - totalPollos;
            const diffPeso = (oldData.pesoNeto || 0) - pesoNeto;
            
            await stockRef.update({
                cantidadPollos: firebase.firestore.FieldValue.increment(diffPollos),
                pesoNeto: firebase.firestore.FieldValue.increment(diffPeso)
            });
        }

        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editSalidaModal'));
        modal.hide();
        
 
        // Recargar datos
        if (typeof cargarSalidas === 'function') {
            await cargarSalidas();
        }

    } catch (error) {
        console.error('Error al actualizar salida:', error);
        alert('❌ Error al actualizar salida: ' + error.message);
    }
});

// Event listener para mostrar/ocultar campo "OTRO DESTINO" en edición
document.getElementById('editSalidaDestino')?.addEventListener('change', function() {
    const otroDiv = document.getElementById('editOtroDestinoDiv');
    if (this.value === 'OTRO') {
        otroDiv.classList.remove('d-none');
    } else {
        otroDiv.classList.add('d-none');
        document.getElementById('editOtroDestino').value = '';
    }
});

// Hacer funciones disponibles globalmente
window.abrirEditarSalida = abrirEditarSalida;
window.confirmarEliminarSalida = confirmarEliminarSalida;