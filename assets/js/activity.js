/* ACTIVITY IMPORTS */

import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    db
} from "./firebase-config.js";


/* ACTIVITY LISTENER */

let unsubscribeActivity = null;


/* FORMAT ACTIVITY TYPE */

function formatActivityType(type) {
    return type.replaceAll("_", " ").toUpperCase();
}


/* RENDER ACTIVITY LOG */

function renderActivityLog(activities) {
    const activityLogList = document.querySelector("#activityLogList");

    if (!activityLogList) {
        return;
    }

    if (activities.length === 0) {
        activityLogList.innerHTML = `<p class="empty-text">No activity yet.</p>`;
        return;
    }

    activityLogList.innerHTML = activities.map(function (activity) {
        return `
            <div class="activity-item">
                <span>${formatActivityType(activity.type)}</span>
                <p>${activity.message}</p>
            </div>
        `;
    }).join("");
}


/* WATCH PROJECT ACTIVITY */

function watchProjectActivity(projectId) {
    if (unsubscribeActivity) {
        unsubscribeActivity();
    }

    const activityQuery = query(
        collection(db, "projects", projectId, "activity"),
        orderBy("createdAt", "desc"),
        limit(25)
    );

    unsubscribeActivity = onSnapshot(activityQuery, function (snapshot) {
        const activities = [];

        snapshot.forEach(function (docSnapshot) {
            activities.push(docSnapshot.data());
        });

        renderActivityLog(activities);
    });
}


/* CLEAR ACTIVITY LOG */

function clearActivityLog() {
    if (unsubscribeActivity) {
        unsubscribeActivity();
        unsubscribeActivity = null;
    }

    const activityLogList = document.querySelector("#activityLogList");

    if (activityLogList) {
        activityLogList.innerHTML = `<p class="empty-text">No activity selected.</p>`;
    }
}


export {
    watchProjectActivity,
    clearActivityLog
};