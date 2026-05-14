import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { RepositoriesPage } from './pages/RepositoriesPage';
import { NewRepositoryPage } from './pages/NewRepositoryPage';
import { RepositoryPage } from './pages/RepositoryPage';
import { FileExplorerPage } from './pages/FileExplorerPage';
import { CommitsPage } from './pages/CommitsPage';
import { BranchesPage } from './pages/BranchesPage';
import { IssuesPage } from './pages/IssuesPage';
import { PullRequestsPage } from './pages/PullRequestsPage';
import { PullRequestDetailPage } from './pages/PullRequestDetailPage';
import { ActivityPage } from './pages/ActivityPage';
import { RepoSettingsPage } from './pages/RepoSettingsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="repositories" element={<RepositoriesPage />} />
        <Route path="repositories/new" element={<NewRepositoryPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
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
  );
}

export default App;
