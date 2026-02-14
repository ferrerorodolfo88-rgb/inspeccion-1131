// ========================================
// CONFIGURACIÓN DE FIREBASE
// ========================================
// 
// INSTRUCCIONES PARA CONFIGURAR:
// 
// 1. Ve a https://console.firebase.google.com/
// 2. Crea un nuevo proyecto o selecciona uno existente
// 3. En la configuración del proyecto, registra una nueva aplicación web
// 4. Copia las credenciales y reemplaza los valores abajo
// 5. Habilita los siguientes servicios en Firebase:
//    - Authentication (Email/Password)
//    - Cloud Firestore Database
//    - Hosting (opcional)
//
// REGLAS DE FIRESTORE RECOMENDADAS:
// 
// rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {
//     match /registros/{document=**} {
//       allow read, write: if request.auth != null;
//     }
//     match /usuarios/{userId} {
//       allow read, write: if request.auth != null && request.auth.uid == userId;
//     }
//   }
// }
//
// ========================================

const firebaseConfig = {
    apiKey: "TU_API_KEY_AQUI",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto-id",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referencias a los servicios
const auth = firebase.auth();
const db = firebase.firestore();

// Configurar persistencia
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

// Configurar sincronización offline de Firestore
db.enablePersistence()
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn('⚠️ Persistencia no disponible (múltiples pestañas)');
        } else if (err.code == 'unimplemented') {
            console.warn('⚠️ Persistencia no soportada en este navegador');
        }
    });

console.log('✅ Firebase inicializado correctamente');
