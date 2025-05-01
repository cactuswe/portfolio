import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyAMcwSuCiRb-aeVGZRGlRpkJA_pcGyugSU",
    authDomain: "messagebox-c4a1a.firebaseapp.com",
    databaseURL: "https://messagebox-c4a1a-default-rtdb.europe-west1.firebasedatabase.app/",
    projectId: "messagebox-c4a1a",
    storageBucket: "messagebox-c4a1a.firebasestorage.app",
    messagingSenderId: "2271180349",
    appId: "1:2271180349:web:9bbbf31a813b2149c29c54",
    measurementId: "G-ZWJZXJXGD3"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

export { database, auth };