/* ASSIGNED TASK IMPORTS */

import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    db
} from "./firebase-config.js";


/* ASSIGNED TASK STATE */

let unsubscribeAssignedProjects = null;
let assignedTaskListeners = [];
let assignedTasksByProject = {};


/* RENDER ASSIGNED TASKS */

function renderAssignedTasks() {
    const assignedTaskList = document.querySelector("#assignedTaskList");

    if (!assignedTaskList) {
        return;
    }

    const allAssignedTasks = Object.values(assignedTasksByProject).flat();

    if (allAssignedTasks.length === 0) {
        assignedTaskList.innerHTML = `<p class="empty-text">No assigned tasks yet.</p>`;
        return;
    }

    assignedTaskList.innerHTML = allAssignedTasks.map(function (task) {
        return `
            <div class="assigned-task-item">
                <strong>${task.title}</strong>
                <p>${task.projectTitle}</p>
                <span>${task.status} · ${task.priority}</span>
            </div>
        `;
    }).join("");
}


/* CLEAR TASK SUB-LISTENERS */

function clearTaskSubListeners() {
    assignedTaskListeners.forEach(function (unsubscribeTaskListener) {
        unsubscribeTaskListener();
    });

    assignedTaskListeners = [];
    assignedTasksByProject = {};
}


/* CLEAR ALL ASSIGNED LISTENERS */

function clearAssignedTaskListeners() {
    clearTaskSubListeners();

    if (unsubscribeAssignedProjects) {
        unsubscribeAssignedProjects();
        unsubscribeAssignedProjects = null;
    }
}


/* WATCH ASSIGNED TASKS */

function watchAssignedTasks(userId) {
    clearAssignedTaskListeners();

    const projectsQuery = query(
        collection(db, "projects"),
        where("memberIds", "array-contains", userId),
        orderBy("createdAt", "desc")
    );

    unsubscribeAssignedProjects = onSnapshot(projectsQuery, function (projectSnapshot) {
        clearTaskSubListeners();

        if (projectSnapshot.empty) {
            renderAssignedTasks();
            return;
        }

        projectSnapshot.forEach(function (projectDocument) {
            const projectData = projectDocument.data();

            const tasksQuery = query(
                collection(db, "projects", projectDocument.id, "tasks"),
                where("assignedTo", "==", userId)
            );

            const unsubscribeTaskListener = onSnapshot(tasksQuery, function (taskSnapshot) {
                const projectTasks = [];

                taskSnapshot.forEach(function (taskDocument) {
                    projectTasks.push({
                        id: taskDocument.id,
                        projectId: projectDocument.id,
                        projectTitle: projectData.title,
                        ...taskDocument.data()
                    });
                });

                assignedTasksByProject[projectDocument.id] = projectTasks;

                renderAssignedTasks();
            });

            assignedTaskListeners.push(unsubscribeTaskListener);
        });
    });
}


/* CLEAR ASSIGNED TASKS */

function clearAssignedTasks() {
    clearAssignedTaskListeners();

    const assignedTaskList = document.querySelector("#assignedTaskList");

    if (assignedTaskList) {
        assignedTaskList.innerHTML = `<p class="empty-text">No assigned tasks yet.</p>`;
    }
}


export {
    watchAssignedTasks,
    clearAssignedTasks
};