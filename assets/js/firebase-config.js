// Firebase App Imports

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// Firebase Configuration

const firebaseConfig = {
    apiKey: "AIzaSyBTLqVrYbWM6FDmZ6PhuquX7PFXisOjisA",
    authDomain: "fir-project-suite.firebaseapp.com",
    projectId: "fir-project-suite",
    storageBucket: "fir-project-suite.firebasestorage.app",
    messagingSenderId: "172440134321",
    appId: "1:172440134321:web:07c5b225858490bbaaf890",
    measurementId: "G-JBYHCVXL7T"
};


// Initialize Firebase

const app = initializeApp(firebaseConfig);


// Firebase Services

const auth = getAuth(app);

const db = getFirestore(app);


// Exports

export {
    app,
    auth,
    db
};