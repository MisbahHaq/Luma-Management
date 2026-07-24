import { useEffect, useState, useCallback, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder, Plus, X, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import AppShell from '../components/AppShell';
import { mockProjects, mockTasks } from '../api/mock';
import type { Project, Task } from '../types';

interface ProjectStat {
    project: Project;
    taskCount: number;
    completion: number;
}

export default function Dashboard() {
    const { user } = useAuth();
    const { currentWorkspace, workspaces, switchWorkspace } = useWorkspace();
    const navigate = useNavigate();

    const [stats, setStats] = useState<ProjectStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
    const [projectName, setProjectName] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [workspaceName, setWorkspaceName] = useState('');
    const [saving, setSaving] = useState(false);

    const canWrite = user?.role === 'Admin' || user?.role === 'Member';

    const computeStats = (project: Project, tasks: Task[]): ProjectStat => {
        const total = tasks.length;
        const done = tasks.filter((t) => t.status === 'Done').length;
        const completion = total === 0 ? 0 : Math.round((done / total) * 100);
        return { project, taskCount: total, completion };
    };

    const loadProjects = useCallback(() => {
        setLoading(true);
        setTimeout(() => {
            const filtered = currentWorkspace
                ? mockProjects.filter((p) => p.workspaceId === currentWorkspace.id)
                : [];
            const enriched = filtered.map((p) => computeStats(p, mockTasks.filter((t) => t.projectId === p.id)));
            setStats(enriched);
            setLoading(false);
        }, 300);
    }, [currentWorkspace]);

    useEffect(() => {
        void loadProjects();
    }, [loadProjects]);

    const handleCreateProject = async (e: FormEvent) => {
        e.preventDefault();
        if (!projectName.trim() || !currentWorkspace?.id) return;
        setSaving(true);
        await new Promise((r) => setTimeout(r, 300));
        setProjectName('');
        setProjectDescription('');
        setShowProjectModal(false);
        setSaving(false);
    };

    const handleCreateWorkspace = async (e: FormEvent) => {
        e.preventDefault();
        if (!workspaceName.trim()) return;
        setSaving(true);
        await new Promise((r) => setTimeout(r, 300));
        setWorkspaceName('');
        setShowWorkspaceModal(false);
        setSaving(false);
    };

    return (
        <AppShell breadcrumb={<span>Workspace</span>} title="Projects">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-base font-medium text-text-primary">Projects</h1>
                    <p className="text-xs text-text-muted mt-0.5">
                        {stats.length} project{stats.length === 1 ? '' : 's'} in {currentWorkspace?.name ?? 'your workspace'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {workspaces.length > 1 && (
                        <select
                            className="bg-surface-1 border border-border-subtle rounded px-2.5 py-1.5 text-xs text-text-primary"
                            value={currentWorkspace?.id ?? ''}
                            onChange={(e) => {
                                const id = e.target.value;
                                if (id) {
                                    switchWorkspace(id);
                                }
                            }}
                        >
                            {workspaces.map((ws) => (
                                <option key={ws.id} value={ws.id}>{ws.name}</option>
                            ))}
                        </select>
                    )}
                    {canWrite && (
                        <button
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-accent text-white hover:bg-accent/90 transition-colors"
                            onClick={() => setShowProjectModal(true)}
                        >
                            <Plus className="w-3.5 h-3.5" />
                            New Project
                        </button>
                    )}
                </div>
            </div>

            {!currentWorkspace ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Folder className="w-10 h-10 text-text-muted mb-3" />
                    <p className="text-sm text-text-secondary mb-1">Create a workspace first</p>
                    <p className="text-xs text-text-muted mb-4">You need a workspace before you can create projects.</p>
                    {canWrite && (
                        <button
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-accent text-white hover:bg-accent/90 transition-colors"
                            onClick={() => setShowWorkspaceModal(true)}
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Create Workspace
                        </button>
                    )}
                </div>
            ) : loading ? (
                <p className="text-text-muted text-xs">Loading...</p>
            ) : stats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Folder className="w-10 h-10 text-text-muted mb-3" />
                    <p className="text-sm text-text-secondary mb-1">No projects yet</p>
                    <p className="text-xs text-text-muted mb-4">Create your first project to get started.</p>
                    {canWrite && (
                        <button
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-accent text-white hover:bg-accent/90 transition-colors"
                            onClick={() => setShowProjectModal(true)}
                        >
                            <Plus className="w-3.5 h-3.5" />
                            New Project
                        </button>
                    )}
                </div>
            ) : (
                <div className="border border-border-subtle rounded overflow-hidden bg-surface-1">
                    {stats.map((s) => (
                        <div
                            key={s.project.id}
                            className="group flex items-center gap-3 px-3 py-2.5 border-b border-border-subtle last:border-0 hover:bg-surface-2/50 cursor-pointer transition-colors"
                            onClick={() => navigate(`/projects/${s.project.id}`)}
                        >
                            <div className="w-8 h-8 rounded bg-surface-2 flex items-center justify-center text-text-muted flex-shrink-0">
                                <Folder className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-text-primary truncate">{s.project.name}</div>
                                <div className="text-[11px] text-text-muted mt-0.5">
                                    {s.taskCount} tasks · {s.completion}% complete
                                </div>
                            </div>
                            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                                <div className="w-24 h-1 bg-surface-2 rounded overflow-hidden">
                                    <div className="h-full bg-accent rounded" style={{ width: `${s.completion}%` }} />
                                </div>
                                <span className="text-[10px] font-mono tabular-nums text-text-muted w-[32px] text-right">{s.completion}%</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </div>
                    ))}
                </div>
            )}

            {showProjectModal && currentWorkspace && (
                <div className="modal-overlay" onClick={() => setShowProjectModal(false)}>
                    <form
                        className="bg-surface-1 border border-border-subtle rounded animate-in fade-in slide-up duration-150"
                        onClick={(e) => e.stopPropagation()}
                        onSubmit={handleCreateProject}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-text-primary">New project</h3>
                            <button type="button" className="p-1 rounded hover:bg-surface-2 text-text-muted" onClick={() => setShowProjectModal(false)}>
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <label className="block mb-3">
                            <span className="block text-xs font-medium text-text-secondary mb-1">Name</span>
                            <input
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                placeholder="Project name"
                                autoFocus
                                className="w-full bg-surface-2 border border-border-subtle rounded px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                            />
                        </label>
                        <label className="block mb-4">
                            <span className="block text-xs font-medium text-text-secondary mb-1">Description</span>
                            <textarea
                                value={projectDescription}
                                onChange={(e) => setProjectDescription(e.target.value)}
                                placeholder="Optional description"
                                rows={3}
                                className="w-full bg-surface-2 border border-border-subtle rounded px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                            />
                        </label>
                        <div className="flex items-center justify-end gap-2">
                            <button
                                type="button"
                                className="px-3 py-1.5 text-xs font-medium rounded border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-default transition-colors"
                                onClick={() => setShowProjectModal(false)}
                            >
                                Cancel
                            </button>
                            <button type="submit" className="px-3 py-1.5 text-xs font-medium rounded bg-accent text-white hover:bg-accent/90 transition-colors" disabled={saving}>
                                {saving ? 'Saving...' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {showWorkspaceModal && (
                <div className="modal-overlay" onClick={() => setShowWorkspaceModal(false)}>
                    <form
                        className="bg-surface-1 border border-border-subtle rounded animate-in fade-in slide-up duration-150"
                        onClick={(e) => e.stopPropagation()}
                        onSubmit={handleCreateWorkspace}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-text-primary">Create workspace</h3>
                            <button type="button" className="p-1 rounded hover:bg-surface-2 text-text-muted" onClick={() => setShowWorkspaceModal(false)}>
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-xs text-text-muted mb-4">A workspace is where your projects live. You'll be the owner.</p>
                        <label className="block mb-4">
                            <span className="block text-xs font-medium text-text-secondary mb-1">Workspace name</span>
                            <input
                                value={workspaceName}
                                onChange={(e) => setWorkspaceName(e.target.value)}
                                placeholder="e.g. Acme Corp"
                                autoFocus
                                className="w-full bg-surface-2 border border-border-subtle rounded px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                            />
                        </label>
                        <div className="flex items-center justify-end gap-2">
                            <button
                                type="button"
                                className="px-3 py-1.5 text-xs font-medium rounded border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-default transition-colors"
                                onClick={() => setShowWorkspaceModal(false)}
                            >
                                Cancel
                            </button>
                            <button type="submit" className="px-3 py-1.5 text-xs font-medium rounded bg-accent text-white hover:bg-accent/90 transition-colors" disabled={saving || !workspaceName.trim()}>
                                {saving ? 'Creating...' : 'Create workspace'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </AppShell>
    );
}
