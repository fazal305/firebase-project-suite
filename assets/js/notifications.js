/* NOTIFICATION IMPORTS */

import {
    collection,
    doc,
    updateDoc,
    query,
    where,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    db
} from "./firebase-config.js";


/* NOTIFICATION LISTENER */

let unsubscribeNotifications = null;


/* MARK NOTIFICATION READ */

async function markNotificationRead(notificationId) {
    await updateDoc(doc(db, "notifications", notificationId), {
        isRead: true
    });
}


/* RENDER NOTIFICATIONS */

function renderNotifications(notifications) {
    const notificationList = document.querySelector("#notificationList");

    if (!notificationList) {
        return;
    }

    if (notifications.length === 0) {
        notificationList.innerHTML = `<p class="empty-text">No notifications yet.</p>`;
        return;
    }

    notificationList.innerHTML = notifications.map(function (notification) {
        return `
            <div class="notification-item ${notification.isRead ? "read-notification" : "unread-notification"}">
                <span>${notification.title}</span>
                <p>${notification.message}</p>

                ${notification.isRead ? "" : `
                    <button class="ghost-btn mark-read-btn" data-notification-id="${notification.id}">
                        Mark read
                    </button>
                `}
            </div>
        `;
    }).join("");

    setupNotificationEvents();
}


/* SETUP NOTIFICATION EVENTS */

function setupNotificationEvents() {
    const markReadButtons = document.querySelectorAll(".mark-read-btn");

    markReadButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            markNotificationRead(button.dataset.notificationId);
        });
    });
}


/* WATCH USER NOTIFICATIONS */

function watchUserNotifications(userId) {
    if (unsubscribeNotifications) {
        unsubscribeNotifications();
    }

    const notificationsQuery = query(
        collection(db, "notifications"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
    );

    unsubscribeNotifications = onSnapshot(notificationsQuery, function (snapshot) {
        const notifications = [];

        snapshot.forEach(function (docSnapshot) {
            notifications.push({
                id: docSnapshot.id,
                ...docSnapshot.data()
            });
        });

        renderNotifications(notifications);
    });
}


/* CLEAR NOTIFICATIONS */

function clearNotifications() {
    if (unsubscribeNotifications) {
        unsubscribeNotifications();
        unsubscribeNotifications = null;
    }

    const notificationList = document.querySelector("#notificationList");

    if (notificationList) {
        notificationList.innerHTML = `<p class="empty-text">No notifications yet.</p>`;
    }
}


export {
    watchUserNotifications,
    clearNotifications
};