import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import type { ReactNode } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';
import Reports from './pages/Reports';
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
            <Route path="/register" element={<Register />} />
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <Dashboard />
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
                        <Placeholder
                            title="Reports"
                            hint="Open a project and choose Reports from its header to see health, burndown, and velocity."
                        />
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
                        <Placeholder
                            title="Sprints"
                            hint="Open a project and switch to the Plan view to manage sprints, dependencies, and time tracking."
                        />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/tasks"
                element={
                    <ProtectedRoute>
                        <Placeholder
                            title="Tasks"
                            hint="Open a project to see its issue list grouped by Epic."
                        />
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
