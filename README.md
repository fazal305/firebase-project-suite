# Firebase Project Management Suite

A real-time multi-user project management platform built with Firebase Authentication, Cloud Firestore, Bootstrap 5, and Vanilla JavaScript.

Inspired by tools like Trello and Jira, this project demonstrates real-world concepts such as authentication, role-based access control, real-time collaboration, notifications, activity tracking, and project management workflows.

---

## Live Demo

🚀 https://fazal305.github.io/firebase-project-suite/

---

## Screenshots

Add screenshots here after deployment.

### Login System

![Login Screenshot](screenshots/login.png)

### Dashboard

![Dashboard Screenshot](screenshots/dashboard.png)

### Task Board

![Task Board Screenshot](screenshots/tasks.png)

### Activity Log

![Activity Log Screenshot](screenshots/activity-log.png)

---

## Features

### Authentication

- User Registration
- User Login
- User Logout
- Persistent Sessions
- Firebase Authentication

---

### Project Management

- Create Projects
- Edit Projects
- Delete Projects
- View All Assigned Projects
- Real-Time Project Updates

---

### Role-Based Access Control

Each project has its own permission system.

#### Owner

- Create Projects
- Edit Projects
- Delete Projects
- Invite Admins
- Invite Members
- Create Tasks
- Edit Tasks
- Delete Tasks
- Full Project Control

#### Admin

- Invite Members
- Create Tasks
- Edit Tasks
- Delete Tasks

#### Member

- View Project
- Update Assigned Task Status
- Edit Assigned Tasks
- Add Comments

---

### Team Management

- Invite Users By Email
- Assign Roles
- Real-Time Member Updates
- Project Member Directory

---

### Task Management

- Create Tasks
- Assign Tasks To Members
- Set Priorities
- Set Deadlines
- Edit Tasks
- Delete Tasks
- Update Task Status

Workflow:

```text
To Do
 ↓
In Progress
 ↓
Review
 ↓
Complete
```

---

### Real-Time Comments

- Task Discussion Threads
- Real-Time Comment Updates
- Member Collaboration

Firestore Path:

```text
projects
 └── projectId
      └── tasks
           └── taskId
                └── comments
```

---

### Notifications

- Task Assignment Notifications
- Project Invitation Notifications
- Mark As Read
- Real-Time Updates

---

### Activity Log

Tracks:

- Project Created
- Project Updated
- Member Invited
- Task Created
- Task Updated
- Task Deleted
- Task Status Changed
- Comment Added

Real-time activity feed for every project.

---

### Assigned Tasks Dashboard

Displays:

- Tasks Assigned To Current User
- Priority
- Status
- Project Name

Across all projects.

---

## Tech Stack

### Frontend

- HTML5
- CSS3
- Vanilla JavaScript
- Bootstrap 5

### Backend

- Firebase Authentication
- Cloud Firestore

### Realtime Features

- Firestore onSnapshot()
- Real-Time Tasks
- Real-Time Comments
- Real-Time Notifications
- Real-Time Activity Logs
- Real-Time Project Updates

---

## Firestore Data Structure

```text
users
 └── userId

projects
 └── projectId
      ├── members
      │    └── memberId
      │
      ├── tasks
      │    └── taskId
      │         └── comments
      │
      └── activity

notifications
 └── notificationId
```

---

## Project Structure

```text
firebase-project-suite/
│
├── index.html
├── README.md
├── .gitignore
│
├── assets/
│   │
│   ├── css/
│   │   └── style.css
│   │
│   └── js/
│       │
│       ├── firebase-config.js
│       ├── auth.js
│       ├── projects.js
│       ├── comments.js
│       ├── notifications.js
│       ├── activity.js
│       ├── tasks.js
│       ├── ui.js
│       └── app.js
│
└── firestore.rules
```

---

## Security

Protected using Firestore Security Rules.

Includes:

- Authentication Checks
- Project Membership Validation
- Owner/Admin Permissions
- Notification Ownership Protection
- Activity Log Protection

---

## Firebase Setup

### Install Firebase

```bash
npm install firebase
```

---

### Create Firebase Project

1. Open Firebase Console
2. Create Project
3. Enable Authentication
4. Enable Email/Password Sign-In
5. Create Firestore Database
6. Copy Firebase Config

---

### Add Firebase Config

Inside:

```text
assets/js/firebase-config.js
```

Paste:

```javascript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

---

## Firestore Indexes

Firebase may request indexes for:

### Projects

```text
memberIds
array-contains

createdAt
descending
```

### Notifications

```text
userId
ascending

createdAt
descending
```

When Firebase shows an index error:

1. Click the provided link
2. Create the index
3. Wait for indexing to finish

---

## Learning Outcomes

This project demonstrates:

- Firebase Authentication
- Firestore CRUD
- Real-Time Databases
- Firestore Security Rules
- Role-Based Access Control
- Multi-User Applications
- Real-Time Collaboration
- Project Management Systems
- Modular JavaScript Architecture

---

## Future Improvements

Planned Features:

- Drag & Drop Task Board
- Due Date Alerts
- Task Labels
- Task Filters
- Search System
- File Attachments
- User Profiles
- Project Settings
- Project Archive
- Dashboard Analytics
- Dark / Light Theme Toggle
- Firebase Hosting Deployment
- Email Notifications

---

## Deployment

### GitHub Pages

Repository:

```text
firebase-project-suite
```

Live URL:

```text
https://fazal305.github.io/firebase-project-suite/
```

### Firebase Hosting (Optional)

```bash
firebase login
firebase init hosting
firebase deploy
```

---

## Author

**Fazal Abbas**

Software Engineering Student  
Karachi, Pakistan

GitHub:

https://github.com/fazal305

LinkedIn:

https://www.linkedin.com/in/fazal-abbas-4653dg86

---

## License

This project is licensed under the MIT License.

See the LICENSE file for details.