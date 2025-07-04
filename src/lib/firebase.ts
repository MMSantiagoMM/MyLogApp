
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// =================================================================================
// ¡ERROR CRÍTICO! DEBES CONFIGURAR FIREBASE AQUÍ PARA QUE EL LOGIN FUNCIONE.
// =================================================================================
// Para solucionar el error "auth/api-key-not-valid", reemplaza el objeto
// `firebaseConfig` de abajo con el de tu propio proyecto de Firebase.
//
// CÓMO OBTENER TU CONFIGURACIÓN:
// 1. Ve a la Consola de Firebase -> Configuración del proyecto (icono de engranaje).
// 2. En la pestaña "General", baja hasta la sección "Tus apps".
// 3. Busca tu app web y haz clic en "Configuración y SDK".
// 4. Selecciona la opción "Config".
// 5. Copia el objeto `firebaseConfig` completo y pégalo aquí, reemplazando
//    el que está de ejemplo.
//
// Después de pegar tu configuración, GUARDA el archivo. El servidor de
// desarrollo se recargará automáticamente y el error desaparecerá.
// =================================================================================
const firebaseConfig = {
  apiKey: "Pega tu apiKey aquí",
  authDomain: "Pega tu authDomain aquí",
  projectId: "Pega tu projectId aquí",
  storageBucket: "Pega tu storageBucket aquí",
  messagingSenderId: "Pega tu messagingSenderId aquí",
  appId: "Pega tu appId aquí",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
