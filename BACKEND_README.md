# Backend README — GitHub-Style Code Collaboration Platform

## Overview

This backend powers the **GitHub-Style Code Collaboration Platform**. It provides REST APIs, authentication, repository management, Git operations, issue tracking, pull request workflows, collaborator permissions, notifications, realtime socket events, activity logging, and file upload support.

The backend is built with Express, MongoDB, Mongoose, Socket.io, and Simple Git. It acts as the API and Git engine for the frontend application.

## Technology Stack

| Area | Technology |
|---|---|
| Runtime | Node.js |
| Module System | ES Modules |
| Framework | Express |
| Database | MongoDB |
| ODM | Mongoose |
| Authentication | JWT + HTTP-only Cookie |
| Password Hashing | bcrypt |
| Realtime | Socket.io |
| Git Operations | simple-git |
| File System | Node `fs` and `path` |
| Uploads | Multer |
| Security | Helmet, CORS, Rate Limiting |
| Logging | Morgan |
| Compression | compression |

## Project Structure

```text
backend/
├── config/
│   ├── db.js
│   └── socket.js
├── controllers/
│   ├── authController.js
│   ├── repoController.js
│   ├── gitController.js
│   ├── issueController.js
│   ├── prController.js
│   ├── reviewController.js
│   ├── notificationController.js
│   ├── invitationController.js
│   └── activityController.js
├── middleware/
│   ├── authMiddleware.js
│   ├── permissionMiddleware.js
│   └── rateLimiters.js
├── models/
│   ├── User.js
│   ├── Repository.js
│   ├── Issue.js
│   ├── Comment.js
│   ├── PullRequest.js
│   ├── ReviewComment.js
│   ├── NotificationModel.js
│   ├── Invitation.js
│   ├── ActivityModel.js
│   └── Label.js
├── routes/
│   ├── authRoutes.js
│   ├── repoRoutes.js
│   ├── gitRoutes.js
│   ├── issueRoutes.js
│   ├── prRoutes.js
│   ├── reviewRoutes.js
│   ├── notificationRoute.js
│   ├── invitationRoutes.js
│   └── activityRoute.js
├── services/
│   ├── gitService.js
│   └── prService.js
├── utils/
│   ├── asyncHandler.js
│   ├── cache.js
│   ├── eventHelpers.js
│   ├── pagination.js
│   └── repoLock.js
├── repos/
├── server.js
└── package.json
```

## Backend Architecture

The backend is divided into clear layers:

### Routes

Route files define API endpoints and attach middleware.

Examples:

- `/auth`
- `/repos`
- `/api/git`
- `/api/pr`
- `/api/notifications`
- `/api/invitations`

### Controllers

Controllers handle request/response logic, validation, and call services or models.

### Models

Mongoose models define database structure for:

- Users
- Repositories
- Issues
- Comments
- Pull requests
- Review comments
- Notifications
- Invitations
- Activity logs
- Labels

### Services

Services contain business logic that should not live directly in controllers.

The most important service is:

```text
services/gitService.js
```

It handles repository initialization, file listing, file writing, commits, branches, merge, diffs, and commit history.

### Middleware

Middleware handles:

- Authentication
- Authorization/permissions
- Rate limiting
- Error handling

### Utils

Utilities support:

- Async error handling
- Pagination
- Cache
- Repository locks
- Notification/activity helpers

## Main Backend Features

### Authentication

Supported APIs:

```text
POST /auth/register
POST /auth/login
POST /auth/logout
GET /auth/profile
PUT /auth/profile
GET /auth/users/search
```

Authentication uses JWT stored in HTTP-only cookies.

### Repository Management

Supported APIs:

```text
GET /repos
POST /repos
GET /repos/:id
DELETE /repos/:id
PUT /repos/:id/archive
GET /repos/public
GET /repos/alias/:username/:repoName
```

Repository features include:

- Create repo
- List repos
- View repo
- Delete repo
- Archive/unarchive repo
- Public/private visibility
- Owner/collaborator/viewer permissions
- Owner-scoped repo naming
- Git repository initialization

### Repository Deletion

Only repository owners can delete a repository.

Delete operation cascades related data:

- Issues
- Comments
- Pull requests
- Review comments
- Notifications
- Activity logs

### Collaborators and Permissions

Roles:

```text
owner
collaborator
viewer
```

Permission hierarchy:

```text
owner > collaborator > viewer
```

Owner can:

- Delete repo
- Archive repo
- Invite collaborators
- Remove collaborators
- Update roles

Collaborator can:

- Work on allowed repository operations
- Create branches/PRs/issues where permitted

Viewer can:

- Read repository content
- Cannot delete or manage repository

### Git File System

The backend stores repositories in:

```text
backend/repos/
```

Git operations are performed using `simple-git`.

Supported APIs include:

```text
GET /api/git/files/:repoName
PUT /api/git/files
POST /api/git/files/commit
POST /api/git/files/upload
POST /api/git/files/folder
DELETE /api/git/files
POST /api/git/commit
GET /api/git/repos/:repoName/commits
GET /api/git/branches/:repoName
POST /api/git/branch
POST /api/git/checkout
POST /api/git/merge
GET /api/git/diff
GET /api/git/graph/:repoName
```

