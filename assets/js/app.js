/* APP IMPORTS */

import {
    auth
} from "./firebase-config.js";

import {
    setupAuthEvents,
    watchAuthState
} from "./auth.js";

import {
    setupProjectEvents,
    watchUserProjects,
    clearProjectUi
} from "./projects.js";

import {
    watchUserNotifications,
    clearNotifications
} from "./notifications.js";

import {
    watchAssignedTasks,
    clearAssignedTasks
} from "./tasks.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* WATCH APP DATA AFTER LOGIN */

function watchAppDataAfterLogin() {
    onAuthStateChanged(auth, function (user) {
        if (user) {
            watchUserProjects(user.uid);
            watchUserNotifications(user.uid);
            watchAssignedTasks(user.uid);
        } else {
            clearProjectUi();
            clearNotifications();
            clearAssignedTasks();
        }
    });
}


/* START APP */

function startApp() {
    setupAuthEvents();
    setupProjectEvents();
    watchAuthState();
    watchAppDataAfterLogin();
}


startApp();