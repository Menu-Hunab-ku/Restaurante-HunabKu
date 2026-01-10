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
let db, auth;

try {
    if (firebase.apps.length === 0) {
        firebase.initializeApp(firebaseConfig);
        console.log('✅ Firebase inicializado correctamente');
    } else {
        console.log('✅ Firebase ya estaba inicializado');
    }
    
    // Obtener instancias
    db = firebase.firestore();
    auth = firebase.auth();
    
    console.log('✅ Instancias de Firestore y Auth creadas');
} catch (error) {
    console.error('❌ ERROR CRÍTICO inicializando Firebase:', error);
    alert('ERROR: No se pudo inicializar Firebase. Por favor verifica la configuración.');
}