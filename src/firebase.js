import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your actual Firebase project configuration
// You can get this from the Firebase Console -> Project Settings -> General -> Your apps
const firebaseConfig = {
    apiKey: "AIzaSyDXMh4Lj2O75JWTIQ3ra1WNoWMMHKzuq-A",
    authDomain: "fhmc-32912.firebaseapp.com",
    projectId: "fhmc-32912",
    storageBucket: "fhmc-32912.firebasestorage.app",
    messagingSenderId: "824807369559",
    appId: "1:824807369559:web:861391ce42a584f3222c12",
    measurementId: "G-SRXR36WEK3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