### File Save and Commit Flow

The preferred save flow is:

```text
Frontend sends file content + commit message
↓
Backend writes file
↓
Backend stages changes
↓
Backend commits changes
↓
Commit appears in commit history
```

### Repository Locking

The backend includes a repo lock utility to reduce corruption during concurrent Git operations.

This helps prevent multiple operations from modifying the same Git working tree at the same time.

### Branch Operations

Supported operations:

- Create branch
- Switch branch
- Merge branch
- View branch list
- View commit graph

### Pull Requests

Pull request features include:

- Create PR
- List PRs
- View PR details
- Merge PR
- Close PR
- Reopen PR
- View PR diff
- Review comments

### Issues

Issue features include:

- Create issue
- List issues
- Update issue
- Close issue
- Reopen issue
- Add comments
- Delete comments
- Assign issues where supported
- Labels support where implemented

### Notifications

Notification system supports:

- Database notifications
- Realtime Socket.io notifications
- Read notification
- Mark all as read
- Notification count
- Resource references for navigation

Notification types include:

```text
new_pr
pr_merged
new_comment
new_issue
commit_pushed
pr_reviewed
issue_assigned
pr_approved
collaborator_added
repo_invitation
repo_invitation_accepted
repo_invitation_declined
```

### Invitation Workflow

GitHub-like collaboration invitation flow:

```text
Owner sends invitation
↓
Notification created for invited user
↓
Invited user accepts/declines
↓
If accepted, user is added as collaborator
↓
Repo appears in invited user's repository list
```

Invitation APIs:

```text
POST /api/repos/:id/invitations
GET /api/invitations
PUT /api/invitations/:id/accept
PUT /api/invitations/:id/decline
```

### Activity Logging

The backend logs repository-related activity such as:

- Repository created
- Branch created
- Commit pushed
- Issue created
- Issue closed
- PR opened
- PR merged
- Collaborator added/removed
- Repository archived

## Environment Variables

Create `.env` inside the `backend/` folder.

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/github-collab
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

For production:

```env
PORT=3000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/github-collab
JWT_SECRET=your_strong_production_secret
CLIENT_URL=https://your-frontend-url.vercel.app
NODE_ENV=production
```

## Installation

Go to backend folder:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Start production server:

```bash
npm start
```

## Deployment on Render

Recommended backend deployment platform: Render.

Render settings:

| Setting | Value |
|---|---|
| Runtime | Node |
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `npm start` |

Required environment variables:

```env
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_key
CLIENT_URL=https://your-vercel-frontend-url.vercel.app
NODE_ENV=production
```

After deployment, test:

```text
https://your-backend-url.onrender.com/
```

Expected response:

```text
API Running
```

If `/health` route is configured:

```text
https://your-backend-url.onrender.com/health
```

Expected response:

```json
{
  "status": "ok",
  "env": "production"
}
```

## MongoDB Atlas Setup

For production:

1. Create MongoDB Atlas cluster.
2. Create database user.
3. Add network access `0.0.0.0/0`.
4. Copy connection string.
5. Use it as `MONGO_URI` in Render environment variables.

## Security Notes

Implemented security features:

- JWT authentication
- HTTP-only cookie authentication
- Password hashing with bcrypt
- Helmet headers
- CORS configuration
- Rate limiting
- Role-based authorization
- Path validation for file operations
- Repo name validation

Important production notes:

- Use a strong `JWT_SECRET`.
- Never commit `.env` files.
- Use production frontend URL in `CLIENT_URL`.
- Use MongoDB Atlas instead of local MongoDB.
- Review cookie settings for cross-site deployment.
- Persistent filesystem storage is required for long-term Git repo storage.

## Important Deployment Warning

This backend stores Git repositories in the server filesystem under:

```text
backend/repos/
```

On free cloud platforms, local filesystem storage may be temporary. Repositories may disappear after redeploys or server restarts unless persistent disk/storage is configured.

For a production-grade version, use:

- Render persistent disk
- Cloud object storage
- External Git provider integration
- Database-backed metadata with durable repo storage

## Work Completed on Backend

- Express API setup
- MongoDB connection
- User auth with JWT
- Repository CRUD
- Owner/collaborator/viewer permissions
- Git repository initialization
- File explorer APIs
- File upload APIs
- Save file with commit message
- Commit history
- Branch creation/switch/merge
- PR creation/list/detail/merge
- Issue creation/list/comments/close/reopen
- Activity logs
- Notification system
- Socket.io realtime events
- Collaborator invitation flow
- Repo delete cascade
- Repo archive support
- Pagination utilities
- Repository lock utility
- Backend deployment setup

## Future Improvements

- Add automated tests
- Add refresh token flow
- Add persistent repo storage
- Add branch protection
- Add CI/checks for pull requests
- Add advanced review approval rules
- Add organization/team support
- Add email notifications
- Add audit logs for security-sensitive actions
