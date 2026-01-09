// firebase-config.js
// CONFIGURACIÓN DE FIREBASE - REEMPLAZA CON TUS DATOS

const firebaseConfig = {
    // ⚠️ ¡REEMPLAZA ESTOS VALORES CON TUS DATOS DE FIREBASE!
    apiKey: "AIzaSyByuoD3T8iCOWm0VX_qJGYitbwKENYW4Sc",
    authDomain: "menu-hunabku.firebaseapp.com",
    projectId: "menu-hunabku",
    storageBucket: "menu-hunabku.firebasestorage.app",
    messagingSenderId: "336407797386",
    appId: "1:336407797386:web:6e6570f0585dc38b451773"
};

// Inicializar Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase inicializado');
} catch (error) {
    console.error('❌ Error inicializando Firebase:', error);
}

// Obtener instancias
const db = firebase.firestore();
const auth = firebase.auth();