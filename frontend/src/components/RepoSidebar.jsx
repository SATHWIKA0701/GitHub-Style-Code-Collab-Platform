import { NavLink } from 'react-router-dom';

export const RepoSidebar = ({ repoId }) => {
  const items = [
    ['Code', `/repos/${repoId}`],
    ['Issues', `/repos/${repoId}/issues`],
    ['Pull requests', `/repos/${repoId}/pulls`],
    ['Insights', `/repos/${repoId}/activity`],
    ['Settings', `/repos/${repoId}/settings`],
  ];
  return (
    <aside className="repo-sidebar card">
      {items.map(([label, href]) => (
        <NavLink key={label} to={href} end className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}>
          {label}
        </NavLink>
      ))}
    </aside>
  );
};
