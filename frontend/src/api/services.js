import http from './http';

export const authApi = {
  register: (payload) => http.post('/auth/register', payload).then((r) => r.data),
  login: (payload) => http.post('/auth/login', payload).then((r) => r.data),
  logout: () => http.post('/auth/logout').then((r) => r.data),
  profile: () => http.get('/auth/profile').then((r) => r.data),
  updateProfile: (payload) => http.put('/auth/profile', payload).then((r) => r.data),
  searchUsers: (q) => http.get(`/auth/users/search?q=${encodeURIComponent(q)}`).then((r) => r.data),
};

export const repoApi = {
  list: () => http.get('/repos').then((r) => r.data),
  create: (payload) => http.post('/repos', payload).then((r) => r.data),
  detail: (id) => http.get(`/repos/${id}`).then((r) => r.data),
  addCollaborator: (id, payload) => http.post(`/repos/${id}/collaborators`, payload).then((r) => r.data),
  issues: (id) => http.get(`/repos/${id}/issues`).then((r) => r.data),
  createIssue: (id, payload) => http.post(`/repos/${id}/issues`, payload).then((r) => r.data),
  activity: (id) => http.get(`/api/repos/${id}/activity`).then((r) => r.data),
};

export const issueApi = {
  comments: (issueId) => http.get(`/issues/${issueId}/comments`).then((r) => r.data),
  addComment: (issueId, payload) => http.post(`/issues/${issueId}/comments`, payload).then((r) => r.data),
  close: (issueId) => http.put(`/issues/${issueId}/close`).then((r) => r.data),
};

export const prApi = {
  list: (repoName) => http.get(`/api/pr/repo/${repoName}`).then((r) => r.data),
  detail: (prId) => http.get(`/api/pr/item/${prId}`).then((r) => r.data),
  create: (payload) => http.post('/api/pr', payload).then((r) => r.data),
  merge: (prId) => http.put(`/api/pr/${prId}/merge`).then((r) => r.data),
  comments: (prId) => http.get(`/api/review/${prId}`).then((r) => r.data),
  addComment: (payload) => http.post('/api/review/comment', payload).then((r) => r.data),
  diff: (repoName, sourceBranch, targetBranch) =>
    http
      .get(`/api/git/diff?repoName=${encodeURIComponent(repoName)}&sourceBranch=${encodeURIComponent(sourceBranch)}&targetBranch=${encodeURIComponent(targetBranch)}`)
      .then((r) => r.data),
};

export const gitApi = {
  commits: (repoName) => http.get(`/api/git/repos/${repoName}/commits`).then((r) => r.data),
  branches: (repoName) => http.get(`/api/git/branches/${repoName}`).then((r) => r.data),
  graph: (repoName) => http.get(`/api/git/graph/${repoName}`).then((r) => r.data),
  createBranch: (payload) => http.post('/api/git/branch', payload).then((r) => r.data),
  switchBranch: (payload) => http.post('/api/git/checkout', payload).then((r) => r.data),
  mergeBranch: (payload) => http.post('/api/git/merge', payload).then((r) => r.data),
  commit: (payload) => http.post('/api/git/commit', payload).then((r) => r.data),
  files: (repoName, path = '') => http.get(`/api/git/files/${repoName}?path=${encodeURIComponent(path)}`).then((r) => r.data),
  saveFile: (payload) => http.put('/api/git/files', payload).then((r) => r.data),
  createFolder: (payload) => http.post('/api/git/files/folder', payload).then((r) => r.data),
  deletePath: (payload) => http.delete('/api/git/files', { data: payload }).then((r) => r.data),
  uploadFiles: async ({ repoName, directory = '', files }) => {
    const form = new FormData();
    form.append('repoName', repoName);
    form.append('directory', directory);
    Array.from(files).forEach((file) => form.append('files', file));
    const response = await http.post('/api/git/files/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export const notificationApi = {
  list: () => http.get('/api/notifications').then((r) => r.data),
  read: (id) => http.patch(`/api/notifications/${id}/read`).then((r) => r.data),
};
