import { initializeApp } from "https://gstatic.com";
import { getFirestore } from "https://gstatic.com";

const firebaseConfig = {
    apiKey: "CONTOH_API_KEY_ANDA_MOHON_DIGANTI",
    authDomain: "://firebaseapp.com",
    projectId: "mavin-flower",
    storageBucket: "://appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:12345:web:12345"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
