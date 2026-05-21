// services.js
import http from './http';

export const authApi = {
  register: (payload) => http.post('/auth/register', payload).then((r) => r.data),
  login: (payload) => http.post('/auth/login', payload).then((r) => r.data),
  forgotPassword: (payload) =>
  http.post('/auth/forgot-password', payload).then((r) => r.data),
  logout: () => http.post('/auth/logout').then((r) => r.data),
  profile: () => http.get('/auth/profile').then((r) => r.data),
  updateProfile: (payload) => http.put('/auth/profile', payload).then((r) => r.data),
  searchUsers: (q) =>
    http.get(`/auth/users/search?q=${encodeURIComponent(q)}`).then((r) => r.data),
};

export const repoApi = {
  list: (page = 1, limit = 20) => http.get(`/repos?page=${page}&limit=${limit}`).then((r) => r.data),
  create: (payload) => http.post('/repos', payload).then((r) => r.data),
  detail: (id) => http.get(`/repos/${id}`).then((r) => r.data),
  addCollaborator: (id, payload) => http.post(`/repos/${id}/collaborators`, payload).then((r) => r.data),
  removeCollaborator: (id, userId) => http.delete(`/repos/${id}/collaborators/${userId}`).then((r) => r.data),
  updateCollaboratorRole: (id, userId, payload) => http.put(`/repos/${id}/collaborators/${userId}`, payload).then((r) => r.data),
  issues: (id, params) => {
    const searchParams = new URLSearchParams(params);
    return http.get(`/repos/${id}/issues?${searchParams.toString()}`).then((r) => r.data);
  },
  createIssue: (id, payload) => http.post(`/repos/${id}/issues`, payload).then((r) => r.data),
  activity: (id, page = 1, limit = 20) => http.get(`/api/repos/${id}/activity?page=${page}&limit=${limit}`).then((r) => r.data),
  archive: (id) => http.put(`/repos/${id}/archive`).then((r) => r.data),
  labels: (id) => http.get(`/repos/${id}/labels`).then((r) => r.data),
  createLabel: (id, payload) => http.post(`/repos/${id}/labels`, payload).then((r) => r.data),
  deleteLabel: (id, labelId) => http.delete(`/repos/${id}/labels/${labelId}`).then((r) => r.data),
};

export const issueApi = {
  comments: (issueId, page = 1, limit = 20) => http.get(`/issues/${issueId}/comments?page=${page}&limit=${limit}`).then((r) => r.data),
  addComment: (issueId, payload) => http.post(`/issues/${issueId}/comments`, payload).then((r) => r.data),
  close: (issueId) => http.put(`/issues/${issueId}/close`).then((r) => r.data),
  reopen: (issueId) => http.put(`/issues/${issueId}/reopen`).then((r) => r.data),
  update: (issueId, payload) => http.put(`/issues/${issueId}`, payload).then((r) => r.data),
  deleteComment: (issueId, commentId) => http.delete(`/issues/${issueId}/comments/${commentId}`).then((r) => r.data),
};

export const prApi = {
  list: (repoName) => http.get(`/api/pr/repo/${repoName}`).then((r) => r.data),
  detail: (prId) => http.get(`/api/pr/item/${prId}`).then((r) => r.data),
  create: (payload) => http.post('/api/pr', payload).then((r) => r.data),
  merge: (prId) => http.put(`/api/pr/${prId}/merge`).then((r) => r.data),
  close: (prId) => http.put(`/api/pr/${prId}/close`).then((r) => r.data),
  reopen: (prId) => http.put(`/api/pr/${prId}/reopen`).then((r) => r.data),
  comments: (prId) => http.get(`/api/review/${prId}`).then((r) => r.data),
  addComment: (payload) => http.post('/api/review/comment', payload).then((r) => r.data),
  diff: (repoName, sourceBranch, targetBranch) =>
    http
      .get(
        `/api/git/diff?repoName=${encodeURIComponent(
          repoName
        )}&sourceBranch=${encodeURIComponent(
          sourceBranch
        )}&targetBranch=${encodeURIComponent(targetBranch)}`
      )
      .then((r) => r.data),
};

export const gitApi = {
  commits: (repoName, page = 1, limit = 20) => http.get(`/api/git/repos/${repoName}/commits?page=${page}&limit=${limit}`).then((r) => r.data),
  commitsByBranch: (repoName, branch) =>
    http
      .get(`/api/git/repos/${repoName}/commits?branch=${encodeURIComponent(branch)}`)
      .then((r) => r.data),
  structuredCommits: (repoName) =>
    http.get(`/api/git/repos/${repoName}/structured-commits`).then((r) => r.data),
  commitDetails: (repoName, sha) =>
    http.get(`/api/git/repos/${repoName}/commits/${sha}`).then((r) => r.data),
  branches: (repoName) => http.get(`/api/git/branches/${repoName}`).then((r) => r.data),
  graph: (repoName) => http.get(`/api/git/graph/${repoName}`).then((r) => r.data),
  createBranch: (payload) => http.post('/api/git/branch', payload).then((r) => r.data),
  switchBranch: (payload) => http.post('/api/git/checkout', payload).then((r) => r.data),
  mergeBranch: (payload) => http.post('/api/git/merge', payload).then((r) => r.data),
  commit: (payload) => http.post('/api/git/commit', payload).then((r) => r.data),
  files: (repoName, path = '') => http.get(`/api/git/files/${repoName}?path=${encodeURIComponent(path)}`).then((r) => r.data),
  saveFile: (payload) => http.put('/api/git/files', payload).then((r) => r.data),
  saveFileWithCommit: (payload) => http.post('/api/git/files/commit', payload).then((r) => r.data),
  createFolder: (payload) => http.post('/api/git/files/folder', payload).then((r) => r.data),
  deletePath: (payload) => http.delete('/api/git/files', { data: payload }).then((r) => r.data),
  uploadFiles: async ({ repoName, directory = '', files }) => {
    const form = new FormData();
    form.append('repoName', repoName);
    form.append('directory', directory);
    Array.from(files).forEach((file) => {
      form.append('files', file);
    });
    const response = await http.post('/api/git/files/upload', form, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export const notificationApi = {
  list: (page = 1, limit = 20) =>
    http.get(`/api/notifications?page=${page}&limit=${limit}`).then((r) => r.data),
  count: () => http.get("/api/notifications/count").then((r) => r.data),
  read: (id) => http.patch(`/api/notifications/${id}/read`).then((r) => r.data),
  readAll: () => http.put("/api/notifications/read-all").then((r) => r.data),
};
export const invitationApi = {
  list: () =>
    http.get('/api/invitations').then((r) => r.data),

  accept: (id) =>
    http.put(`/api/invitations/${id}/accept`).then((r) => r.data),

  decline: (id) =>
    http.put(`/api/invitations/${id}/decline`).then((r) => r.data),

  send: (repoId, payload) =>
    http.post(`/api/repos/${repoId}/invitations`, payload).then((r) => r.data),
};
