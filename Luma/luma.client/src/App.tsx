import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import type { ReactNode } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import ModernDashboard from './pages/ModernDashboard';
import ProjectDetail from './pages/ProjectDetail';
import Reports from './pages/Reports';
import ReportsPage from './pages/ReportsPage';
import SprintsPage from './pages/SprintsPage';
import TasksPage from './pages/TasksPage';
import Placeholder from './pages/Placeholder';
import PublicPortal from './pages/PublicPortal';

function ProtectedRoute({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
    return (
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
                        <Placeholder
                            title="Members"
                            hint="Open a project and use the Members button in its header to manage project members."
                        />
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
            <Route path="/portal/:projectId" element={<PublicPortal />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
