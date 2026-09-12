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


/* FIELD-LEVEL VALIDATION HELPERS */

function getFieldErrorElement(inputEl) {
    let errorEl = inputEl.parentElement.querySelector(".field-error");

    if (!errorEl) {
        errorEl = document.createElement("span");
        errorEl.className = "field-error";
        inputEl.parentElement.appendChild(errorEl);
    }

    return errorEl;
}

function showFieldError(inputEl, message) {
    const errorEl = getFieldErrorElement(inputEl);
    errorEl.textContent = message;
    inputEl.classList.add("field-invalid");
}

function clearFieldError(inputEl) {
    const errorEl = inputEl.parentElement.querySelector(".field-error");

    if (errorEl) {
        errorEl.textContent = "";
    }

    inputEl.classList.remove("field-invalid");
}

function clearFormFieldErrors(formEl) {
    formEl.querySelectorAll(".field-error").forEach(function (errorEl) {
        errorEl.textContent = "";
    });

    formEl.querySelectorAll(".field-invalid").forEach(function (inputEl) {
        inputEl.classList.remove("field-invalid");
    });
}


/* VALIDATE LOGIN FORM */

function validateLoginForm(emailInput, passwordInput) {
    let isValid = true;

    if (!emailInput.value.trim()) {
        showFieldError(emailInput, "Email is required.");
        isValid = false;
    }

    if (!passwordInput.value.trim()) {
        showFieldError(passwordInput, "Password is required.");
        isValid = false;
    }

    return isValid;
}


/* VALIDATE REGISTER FORM */

function validateRegisterForm(nameInput, emailInput, passwordInput) {
    let isValid = true;

    if (!nameInput.value.trim()) {
        showFieldError(nameInput, "Full name is required.");
        isValid = false;
    }

    if (!emailInput.value.trim()) {
        showFieldError(emailInput, "Email is required.");
        isValid = false;
    }

    if (!passwordInput.value.trim()) {
        showFieldError(passwordInput, "Password is required.");
        isValid = false;
    } else if (passwordInput.value.trim().length < 6) {
        showFieldError(passwordInput, "Password must be at least 6 characters.");
        isValid = false;
    }

    return isValid;
}


/* SESSION EXPIRY HANDLING */

const SESSION_EXPIRED_ERROR_CODES = [
    "auth/user-token-expired",
    "auth/requires-recent-login"
];

function isSessionExpiredError(error) {
    return Boolean(error) && SESSION_EXPIRED_ERROR_CODES.includes(error.code);
}

async function handleSessionExpiry() {
    showAuthMessage("Your session has expired — please log in again.");

    try {
        await signOut(auth);
    } catch (signOutError) {
        // Ignore: the user is being redirected to login regardless.
    }
}

function handleAuthError(error) {
    if (isSessionExpiredError(error)) {
        handleSessionExpiry();
        return true;
    }

    return false;
}


/* SHOW LOGIN FORM */

function showLoginForm() {
    loginForm.classList.remove("d-none");
    registerForm.classList.add("d-none");

    showLoginBtn.classList.add("active");
    showRegisterBtn.classList.remove("active");

    showAuthMessage("");
    clearFormFieldErrors(loginForm);
}


/* SHOW REGISTER FORM */

function showRegisterForm() {
    registerForm.classList.remove("d-none");
    loginForm.classList.add("d-none");

    showRegisterBtn.classList.add("active");
    showLoginBtn.classList.remove("active");

    showAuthMessage("");
    clearFormFieldErrors(registerForm);
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

    const nameInput = document.querySelector("#registerName");
    const emailInput = document.querySelector("#registerEmail");
    const passwordInput = document.querySelector("#registerPassword");

    clearFormFieldErrors(registerForm);

    if (!validateRegisterForm(nameInput, emailInput, passwordInput)) {
        return;
    }

    const fullName = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    try {
        showAuthMessage("Creating your account...");

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        await createUserProfile(userCredential.user, fullName);

        registerForm.reset();

        showAuthMessage("Account created successfully.");
    } catch (error) {
        if (!handleAuthError(error)) {
            showAuthMessage(error.message);
        }
    }
}


/* LOGIN USER */

async function loginUser(event) {
    event.preventDefault();

    const emailInput = document.querySelector("#loginEmail");
    const passwordInput = document.querySelector("#loginPassword");

    clearFormFieldErrors(loginForm);

    if (!validateLoginForm(emailInput, passwordInput)) {
        return;
    }

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    try {
        showAuthMessage("Logging in...");

        await signInWithEmailAndPassword(auth, email, password);

        loginForm.reset();

        showAuthMessage("");
    } catch (error) {
        if (!handleAuthError(error)) {
            showAuthMessage(error.message);
        }
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
    watchAuthState,
    handleAuthError,
    isSessionExpiredError
};