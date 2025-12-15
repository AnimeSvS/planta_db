// Configuración Firebase - reemplaza con tus datos reales
const firebaseConfig = {
    apiKey: "AIzaSyAb0kC6vTC8Q0eBGrVhGZY9l7CWwbWnvXg",
    authDomain: "dbplanta-c2765.firebaseapp.com",
    projectId: "dbplanta-c2765",
    storageBucket: "dbplanta-c2765.firebasestorage.app",
    messagingSenderId: "850319453145",
    appId: "1:850319453145:web:9735a868c9f8b7a56d87c8"
};

firebase.initializeApp(firebaseConfig);
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// Esperar que el DOM esté listo para luego cargar los datos
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM listo, cargando datos...');
    cargarDatosInicial().then(() => console.log('Datos cargados'));
});
