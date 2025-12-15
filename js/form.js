// form.js

document.getElementById('formRegistro').addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!this.checkValidity()) {
        this.classList.add('was-validated');
        return;
    }
    await agregarRegistro(this);
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
    bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
    cargarDatosInicial();
});
