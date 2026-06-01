/* AUTH IMPORTS */

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    auth,
    db
} from "./firebase-config.js";


/* AUTH UI ELEMENTS */

const authSection = document.querySelector("#authSection");
const dashboardSection = document.querySelector("#dashboardSection");

const showLoginBtn = document.querySelector("#showLoginBtn");
const showRegisterBtn = document.querySelector("#showRegisterBtn");

const loginForm = document.querySelector("#loginForm");
const registerForm = document.querySelector("#registerForm");

const authMessage = document.querySelector("#authMessage");
const currentUserName = document.querySelector("#currentUserName");
const logoutBtn = document.querySelector("#logoutBtn");


/* SHOW AUTH MESSAGE */

function showAuthMessage(message) {
    authMessage.textContent = message;
}


/* SHOW LOGIN FORM */

function showLoginForm() {
    loginForm.classList.remove("d-none");
    registerForm.classList.add("d-none");

    showLoginBtn.classList.add("active");
    showRegisterBtn.classList.remove("active");

    showAuthMessage("");
}


/* SHOW REGISTER FORM */

function showRegisterForm() {
    registerForm.classList.remove("d-none");
    loginForm.classList.add("d-none");

    showRegisterBtn.classList.add("active");
    showLoginBtn.classList.remove("active");

    showAuthMessage("");
}


/* CREATE USER PROFILE */

async function createUserProfile(user, fullName) {
    const userRef = doc(db, "users", user.uid);

    await setDoc(userRef, {
        uid: user.uid,
        fullName: fullName,
        email: user.email,
        photoURL: "",
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
    });
}


/* UPDATE LAST LOGIN */

async function updateLastLogin(user) {
    const userRef = doc(db, "users", user.uid);

    await setDoc(userRef, {
        lastLoginAt: serverTimestamp()
    }, {
        merge: true
    });
}


/* GET USER PROFILE */

async function getUserProfile(userId) {
    const userRef = doc(db, "users", userId);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
        return null;
    }

    return userSnapshot.data();
}


/* REGISTER USER */

async function registerUser(event) {
    event.preventDefault();

    const fullName = document.querySelector("#registerName").value.trim();
    const email = document.querySelector("#registerEmail").value.trim();
    const password = document.querySelector("#registerPassword").value.trim();

    try {
        showAuthMessage("Creating your account...");

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        await createUserProfile(userCredential.user, fullName);

        registerForm.reset();

        showAuthMessage("Account created successfully.");
    } catch (error) {
        showAuthMessage(error.message);
    }
}


/* LOGIN USER */

async function loginUser(event) {
    event.preventDefault();

    const email = document.querySelector("#loginEmail").value.trim();
    const password = document.querySelector("#loginPassword").value.trim();

    try {
        showAuthMessage("Logging in...");

        await signInWithEmailAndPassword(auth, email, password);

        loginForm.reset();

        showAuthMessage("");
    } catch (error) {
        showAuthMessage(error.message);
    }
}


/* LOGOUT USER */

async function logoutUser() {
    await signOut(auth);
}


/* WATCH AUTH STATE */

function watchAuthState() {
    onAuthStateChanged(auth, async function (user) {
        if (user) {
            await updateLastLogin(user);

            const profile = await getUserProfile(user.uid);

            authSection.classList.add("d-none");
            dashboardSection.classList.remove("d-none");

            currentUserName.textContent = profile?.fullName || user.email;
        } else {
            dashboardSection.classList.add("d-none");
            authSection.classList.remove("d-none");

            currentUserName.textContent = "Guest";
        }
    });
}


/* SETUP AUTH EVENTS */

function setupAuthEvents() {
    showLoginBtn.addEventListener("click", showLoginForm);
    showRegisterBtn.addEventListener("click", showRegisterForm);

    loginForm.addEventListener("submit", loginUser);
    registerForm.addEventListener("submit", registerUser);

    logoutBtn.addEventListener("click", logoutUser);
}


export {
    setupAuthEvents,
    watchAuthState
};