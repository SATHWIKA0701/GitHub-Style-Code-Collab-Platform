# Frontend README — GitHub-Style Code Collaboration Platform

## Overview

This frontend is the React-based user interface for the **GitHub-Style Code Collaboration Platform**. It allows users to register, log in, create repositories, browse code files, edit files, commit changes, manage branches, create issues, open pull requests, receive notifications, invite collaborators, and manage repository settings.

The UI is designed to work like a simplified GitHub experience, with repository pages, file explorer, commit workflow, issue tracking, pull request pages, collaborator management, notifications, and profile/settings screens.

## Technology Stack

| Area | Technology |
|---|---|
| Framework | React |
| Build Tool | Vite |
| Routing | React Router |
| HTTP Client | Axios |
| Realtime | Socket.io Client |
| Editor | Monaco Editor |
| Markdown Rendering | React Markdown |
| Styling | CSS in `src/styles/app.css` |
| Auth Handling | Context API + HTTP-only cookie session |
| State Sharing | React Context |

## Project Structure

```text
frontend/
├── public/
├── src/
│   ├── api/
│   │   ├── http.js
│   │   └── services.js
│   ├── components/
│   │   ├── FormField.jsx
│   │   ├── Modal.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── RepoSidebar.jsx
│   │   └── ToastStack.jsx
│   ├── contexts/
│   │   ├── AppContext.jsx
│   │   ├── AuthContext.jsx
│   │   └── SocketContext.jsx
│   ├── hooks/
│   ├── layouts/
│   │   └── AppLayout.jsx
│   ├── pages/
│   │   ├── DashboardPage.jsx
│   │   ├── RepositoriesPage.jsx
│   │   ├── NewRepositoryPage.jsx
│   │   ├── RepositoryPage.jsx
│   │   ├── FileExplorerPage.jsx
│   │   ├── CommitsPage.jsx
│   │   ├── BranchesPage.jsx
│   │   ├── IssuesPage.jsx
│   │   ├── PullRequestsPage.jsx
│   │   ├── PullRequestDetailPage.jsx
│   │   ├── ActivityPage.jsx
│   │   ├── RepoSettingsPage.jsx
│   │   ├── NotificationsPage.jsx
│   │   ├── ProfilePage.jsx
│   │   └── SettingsPage.jsx
│   ├── styles/
│   │   └── app.css
│   ├── App.jsx
│   └── main.jsx
├── package.json
└── vite.config.js
```

## Frontend Architecture

The frontend follows a page-based architecture:

- `App.jsx` defines public and protected routes.
- `ProtectedRoute.jsx` prevents unauthenticated access.
- `AppLayout.jsx` provides the main authenticated layout with navigation.
- `AuthContext.jsx` manages login, logout, profile bootstrap, and current user state.
- `AppContext.jsx` manages global toasts, unread notification count, notification list, and shared app state.
- `SocketContext.jsx` connects to the backend Socket.io server for realtime notifications.
- `services.js` centralizes all API calls.
- `http.js` configures the Axios client with `withCredentials: true`.

## Main Features Implemented

### Authentication UI

The frontend supports:

- User registration
- User login
- Logout
- Profile fetching after refresh
- Protected routes
- Forgot password page
- Profile page
- Settings page

The frontend communicates with the backend using cookie-based authentication.

### Repository Management

Users can:

- View repositories they own or collaborate on
- Create new repositories
- Open repository detail pages
- View repository metadata
- Navigate repository sections through sidebar

Repository routes include:

```text
/repos/:repoId/files
/repos/:repoId/commits
/repos/:repoId/branches
/repos/:repoId/issues
/repos/:repoId/pulls
/repos/:repoId/activity
/repos/:repoId/settings
```

### File Explorer

The file explorer allows users to:

- Browse repository files and folders
- Open files
- Edit files using Monaco Editor
- Preview Markdown files
- Upload files
- Create folders
- Delete files/folders with confirmation
- Save file changes using a commit message modal

The save flow uses a custom modal instead of browser `prompt()`.

### Commit Workflow

When a user saves a file:

1. The commit dialog opens.
2. The user enters a commit message.
3. The frontend calls the backend save-and-commit API.
4. The file is updated and committed.

### Branch Management

The branch page supports:

- Viewing branches
- Creating branches
- Switching branches
- Merging branches

### Issues

The issue page supports:

- Creating issues
- Listing issues
- Viewing issue details
- Adding comments
- Closing/reopening issues

### Pull Requests

Pull request pages support:

- Listing pull requests
- Creating pull requests
- Viewing PR details
- Viewing diffs
- Adding review comments
- Merging PRs
- Closing/reopening PRs where supported by backend

### Collaborator and Invitation Workflow

Repository settings support:

- Viewing collaborators
- Owner-only collaborator controls
- Sending collaboration invitations
- Updating collaborator roles
- Removing collaborators
- Labels management
- Archive repository option
- Delete repository option with confirmation

The GitHub-like collaboration flow is:

```text
Owner sends invite
↓
User receives notification
↓
User accepts invite
↓
Repo appears in user's repository list
```

### Notifications

The notifications page supports:

- Listing notifications
- Marking notifications as read
- Marking all as read
- Navigating to related resource pages
- Accepting/declining repository invitations

### Realtime Updates

Socket.io is used for realtime updates such as:

- New notifications
- Repository activity events
- Toast alerts

## Environment Variables

Create a `.env` file inside the `frontend/` folder.

```env
VITE_API_URL=http://localhost:3000
```

For production deployment:

```env
VITE_API_URL=https://your-backend-url.onrender.com
```

## Installation

Go to the frontend folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Default Vite URL:

```text
http://localhost:5173
```

## Build for Production

```bash
npm run build
```

Preview production build locally:

```bash
npm run preview
```

## Vercel Deployment

Use these settings on Vercel:

| Setting | Value |
|---|---|
| Framework | Vite |
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

Add this environment variable:

```env
VITE_API_URL=https://your-backend-url.onrender.com
```

After deployment, update backend `CLIENT_URL` with the Vercel frontend URL.

## Important Notes

- The frontend depends on backend APIs being deployed and reachable.
- `VITE_API_URL` must point to the backend base URL.
- Backend CORS must allow the frontend production URL.
- Cookies require correct CORS and `withCredentials: true`.
- Realtime notifications require backend Socket.io availability.
- Some file operations depend on backend filesystem storage.

## Work Completed on Frontend

- Page-based routing setup
- Protected route implementation
- Auth context implementation
- Axios service layer
- Toast notification system
- Realtime Socket.io client
- Repository dashboard
- File explorer with Monaco editor
- Markdown preview
- Commit message modal
- File delete confirmation modal
- Collaborator invite UI
- Notifications page with invitation accept/decline
- Repository delete confirmation dialog
- Code splitting with React lazy loading
- Basic responsive UI improvements

## Future Improvements

- Add frontend test coverage
- Add better loading skeletons
- Add error boundaries
- Improve mobile responsiveness
- Improve PR diff UI
- Add branch protection UI
- Add avatar upload UI
- Add repository star/watch features
