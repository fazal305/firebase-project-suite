/* COMMENT IMPORTS */

import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    auth,
    db
} from "./firebase-config.js";


/* COMMENT LISTENERS */

const commentListeners = {};


/* ADD TASK COMMENT */

async function addTaskComment(event, projectId, taskId, taskTitle) {
    event.preventDefault();

    const currentUser = auth.currentUser;
    const commentInput = document.querySelector(`#commentInput-${taskId}`);

    if (!currentUser || !commentInput) {
        return;
    }

    const commentText = commentInput.value.trim();

    if (commentText === "") {
        return;
    }

    await addDoc(collection(db, "projects", projectId, "tasks", taskId, "comments"), {
        text: commentText,
        createdBy: currentUser.uid,
        createdByEmail: currentUser.email,
        createdAt: serverTimestamp()
    });

    await addDoc(collection(db, "projects", projectId, "activity"), {
        type: "comment_added",
        message: `${currentUser.email} commented on task "${taskTitle}".`,
        userId: currentUser.uid,
        userName: currentUser.email,
        createdAt: serverTimestamp()
    });

    commentInput.value = "";
}


/* RENDER COMMENTS */

function renderComments(taskId, comments) {
    const commentList = document.querySelector(`#commentList-${taskId}`);

    if (!commentList) {
        return;
    }

    if (comments.length === 0) {
        commentList.innerHTML = `<p class="empty-text">No comments yet.</p>`;
        return;
    }

    commentList.innerHTML = comments.map(function (comment) {
        return `
            <div class="comment-item">
                <strong>${comment.createdByEmail}</strong>
                <p>${comment.text}</p>
            </div>
        `;
    }).join("");
}


/* WATCH TASK COMMENTS */

function watchTaskComments(projectId, taskId) {
    if (commentListeners[taskId]) {
        commentListeners[taskId]();
    }

    const commentsQuery = query(
        collection(db, "projects", projectId, "tasks", taskId, "comments"),
        orderBy("createdAt", "asc")
    );

    commentListeners[taskId] = onSnapshot(commentsQuery, function (snapshot) {
        const comments = [];

        snapshot.forEach(function (docSnapshot) {
            comments.push(docSnapshot.data());
        });

        renderComments(taskId, comments);
    });
}


/* CLEAR COMMENT LISTENERS */

function clearCommentListeners() {
    Object.keys(commentListeners).forEach(function (taskId) {
        commentListeners[taskId]();
        delete commentListeners[taskId];
    });
}


export {
    addTaskComment,
    watchTaskComments,
    clearCommentListeners
};