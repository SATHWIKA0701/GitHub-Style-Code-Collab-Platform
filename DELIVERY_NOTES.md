# code-collab-platform delivery

## Backend analysis
- Existing backend had working auth, repo, issue, PR, review comment, notification, activity, and git branch/commit APIs.
- Major gaps for a GitHub-like frontend were file browsing/editing/upload, richer repo metadata, populated user references, PR detail fetch, user search for collaborator invites, and profile/settings update endpoints.
- Existing frontend was still the default Vite starter and not connected to backend at all.

## Route-by-route frontend mapping
- `POST /auth/register` -> Register page
- `POST /auth/login` -> Login page
- `POST /auth/logout` -> Topbar logout
- `GET /auth/profile` -> session bootstrap, profile page, settings page
- `PUT /auth/profile` -> settings page profile/password update
- `GET /auth/users/search` -> repo settings collaborator invite flow
- `GET /repos` -> dashboard, repositories page
- `POST /repos` -> create repository flow
- `GET /repos/:id` -> repository banner + settings data
- `POST /repos/:id/collaborators` -> invite/update collaborators
- `GET /repos/:id/issues` -> issues page
- `POST /repos/:id/issues` -> create issue
- `GET /issues/:id/comments` -> issue detail side panel
- `POST /issues/:id/comments` -> issue comments
- `PUT /issues/:id/close` -> close issue
- `GET /api/repos/:id/activity` -> insights/activity page
- `GET /api/notifications` -> notifications page + dashboard
- `PATCH /api/notifications/:notificationId/read` -> notifications page
- `POST /api/pr` -> create PR modal
- `GET /api/pr/repo/:repoName` -> PR list page
- `GET /api/pr/item/:prId` -> PR detail page
- `PUT /api/pr/:prId/merge` -> PR merge action
- `GET /api/review/:prId` -> PR comments panel
- `POST /api/review/comment` -> add line/review comment
- `POST /api/git/commit` -> commit actions
- `GET /api/git/repos/:repoName/commits` -> commits page
- `POST /api/git/branch` -> create branch
- `POST /api/git/checkout` -> checkout branch
- `POST /api/git/merge` -> merge branch action
- `GET /api/git/diff` -> PR diff preview
- `GET /api/git/branches/:repoName` -> branch manager
- `GET /api/git/graph/:repoName` -> activity graph page
- `GET /api/git/files/:repoName` -> file explorer tree/file open
- `PUT /api/git/files` -> save file content
- `POST /api/git/files/upload` -> upload files from local system
- `POST /api/git/files/folder` -> create folder
- `DELETE /api/git/files` -> delete file/folder

## Exact backend changes included
- Added repo metadata: `description`, `visibility`, `defaultBranch`, unique repo name.
- Added safe profile endpoints and user search endpoints.
- Added richer populated responses for repositories, issues, comments, and PRs.
- Added PR detail endpoint.
- Added repository filesystem endpoints for listing, reading, writing, uploading, creating folders, deleting paths.
- Improved git initialization with main branch + initial commit + local git identity config.
- Added `.env.example` files and removed uploaded `.env` secret from the delivery package.

## Frontend architecture
- React + React Router app shell
- Auth context for session bootstrap
- App context for toast notifications and shared repo state
- API service layer with axios and cookie/token support
- Protected routes
- Reusable modal and form-field components
- Monaco editor file editing experience
- Responsive GitHub-inspired dark UI

## Run locally
### Backend
1. `cd backend`
2. `cp .env.example .env`
3. Fill `MONGO_URI` and `JWT_SECRET`
4. `npm install`
5. `npm run dev`

### Frontend
1. `cd frontend`
2. `cp .env.example .env`
3. `npm install`
4. `npm run dev`

## Production notes
- Build frontend with `npm run build`
- Serve frontend from Vercel/Netlify and backend from Render/Railway/Fly/VM
- Set `CLIENT_URL` on backend to the deployed frontend origin
- Use a managed MongoDB instance
- Persist backend `repos/` storage on a writable volume

## Validation note
- Source code was fully rewritten and wired around the uploaded backend contract.
- In this environment, final Vite build validation could not be completed because the uploaded `node_modules` snapshot was missing an optional native Rolldown binding; reinstalling dependencies on your machine resolves that.
