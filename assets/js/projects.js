/* PROJECT IMPORTS */

import {
    collection,
    addDoc,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    arrayUnion,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    auth,
    db
} from "./firebase-config.js";

import {
    handleAuthError
} from "./auth.js";

import {
    addTaskComment,
    watchTaskComments,
    clearCommentListeners
} from "./comments.js";

import {
    watchProjectActivity,
    clearActivityLog
} from "./activity.js";

/* PROJECT UI ELEMENTS */

const createProjectForm = document.querySelector("#createProjectForm");
const projectTitle = document.querySelector("#projectTitle");
const projectDescription = document.querySelector("#projectDescription");
const projectMessage = document.querySelector("#projectMessage");
const projectList = document.querySelector("#projectList");
const activeProjectView = document.querySelector("#activeProjectView");

let unsubscribeProjects = null;
let unsubscribeMembers = null;
let unsubscribeTasks = null;
let activeProjectId = null;
let activeProjectMembers = [];
let currentUserProjectRole = null;


/* SHOW PROJECT MESSAGE */

function showProjectMessage(message) {
    projectMessage.textContent = message;
}


/* GET CURRENT USER ROLE */

async function getCurrentUserRole(projectId) {
    const currentUser = auth.currentUser;

    if (!currentUser) {
        return null;
    }

    const memberRef = doc(db, "projects", projectId, "members", currentUser.uid);
    const memberSnapshot = await getDoc(memberRef);

    if (!memberSnapshot.exists()) {
        return null;
    }

    return memberSnapshot.data().role;
}


/* FIND USER BY EMAIL */

async function findUserByEmail(email) {
    const usersQuery = query(
        collection(db, "users"),
        where("email", "==", email)
    );

    const usersSnapshot = await getDocs(usersQuery);

    if (usersSnapshot.empty) {
        return null;
    }

    const userDocument = usersSnapshot.docs[0];

    return {
        id: userDocument.id,
        data: userDocument.data()
    };
}


/* CREATE PROJECT */

