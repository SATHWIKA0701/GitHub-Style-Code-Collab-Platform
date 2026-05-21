// App.jsx
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';

const LandingPage = lazy(() =>
  import('./pages/LandingPage').then((m) => ({ default: m.LandingPage }))
);

const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const ForgotPasswordPage = lazy(() =>
  import('./pages/ForgotPasswordPage').then((m) => ({
    default: m.ForgotPasswordPage,
  }))
);

const RegisterPage = lazy(() =>
  import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage }))
);

const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);

const RepositoriesPage = lazy(() =>
  import('./pages/RepositoriesPage').then((m) => ({ default: m.RepositoriesPage }))
);

const NewRepositoryPage = lazy(() =>
  import('./pages/NewRepositoryPage').then((m) => ({ default: m.NewRepositoryPage }))
);

const RepositoryPage = lazy(() =>
  import('./pages/RepositoryPage').then((m) => ({ default: m.RepositoryPage }))
);

const FileExplorerPage = lazy(() =>
  import('./pages/FileExplorerPage').then((m) => ({ default: m.FileExplorerPage }))
);

const CommitsPage = lazy(() =>
  import('./pages/CommitsPage').then((m) => ({ default: m.CommitsPage }))
);

const BranchesPage = lazy(() =>
  import('./pages/BranchesPage').then((m) => ({ default: m.BranchesPage }))
);

const IssuesPage = lazy(() =>
  import('./pages/IssuesPage').then((m) => ({ default: m.IssuesPage }))
);

const PullRequestsPage = lazy(() =>
  import('./pages/PullRequestsPage').then((m) => ({ default: m.PullRequestsPage }))
);

const PullRequestDetailPage = lazy(() =>
  import('./pages/PullRequestDetailPage').then((m) => ({ default: m.PullRequestDetailPage }))
);

const ActivityPage = lazy(() =>
  import('./pages/ActivityPage').then((m) => ({ default: m.ActivityPage }))
);

const RepoSettingsPage = lazy(() =>
  import('./pages/RepoSettingsPage').then((m) => ({ default: m.RepoSettingsPage }))
);

const NotificationsPage = lazy(() =>
  import('./pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage }))
);

const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage }))
);

const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

const PageLoader = () => (
  <div className="empty-card">
    Loading page...
  </div>
);

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="repositories" element={<RepositoriesPage />} />
          <Route path="repositories/new" element={<NewRepositoryPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<Navigate replace to="/profile" />} />
          <Route path="pulls/:prId" element={<PullRequestDetailPage />} />

          <Route path="repos/:repoId" element={<RepositoryPage />}>
            <Route path="files" element={<FileExplorerPage />} />
            <Route path="commits" element={<CommitsPage />} />
            <Route path="branches" element={<BranchesPage />} />
            <Route path="issues" element={<IssuesPage />} />
            <Route path="pulls" element={<PullRequestsPage />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="settings" element={<RepoSettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;