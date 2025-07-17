// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyABTaFebI2w_5Xgh3blNulKNRVJOD_TpX4",
  authDomain: "taca-da-pinga.firebaseapp.com",
  projectId: "taca-da-pinga",
  storageBucket: "taca-da-pinga.firebasestorage.app",
  messagingSenderId: "411216916757",
  appId: "1:411216916757:web:fd6cc75b01fb04e909391c"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);