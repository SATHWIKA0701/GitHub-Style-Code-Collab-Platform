export const cn = (...parts) => parts.filter(Boolean).join(' ');
export const formatDate = (value) => (value ? new Date(value).toLocaleString() : '');
export const getRoleBadge = (role) => ({ owner: 'Owner', collaborator: 'Write', viewer: 'Read' }[role] || role);
export const getInitials = (name = '') => name.slice(0, 2).toUpperCase();
export const toRepoPath = (path) => (path ? `/${path}` : '/');