async function createProject(event) {
    event.preventDefault();

    const currentUser = auth.currentUser;

    if (!currentUser) {
        showProjectMessage("You must be logged in first.");
        return;
    }

    const title = projectTitle.value.trim();
    const description = projectDescription.value.trim();

    try {
        showProjectMessage("Creating project...");

        const projectRef = await addDoc(collection(db, "projects"), {
            title: title,
            description: description,
            ownerId: currentUser.uid,
            memberIds: [currentUser.uid],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        await setDoc(doc(db, "projects", projectRef.id, "members", currentUser.uid), {
            uid: currentUser.uid,
            email: currentUser.email,
            fullName: currentUser.displayName || currentUser.email,
            role: "owner",
            invitedBy: currentUser.uid,
            joinedAt: serverTimestamp()
        });

        await addDoc(collection(db, "projects", projectRef.id, "activity"), {
            type: "project_created",
            message: `${currentUser.email} created the project.`,
            userId: currentUser.uid,
            userName: currentUser.email,
            createdAt: serverTimestamp()
        });

        createProjectForm.reset();

        showProjectMessage("Project created.");
    } catch (error) {
        if (!handleAuthError(error)) {
            showProjectMessage(error.message);
        }
    }
}


/* UPDATE PROJECT */

async function updateProject(projectId) {
    const role = await getCurrentUserRole(projectId);

    if (role !== "owner") {
        alert("Only the project owner can edit this project.");
        return;
    }

    const newTitle = prompt("Enter updated project title:");
    const newDescription = prompt("Enter updated project description:");

    if (!newTitle || newTitle.trim() === "") {
        return;
    }

    const currentUser = auth.currentUser;
    const projectRef = doc(db, "projects", projectId);

    try {
        await updateDoc(projectRef, {
            title: newTitle.trim(),
            description: newDescription?.trim() || "",
            updatedAt: serverTimestamp()
        });

        await addDoc(collection(db, "projects", projectId, "activity"), {
            type: "project_updated",
            message: `${currentUser.email} updated the project.`,
            userId: currentUser.uid,
            userName: currentUser.email,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        if (!handleAuthError(error)) {
            showProjectMessage(error.message);
        }
    }
}


/* DELETE PROJECT */

async function deleteProject(projectId) {
    const role = await getCurrentUserRole(projectId);

    if (role !== "owner") {
        alert("Only the project owner can delete this project.");
        return;
    }

    const confirmDelete = confirm("Delete this project? This cannot be undone.");

    if (!confirmDelete) {
        return;
    }

    try {
        await deleteDoc(doc(db, "projects", projectId));
    } catch (error) {
        if (!handleAuthError(error)) {
            showProjectMessage(error.message);
        }
        return;
    }

    activeProjectId = null;

    if (unsubscribeMembers) {
        unsubscribeMembers();
        unsubscribeMembers = null;
    }

    if (unsubscribeTasks) {
        unsubscribeTasks();
        unsubscribeTasks = null;
    }

    clearCommentListeners();
clearActivityLog();

    activeProjectView.className = "empty-state";
    activeProjectView.innerHTML = `
        <h3>Select or create a project</h3>
        <p>
            Your tasks, members, comments, notifications, and activity logs
            will appear here.
        </p>
    `;
}


/* INVITE MEMBER */

async function inviteMember(event, projectId) {
    event.preventDefault();

    const currentUser = auth.currentUser;
    const currentUserRole = await getCurrentUserRole(projectId);

    const inviteEmailInput = document.querySelector("#inviteEmail");
    const inviteRoleSelect = document.querySelector("#inviteRole");
    const inviteMessage = document.querySelector("#inviteMessage");

    const email = inviteEmailInput.value.trim().toLowerCase();
    const selectedRole = inviteRoleSelect.value;

    if (!currentUser) {
        inviteMessage.textContent = "You must be logged in.";
        return;
    }

    if (currentUserRole === "member" || !currentUserRole) {
        inviteMessage.textContent = "Members cannot invite users.";
        return;
    }

    if (currentUserRole === "admin" && selectedRole === "admin") {
        inviteMessage.textContent = "Admins can only invite members.";
        return;
    }

    try {
        inviteMessage.textContent = "Searching user...";

        const foundUser = await findUserByEmail(email);

        if (!foundUser) {
            inviteMessage.textContent = "No registered user found with this email.";
            return;
        }

        await setDoc(doc(db, "projects", projectId, "members", foundUser.id), {
            uid: foundUser.id,
            email: foundUser.data.email,
            fullName: foundUser.data.fullName || foundUser.data.email,
            role: selectedRole,
            invitedBy: currentUser.uid,
            joinedAt: serverTimestamp()
        });

        await updateDoc(doc(db, "projects", projectId), {
            memberIds: arrayUnion(foundUser.id),
            updatedAt: serverTimestamp()
        });

        await addDoc(collection(db, "notifications"), {
            userId: foundUser.id,
            type: "project_invite",
            title: "Project invitation",
            message: `${currentUser.email} added you to a project.`,
            projectId: projectId,
            taskId: "",
            isRead: false,
            createdAt: serverTimestamp()
        });

        await addDoc(collection(db, "projects", projectId, "activity"), {
            type: "member_invited",
            message: `${currentUser.email} invited ${foundUser.data.email} as ${selectedRole}.`,
            userId: currentUser.uid,
            userName: currentUser.email,
            createdAt: serverTimestamp()
        });

        inviteEmailInput.value = "";
        inviteMessage.textContent = "Member invited successfully.";
    } catch (error) {
        if (!handleAuthError(error)) {
            inviteMessage.textContent = error.message;
        }
    }
}


/* CREATE TASK */

async function createTask(event, projectId) {
    event.preventDefault();

    const currentUser = auth.currentUser;
    const role = await getCurrentUserRole(projectId);

    const taskTitleInput = document.querySelector("#taskTitle");
    const taskDescriptionInput = document.querySelector("#taskDescription");
    const taskAssigneeSelect = document.querySelector("#taskAssignee");
    const taskPrioritySelect = document.querySelector("#taskPriority");
    const taskDeadlineInput = document.querySelector("#taskDeadline");
    const taskMessage = document.querySelector("#taskMessage");

    if (!currentUser) {
        taskMessage.textContent = "You must be logged in.";
        return;
    }

    if (role !== "owner" && role !== "admin") {
        taskMessage.textContent = "Only owners and admins can create tasks.";
        return;
    }

    const assignedMember = activeProjectMembers.find(function (member) {
        return member.uid === taskAssigneeSelect.value;
    });

    if (!assignedMember) {
        taskMessage.textContent = "Please select a valid assignee.";
        return;
    }

    try {
        taskMessage.textContent = "Creating task...";

        const taskRef = await addDoc(collection(db, "projects", projectId, "tasks"), {
            title: taskTitleInput.value.trim(),
            description: taskDescriptionInput.value.trim(),
            assignedTo: assignedMember.uid,
            assignedToName: assignedMember.fullName || assignedMember.email,
            assignedToEmail: assignedMember.email,
            priority: taskPrioritySelect.value,
            deadline: taskDeadlineInput.value,
            status: "todo",
            isComplete: false,
            createdBy: currentUser.uid,
            createdByEmail: currentUser.email,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        await addDoc(collection(db, "notifications"), {
            userId: assignedMember.uid,
            type: "task_assigned",
            title: "New task assigned",
            message: `${currentUser.email} assigned you a new task.`,
            projectId: projectId,
            taskId: taskRef.id,
            isRead: false,
            createdAt: serverTimestamp()
        });

        await addDoc(collection(db, "projects", projectId, "activity"), {
            type: "task_created",
            message: `${currentUser.email} created task: ${taskTitleInput.value.trim()}.`,
            userId: currentUser.uid,
            userName: currentUser.email,
            createdAt: serverTimestamp()
        });

        document.querySelector("#createTaskForm").reset();

        taskMessage.textContent = "Task created.";
    } catch (error) {
        if (!handleAuthError(error)) {
            taskMessage.textContent = error.message;
        }
    }
}


/* UPDATE TASK STATUS */

async function updateTaskStatus(projectId, taskId, taskData, newStatus) {
    const currentUser = auth.currentUser;
    const role = await getCurrentUserRole(projectId);

    if (!currentUser) {
        return;
    }

    const isManager = role === "owner" || role === "admin";
    const isAssignedMember = taskData.assignedTo === currentUser.uid;

    if (!isManager && !isAssignedMember) {
        alert("You can only update tasks assigned to you.");
        return;
    }

    try {
        await updateDoc(doc(db, "projects", projectId, "tasks", taskId), {
            status: newStatus,
            isComplete: newStatus === "complete",
            updatedAt: serverTimestamp()
        });

        await addDoc(collection(db, "projects", projectId, "activity"), {
            type: "task_status_updated",
            message: `${currentUser.email} moved task "${taskData.title}" to ${newStatus}.`,
            userId: currentUser.uid,
            userName: currentUser.email,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        if (!handleAuthError(error)) {
            showProjectMessage(error.message);
        }
    }
}


/* EDIT TASK */

async function editTask(projectId, taskId, taskData) {
    const currentUser = auth.currentUser;
    const role = await getCurrentUserRole(projectId);

    if (!currentUser) {
        return;
    }

    const isManager = role === "owner" || role === "admin";
    const isAssignedMember = taskData.assignedTo === currentUser.uid;

    if (!isManager && !isAssignedMember) {
        alert("You can only edit tasks assigned to you.");
        return;
    }

    const newTitle = prompt("Update task title:", taskData.title);
    const newDescription = prompt("Update task description:", taskData.description || "");
    const newDeadline = prompt("Update deadline YYYY-MM-DD:", taskData.deadline || "");

    if (!newTitle || newTitle.trim() === "") {
        return;
    }

    let newPriority = taskData.priority;

    if (isManager) {
        const priorityInput = prompt("Priority: low, medium, high", taskData.priority);

        if (["low", "medium", "high"].includes(priorityInput)) {
            newPriority = priorityInput;
        }
    }

    try {
        await updateDoc(doc(db, "projects", projectId, "tasks", taskId), {
            title: newTitle.trim(),
            description: newDescription?.trim() || "",
            deadline: newDeadline?.trim() || "",
            priority: newPriority,
            updatedAt: serverTimestamp()
        });

        await addDoc(collection(db, "projects", projectId, "activity"), {
            type: "task_updated",
            message: `${currentUser.email} edited task "${newTitle.trim()}".`,
            userId: currentUser.uid,
            userName: currentUser.email,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        if (!handleAuthError(error)) {
            showProjectMessage(error.message);
        }
    }
}


/* DELETE TASK */

async function deleteTask(projectId, taskId, taskData) {
    const currentUser = auth.currentUser;
    const role = await getCurrentUserRole(projectId);

    if (!currentUser) {
        return;
    }

    const isManager = role === "owner" || role === "admin";

    if (!isManager) {
        alert("Only owners and admins can delete tasks.");
        return;
    }

    const confirmDelete = confirm(`Delete task "${taskData.title}"?`);

    if (!confirmDelete) {
        return;
    }

    try {
        await deleteDoc(doc(db, "projects", projectId, "tasks", taskId));

        await addDoc(collection(db, "projects", projectId, "activity"), {
            type: "task_deleted",
            message: `${currentUser.email} deleted task "${taskData.title}".`,
            userId: currentUser.uid,
            userName: currentUser.email,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        if (!handleAuthError(error)) {
            showProjectMessage(error.message);
        }
    }
}


/* RENDER ROLE BADGE */

function renderRoleBadge(role) {
    if (role === "owner") {
        return `<span class="role-badge owner-role">Owner</span>`;
    }

    if (role === "admin") {
        return `<span class="role-badge admin-role">Admin</span>`;
    }

    return `<span class="role-badge member-role">Member</span>`;
}


/* RENDER PRIORITY BADGE */

function renderPriorityBadge(priority) {
    if (priority === "high") {
        return `<span class="priority-badge high-priority">High</span>`;
    }

    if (priority === "medium") {
        return `<span class="priority-badge medium-priority">Medium</span>`;
    }

    return `<span class="priority-badge low-priority">Low</span>`;
}


/* RENDER MEMBERS LIST */

function renderMembersList(members) {
    const memberList = document.querySelector("#memberList");
    const memberCount = document.querySelector("#memberCount");

    if (!memberList || !memberCount) {
        return;
    }

    memberCount.textContent = members.length;

    if (members.length === 0) {
        memberList.innerHTML = `<p class="empty-text">No members found.</p>`;
        return;
    }

    memberList.innerHTML = members.map(function (member) {
        return `
            <div class="member-card">
                <div>
                    <strong>${member.fullName || member.email}</strong>
                    <p>${member.email}</p>
                </div>

                ${renderRoleBadge(member.role)}
            </div>
        `;
    }).join("");

    renderTaskAssigneeOptions(members);
}


/* RENDER TASK ASSIGNEE OPTIONS */

function renderTaskAssigneeOptions(members) {
    const taskAssigneeSelect = document.querySelector("#taskAssignee");

    if (!taskAssigneeSelect) {
        return;
    }

    taskAssigneeSelect.innerHTML = members.map(function (member) {
        return `
            <option value="${member.uid}">
                ${member.fullName || member.email}
            </option>
        `;
    }).join("");
}


/* WATCH PROJECT MEMBERS */

function watchProjectMembers(projectId) {
    if (unsubscribeMembers) {
        unsubscribeMembers();
    }

    const membersQuery = query(
        collection(db, "projects", projectId, "members"),
        orderBy("joinedAt", "asc")
    );

    unsubscribeMembers = onSnapshot(membersQuery, function (snapshot) {
        const members = [];

        snapshot.forEach(function (docSnapshot) {
            members.push(docSnapshot.data());
        });

        activeProjectMembers = members;

        renderMembersList(members);
    });
}


/* RENDER STATUS SELECT */

function renderStatusSelect(task) {
    return `
        <select class="form-control task-status-select" data-task-id="${task.id}">
            <option value="todo" ${task.status === "todo" ? "selected" : ""}>To Do</option>
            <option value="inProgress" ${task.status === "inProgress" ? "selected" : ""}>In Progress</option>
            <option value="review" ${task.status === "review" ? "selected" : ""}>Review</option>
            <option value="complete" ${task.status === "complete" ? "selected" : ""}>Complete</option>
        </select>
    `;
}


/* RENDER COMMENT FORM */

function renderCommentForm(task) {
    return `
        <div class="comment-box">
            <div id="commentList-${task.id}" class="comment-list">
                <p class="empty-text">Loading comments...</p>
            </div>

            <form class="comment-form" data-task-id="${task.id}">
                <input id="commentInput-${task.id}" type="text" class="form-control" placeholder="Write a comment...">
                <button type="submit" class="primary-btn">Send</button>
            </form>
        </div>
    `;
}


/* RENDER TASK CARD */

function renderTaskCard(task) {
    const currentUser = auth.currentUser;
    const isManager = currentUserProjectRole === "owner" || currentUserProjectRole === "admin";
    const isAssignedMember = currentUser && task.assignedTo === currentUser.uid;
    const canEditTask = isManager || isAssignedMember;
    const canDeleteTask = isManager;

    return `
        <article class="task-card" data-task-id="${task.id}">
            <div class="task-card-header">
                <h5>${task.title}</h5>
                ${renderPriorityBadge(task.priority)}
            </div>

            <p>${task.description || "No description."}</p>

            <div class="task-meta">
                <span>Assigned: ${task.assignedToName || task.assignedToEmail}</span>
                <span>Deadline: ${task.deadline || "No deadline"}</span>
            </div>

            ${renderStatusSelect(task)}

            <div class="task-actions">
                ${canEditTask ? `<button class="ghost-btn edit-task-btn" data-task-id="${task.id}">Edit</button>` : ""}
                ${canDeleteTask ? `<button class="danger-btn delete-task-btn" data-task-id="${task.id}">Delete</button>` : ""}
            </div>

            ${renderCommentForm(task)}
        </article>
    `;
}


/* SETUP TASK STATUS EVENTS */

function setupTaskStatusEvents(projectId, tasks) {
    const statusSelects = document.querySelectorAll(".task-status-select");

    statusSelects.forEach(function (statusSelect) {
        statusSelect.addEventListener("change", function () {
            const taskId = statusSelect.dataset.taskId;

            const selectedTask = tasks.find(function (task) {
                return task.id === taskId;
            });

            if (!selectedTask) {
                return;
            }

            updateTaskStatus(projectId, taskId, selectedTask, statusSelect.value);
        });
    });
}


/* SETUP TASK ACTION EVENTS */

function setupTaskActionEvents(projectId, tasks) {
    const editTaskButtons = document.querySelectorAll(".edit-task-btn");
    const deleteTaskButtons = document.querySelectorAll(".delete-task-btn");

    editTaskButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            const taskId = button.dataset.taskId;

            const selectedTask = tasks.find(function (task) {
                return task.id === taskId;
            });

            if (selectedTask) {
                editTask(projectId, taskId, selectedTask);
            }
        });
    });

    deleteTaskButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            const taskId = button.dataset.taskId;

            const selectedTask = tasks.find(function (task) {
                return task.id === taskId;
            });

            if (selectedTask) {
                deleteTask(projectId, taskId, selectedTask);
            }
        });
    });
}


/* SETUP COMMENT EVENTS */

function setupCommentEvents(projectId, tasks) {
    const commentForms = document.querySelectorAll(".comment-form");

    commentForms.forEach(function (commentForm) {
        commentForm.addEventListener("submit", function (event) {
            const taskId = commentForm.dataset.taskId;

            const selectedTask = tasks.find(function (task) {
                return task.id === taskId;
            });

            if (selectedTask) {
                addTaskComment(event, projectId, taskId, selectedTask.title);
            }
        });
    });
}


/* WATCH COMMENTS FOR TASKS */

function watchCommentsForTasks(projectId, tasks) {
    clearCommentListeners();

    tasks.forEach(function (task) {
        watchTaskComments(projectId, task.id);
    });
}


/* RENDER TASK BOARD */

function renderTaskBoard(projectId, tasks) {
    const taskColumns = {
        todo: [],
        inProgress: [],
        review: [],
        complete: []
    };

    tasks.forEach(function (task) {
        if (taskColumns[task.status]) {
            taskColumns[task.status].push(task);
        }
    });

    const todoColumn = document.querySelector("#todoTasks");
    const inProgressColumn = document.querySelector("#inProgressTasks");
    const reviewColumn = document.querySelector("#reviewTasks");
    const completeColumn = document.querySelector("#completeTasks");

    if (!todoColumn || !inProgressColumn || !reviewColumn || !completeColumn) {
        return;
    }

    todoColumn.innerHTML = taskColumns.todo.map(renderTaskCard).join("") || `<p class="empty-text">No tasks.</p>`;
    inProgressColumn.innerHTML = taskColumns.inProgress.map(renderTaskCard).join("") || `<p class="empty-text">No tasks.</p>`;
    reviewColumn.innerHTML = taskColumns.review.map(renderTaskCard).join("") || `<p class="empty-text">No tasks.</p>`;
    completeColumn.innerHTML = taskColumns.complete.map(renderTaskCard).join("") || `<p class="empty-text">No tasks.</p>`;

    setupTaskStatusEvents(projectId, tasks);
    setupTaskActionEvents(projectId, tasks);
    setupCommentEvents(projectId, tasks);
    watchCommentsForTasks(projectId, tasks);
}


/* WATCH PROJECT TASKS */

function watchProjectTasks(projectId) {
    if (unsubscribeTasks) {
        unsubscribeTasks();
    }

    const tasksQuery = query(
        collection(db, "projects", projectId, "tasks"),
        orderBy("createdAt", "desc")
    );

    unsubscribeTasks = onSnapshot(tasksQuery, function (snapshot) {
        const tasks = [];

        snapshot.forEach(function (docSnapshot) {
            tasks.push({
                id: docSnapshot.id,
                ...docSnapshot.data()
            });
        });

        renderTaskBoard(projectId, tasks);
    });
}


/* RENDER PROJECT CARD */

function renderProjectCard(projectId, projectData) {
    const projectCard = document.createElement("button");

    projectCard.className = "project-card";
    projectCard.type = "button";

    projectCard.innerHTML = `
        <span class="project-card-title">${projectData.title}</span>
        <span class="project-card-meta">${projectData.description || "No description yet"}</span>
    `;

    projectCard.addEventListener("click", function () {
        renderActiveProject(projectId, projectData);
    });

    return projectCard;
}


/* RENDER ACTIVE PROJECT */

async function renderActiveProject(projectId, projectData) {
    activeProjectId = projectId;

    const role = await getCurrentUserRole(projectId);
    currentUserProjectRole = role;

    const canManageProject = role === "owner";
    const canInviteMembers = role === "owner" || role === "admin";
    const canCreateTasks = role === "owner" || role === "admin";

    activeProjectView.className = "active-project-view";

    activeProjectView.innerHTML = `
        <div class="project-hero">
            <p class="eyebrow-text">Active Project</p>
            <h3>${projectData.title}</h3>
            <p>${projectData.description || "No project description yet."}</p>

            <div class="project-meta-row">
                <span class="project-id-pill">Role: ${role || "unknown"}</span>
                <span class="project-id-pill">ID: ${projectId}</span>
            </div>

            ${canManageProject ? `
                <div class="project-actions">
                    <button id="editProjectBtn" class="ghost-btn">Edit Project</button>
                    <button id="deleteProjectBtn" class="danger-btn">Delete Project</button>
                </div>
            ` : ""}
        </div>

        <div class="members-card">
            <div class="members-card-header">
                <div>
                    <p class="eyebrow-text">Team</p>
                    <h4>Project Members</h4>
                </div>

                <span class="member-count-pill"><span id="memberCount">0</span> members</span>
            </div>

            <div id="memberList" class="member-list">
                <p class="empty-text">Loading members...</p>
            </div>
        </div>

        ${canInviteMembers ? `
            <form id="inviteMemberForm" class="invite-card">
                <h4>Invite Member</h4>

                <input id="inviteEmail" type="email" class="form-control" placeholder="Registered user email" required>

                <select id="inviteRole" class="form-control">
                    <option value="member">Member</option>
                    ${role === "owner" ? `<option value="admin">Admin</option>` : ""}
                </select>

                <button type="submit" class="primary-btn">Invite User</button>

                <p id="inviteMessage" class="small-message"></p>
            </form>
        ` : ""}

        ${canCreateTasks ? `
            <form id="createTaskForm" class="task-create-card">
                <h4>Create Task</h4>

                <input id="taskTitle" type="text" class="form-control" placeholder="Task title" required>

                <textarea id="taskDescription" class="form-control" rows="3" placeholder="Task description"></textarea>

                <select id="taskAssignee" class="form-control" required>
                    <option value="">Loading members...</option>
                </select>

                <select id="taskPriority" class="form-control">
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                </select>

                <input id="taskDeadline" type="date" class="form-control">

                <button type="submit" class="primary-btn">Create Task</button>

                <p id="taskMessage" class="small-message"></p>
            </form>
        ` : ""}

        <div class="task-board">
            <div class="task-column">
                <h4>To Do</h4>
                <div id="todoTasks" class="task-list">
                    <p class="empty-text">Loading...</p>
                </div>
            </div>

            <div class="task-column">
                <h4>In Progress</h4>
                <div id="inProgressTasks" class="task-list">
                    <p class="empty-text">Loading...</p>
                </div>
            </div>

            <div class="task-column">
                <h4>Review</h4>
                <div id="reviewTasks" class="task-list">
                    <p class="empty-text">Loading...</p>
                </div>
            </div>

            <div class="task-column">
                <h4>Complete</h4>
                <div id="completeTasks" class="task-list">
                    <p class="empty-text">Loading...</p>
                </div>
            </div>
        </div>
    `;

    const editProjectBtn = document.querySelector("#editProjectBtn");
    const deleteProjectBtn = document.querySelector("#deleteProjectBtn");
    const inviteMemberForm = document.querySelector("#inviteMemberForm");
    const createTaskForm = document.querySelector("#createTaskForm");

    if (editProjectBtn) {
        editProjectBtn.addEventListener("click", function () {
            updateProject(projectId);
        });
    }

    if (deleteProjectBtn) {
        deleteProjectBtn.addEventListener("click", function () {
            deleteProject(projectId);
        });
    }

    if (inviteMemberForm) {
        inviteMemberForm.addEventListener("submit", function (event) {
            inviteMember(event, projectId);
        });
    }

    if (createTaskForm) {
        createTaskForm.addEventListener("submit", function (event) {
            createTask(event, projectId);
        });
    }

    watchProjectMembers(projectId);
    watchProjectTasks(projectId);
    watchProjectActivity(projectId);
}


/* RENDER PROJECT LIST */

function renderProjectList(projects) {
    projectList.innerHTML = "";

    if (projects.length === 0) {
        projectList.innerHTML = `<p class="empty-text">No projects yet. Create your first one.</p>`;
        return;
    }

    projects.forEach(function (project) {
        const projectCard = renderProjectCard(project.id, project.data);
        projectList.appendChild(projectCard);
    });
}


/* WATCH USER PROJECTS */

function watchUserProjects(userId) {
    if (unsubscribeProjects) {
        unsubscribeProjects();
    }

    const projectsQuery = query(
        collection(db, "projects"),
        where("memberIds", "array-contains", userId),
        orderBy("createdAt", "desc")
    );

    unsubscribeProjects = onSnapshot(projectsQuery, function (snapshot) {
        const projects = [];

        snapshot.forEach(function (docSnapshot) {
            projects.push({
                id: docSnapshot.id,
                data: docSnapshot.data()
            });
        });

        renderProjectList(projects);
    });
}


/* CLEAR PROJECT UI */

function clearProjectUi() {
    if (unsubscribeProjects) {
        unsubscribeProjects();
        unsubscribeProjects = null;
    }

    if (unsubscribeMembers) {
        unsubscribeMembers();
        unsubscribeMembers = null;
    }

    if (unsubscribeTasks) {
        unsubscribeTasks();
        unsubscribeTasks = null;
    }

    clearCommentListeners();
clearActivityLog();
    activeProjectId = null;
    activeProjectMembers = [];
    currentUserProjectRole = null;

    projectList.innerHTML = `<p class="empty-text">No projects loaded yet.</p>`;

    activeProjectView.className = "empty-state";
    activeProjectView.innerHTML = `
        <h3>Select or create a project</h3>
        <p>
            Your tasks, members, comments, notifications, and activity logs
            will appear here.
        </p>
    `;
}


/* SETUP PROJECT EVENTS */

function setupProjectEvents() {
    createProjectForm.addEventListener("submit", createProject);
}


export {
    setupProjectEvents,
    watchUserProjects,
    clearProjectUi
};