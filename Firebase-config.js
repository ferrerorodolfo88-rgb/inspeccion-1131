// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBXTwdul_msrgYorSl3yWVbBr3f_voUWic",
  authDomain: "inspeccion-1131.firebaseapp.com",
  projectId: "inspeccion-1131",
  storageBucket: "inspeccion-1131.firebasestorage.app",
  messagingSenderId: "955202764155",
  appId: "1:955202764155:web:ead08416e8eed4e346d1de",
  measurementId: "G-47SL0T176Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

