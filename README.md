# Firebase Project Suite

A real-time project management web app built with Firebase Authentication, Cloud Firestore, and modular JavaScript.

## Live Demo

https://fazal305.github.io/firebase-project-suite/

## Project Overview

Firebase Project Suite is a Trello/Jira-inspired collaboration dashboard for managing projects, team members, tasks, comments, notifications, and activity logs. It demonstrates how a frontend-only app can still support real-time multi-user workflows by using Firebase Authentication and Firestore listeners.

The app is designed as a portfolio project for practical Firebase development: authentication, role-based permissions, nested collections, live updates, task assignment, and collaboration history.

## Features

- Email/password registration and login
- Persistent Firebase Authentication sessions
- Create, view, edit, and delete projects
- Project roles for owner, admin, and member users
- Invite registered users by email
- Real-time project member directory
- Create tasks with assignees, priority, deadline, and status
- Task workflow: To Do, In Progress, Review, Complete
- Assigned tasks dashboard for the current user
- Real-time task comments
- Project activity log
- Real-time notifications for invites and task assignments
- Mark notifications as read
- Responsive dashboard layout

## Tech Stack

- HTML5
- CSS3
- JavaScript modules
- Firebase Authentication
- Cloud Firestore
- GitHub Pages

## Firebase Concepts Demonstrated

- `onAuthStateChanged()` for session-aware UI
- Firestore CRUD operations
- `onSnapshot()` listeners for real-time updates
- Subcollections for project members, tasks, comments, and activity
- Role-based UI behavior
- Query filters with `where()` and `orderBy()`
- Notification and activity feed patterns

## Firestore Structure

```text
users/
|-- userId

projects/
|-- projectId
|   |-- members/
|   |   |-- memberId
|   |-- tasks/
|   |   |-- taskId
|   |       |-- comments/
|   |           |-- commentId
|   |-- activity/
|       |-- activityId

notifications/
|-- notificationId
```

## Project Structure

```text
firebase-project-suite/
|-- index.html
|-- README.md
|-- .gitignore
|-- assets/
|   |-- css/
|   |   |-- style.css
|   |-- js/
|       |-- firebase-config.js
|       |-- app.js
|       |-- auth.js
|       |-- projects.js
|       |-- tasks.js
|       |-- comments.js
|       |-- notifications.js
|       |-- activity.js
|       |-- ui.js
```

## Setup

1. Create a Firebase project.
2. Enable Email/Password Authentication.
3. Create a Cloud Firestore database.
4. Add your Firebase web app config inside:

```text
assets/js/firebase-config.js
```

Example:

```javascript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
};
```

5. Open `index.html` locally or deploy through GitHub Pages.

## Firestore Index Notes

Firestore may request composite indexes for queries such as:

- Projects filtered by `memberIds` and ordered by `createdAt`
- Notifications filtered by `userId` and ordered by `createdAt`

When Firebase shows an index error, open the provided Firebase link and create the suggested index.

## Portfolio Notes

This project highlights:

- Real-time dashboard development
- Firebase Authentication and Firestore integration
- Modular JavaScript architecture
- Multi-user role and permission logic
- Task workflow UI
- Collaboration features without a custom backend

## Future Improvements

- Drag-and-drop task board
- Project search and filters
- User profile photos
- Due-date alerts
- Task labels
- File attachments
- Analytics dashboard
- Firestore security rules documentation
- Firebase Hosting deployment

## Author

Fazal Abbas

- GitHub: https://github.com/fazal305
- LinkedIn: https://www.linkedin.com/in/fazal-abbas-4653dg86

## License

This project is licensed under the MIT License.
