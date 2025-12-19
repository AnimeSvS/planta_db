// form.js - VERSIÓN CORREGIDA

// Formulario de Registro (Ingresos)
document.getElementById('formRegistro').addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!this.checkValidity()) {
        this.classList.add('was-validated');
        return;
    }
    await agregarRegistro(this);
});

// Formulario de Edición
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
    bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
    cargarDatosInicial();
});


//  confirmación detallada

document.getElementById('formSalida')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('🔄 Formulario de salida enviado');

    // Verificar si la función existe
    if (typeof mostrarConfirmacionSalida !== 'function') {
        console.error('❌ mostrarConfirmacionSalida no está definida');
        alert('Error: Función de confirmación no disponible. Recarga la página.');
        return;
    }

    const form = e.target;
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    // Obtener valores
    const tinas = Number(document.getElementById('salidaJabas').value);
    const pollosPorTina = Number(document.getElementById('salidaPollosJaba').value);
    const kgPorTina = Number(document.getElementById('salidaPesoPorTina').value);
    const pesoBrutoManual = Number(document.getElementById('salidaPesoBruto').value);

    console.log('📊 Valores obtenidos:', { tinas, pollosPorTina, kgPorTina, pesoBrutoManual });

    // Validaciones
    if (tinas <= 0 || pollosPorTina <= 0 || kgPorTina <= 0 || pesoBrutoManual <= 0) {
        alert('Complete todos los campos con valores válidos');
        return;
    }

    // Obtener destino/tienda
    const destinoSelect = document.getElementById('salidaDestino');
    let tienda = '';

    if (destinoSelect.value === 'OTRO') {
        tienda = document.getElementById('otroDestino').value.trim();
        if (!tienda) {
            alert('Ingrese un destino válido');
            document.getElementById('otroDestino').focus();
            return;
        }
    } else {
        tienda = destinoSelect.value;
    }

    console.log('🏪 Tienda seleccionada:', tienda);
    console.log('📝 Llamando a mostrarConfirmacionSalida...');

    // 🔹 MOSTRAR CONFIRMACIÓN
    mostrarConfirmacionSalida(pesoBrutoManual, async () => {
        console.log('🚀 Confirmación aceptada, procediendo a registrar...');

        try {
            // Calcular valores
            const totalPollos = tinas * pollosPorTina;
            const totalTinas = kgPorTina * tinas;
            const pesoNeto = pesoBrutoManual - totalTinas;

            const datosSalida = {
                producto: 'POLLO BENEFICIADO',
                tienda: tienda,
                tinas: tinas,
                kgPorTina: kgPorTina,
                totalTinas: totalTinas,
                pollosPorTina: pollosPorTina,
                totalPollos: totalPollos,
                bruto: pesoBrutoManual,
                pesoNeto: pesoNeto,
                promedio: totalPollos > 0 ? (pesoNeto / totalPollos) : 0,
                fecha: firebase.firestore.Timestamp.fromDate(new Date())
            };

            console.log('📦 Datos de salida:', datosSalida);

            // Registrar salida
            await registrarSalida(datosSalida);
            console.log('✅ Salida registrada en Firestore');

            // 🔹 LIMPIAR FORMULARIO
            form.reset();
            document.getElementById('salidaJabas').value = '';
            document.getElementById('salidaPollosJaba').value = '';
            form.classList.remove('was-validated');
            document.getElementById('otroDestinoDiv').classList.add('d-none');

            // 🔹 ACTUALIZAR INTERFAZ
            if (typeof cargarSalidas === 'function') {
                await cargarSalidas();
                console.log('✅ Tabla de salidas actualizada');
            }

            if (typeof cargarDashboard === 'function') {
                await cargarDashboard();
                console.log('✅ Dashboard actualizado');
            }

            // Cerrar modales
            const modal = bootstrap.Modal.getInstance(document.getElementById('editSalidaModal'));
            if (modal) modal.hide();

        } catch (error) {
            console.error('❌ Error al registrar salida:', error);
            alert(`Error al registrar salida: ${error.message}`);
        }
    });
});
// /salida
document.getElementById('salidaDestino')?.addEventListener('change', function () {
    const otroDiv = document.getElementById('otroDestinoDiv');
    if (this.value === 'OTRO') {
        otroDiv.classList.remove('d-none');
    } else {
        otroDiv.classList.add('d-none');
        document.getElementById('otroDestino').value = '';
    }
});