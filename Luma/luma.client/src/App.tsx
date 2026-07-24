import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import type { ReactNode } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import ModernDashboard from './pages/ModernDashboard';
import MyTasksPage from './pages/MyTasksPage';
import ProjectDetail from './pages/ProjectDetail';
import Reports from './pages/Reports';
import ReportsPage from './pages/ReportsPage';
import SprintsPage from './pages/SprintsPage';
import TasksPage from './pages/TasksPage';
import Placeholder from './pages/Placeholder';
import MembersPage from './pages/MembersPage';
import PublicPortal from './pages/PublicPortal';

function ProtectedRoute({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
    return (
        <WorkspaceProvider>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/register" element={<Register />} />
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <ModernDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/projects"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/my-tasks"
                    element={
                        <ProtectedRoute>
                            <MyTasksPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/projects/:id"
                    element={
                        <ProtectedRoute>
                            <ProjectDetail />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/reports"
                    element={
                        <ProtectedRoute>
                            <ReportsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/reports/:projectId"
                    element={
                        <ProtectedRoute>
                            <Reports />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/sprints"
                    element={
                        <ProtectedRoute>
                            <SprintsPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/tasks"
                    element={
                        <ProtectedRoute>
                            <TasksPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/members"
                    element={
                        <ProtectedRoute>
                            <MembersPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/settings"
                    element={
                        <ProtectedRoute>
                            <Placeholder
                                title="Settings"
                                hint="Workspace settings are not available in this build."
                            />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/workspaces/:id/settings"
                    element={
                        <ProtectedRoute>
                            <Placeholder
                                title="Workspace Settings"
                                hint="Workspace settings page is under construction."
                            />
                        </ProtectedRoute>
                    }
                />
                <Route path="/portal/:projectId" element={<PublicPortal />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </WorkspaceProvider>
    );
}
