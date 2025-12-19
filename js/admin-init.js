// js/admin-init.js - EJECUTAR UNA SOLA VEZ DESDE CONSOLA

async function crearAdminInicial() {
    if (!confirm('¿Crear usuario administrador inicial?')) return;

    const email = prompt('Email del administrador:', 'admin@avicruz.com');
    const password = prompt('Contraseña (mínimo 6 caracteres):', 'Admin123!');

    if (!email || !password) {
        alert('Se requieren email y contraseña');
        return;
    }

    try {
        // Crear usuario en Firebase Auth
        const credencial = await auth.createUserWithEmailAndPassword(email, password);

        // Crear documento en Firestore con permisos completos
        const permisosCompletos = {};
        const tabs = ['registros', 'salidas', 'reporteTiendas', 'eliminados', 'tiendas', 'inventario'];

        tabs.forEach(tab => {
            permisosCompletos[tab] = { ver: true, editar: true };
        });

        await db.collection('usuarios').doc(credencial.user.uid).set({
            email: email,
            nombre: 'Administrador',
            rol: 'admin',
            activo: true,
            fechaRegistro: firebase.firestore.FieldValue.serverTimestamp(),
            permisos: permisosCompletos
        });

        alert(`✅ Administrador creado:\nEmail: ${email}\nContraseña: ${password}`);

    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error: ' + error.message);
    }
}

// Hacer disponible desde consola
window.crearAdminInicial = crearAdminInicial;
console.log('🛠️ Script de creación de admin disponible');