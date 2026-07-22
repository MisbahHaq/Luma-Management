import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import { CheckSquare, ChevronRight } from 'lucide-react';
import client from '../api/client';
import type { Project, Task } from '../types/types';

export default function TasksPage() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [loadingTasks, setLoadingTasks] = useState(false);

    useEffect(() => {
        client.get<Project[]>('/projects')
            .then(({ data }) => { setProjects(data); setLoadingProjects(false); })
            .catch(() => setLoadingProjects(false));
    }, []);

    const openProject = (project: Project) => {
        setSelectedProject(project);
        setLoadingTasks(true);
        client.get<Task[]>(`/tasks?projectId=${project.id}`)
            .then(({ data }) => { setTasks(data); setLoadingTasks(false); })
            .catch(() => setLoadingTasks(false));
    };

    return (
        <AppShell breadcrumb={<>Workspace <span className="text-text-muted">/</span> <span>Tasks</span></>} title="Tasks">
            <div className="mb-5">
                <h2 className="text-sm font-medium text-text-primary">Task Explorer</h2>
                <p className="text-xs text-text-muted mt-0.5">{projects.length} projects available</p>
            </div>

            {!selectedProject ? (
                <>
                    {loadingProjects ? (
                        <p className="text-xs text-text-muted">Loading...</p>
                    ) : projects.length === 0 ? (
                        <div className="border border-border-subtle rounded-md bg-surface-1 py-10 text-center">
                            <p className="text-xs text-text-muted">No projects found.</p>
                        </div>
                    ) : (
                        <div className="border border-border-subtle rounded-md overflow-hidden bg-surface-1">
                            {projects.map((p) => (
                                <div
                                    key={p.id}
                                    onClick={() => openProject(p)}
                                    className="group flex items-center gap-3 px-3 py-2.5 border-b border-border-subtle last:border-0 hover:bg-surface-2/50 cursor-pointer transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-md bg-surface-2 flex items-center justify-center text-text-muted flex-shrink-0">
                                        <CheckSquare className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-text-primary truncate">{p.name}</div>
                                        <div className="text-[11px] text-text-muted mt-0.5 truncate">{p.description ?? 'No description'}</div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <>
                    <button
                        onClick={() => { setSelectedProject(null); setTasks([]); }}
                        className="text-xs text-accent hover:text-accent/80 transition-colors mb-3"
                    >
                        &larr; Back to projects
                    </button>

                    <div className="border border-border-subtle rounded-md overflow-hidden bg-surface-1">
                        {loadingTasks ? (
                            <div className="px-3 py-8 text-center">
                                <p className="text-xs text-text-muted">Loading tasks...</p>
                            </div>
                        ) : tasks.length === 0 ? (
                            <div className="px-3 py-8 text-center">
                                <p className="text-xs text-text-muted">No tasks in this project.</p>
                            </div>
                        ) : (
                            tasks.map((t) => (
                                <div
                                    key={t.id}
                                    onClick={() => navigate(`/projects/${t.projectId}`)}
                                    className="flex items-center gap-3 px-3 py-2.5 border-b border-border-subtle last:border-0 hover:bg-surface-2/50 cursor-pointer transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-mono text-text-muted tabular-nums">{t.issueKey}</span>
                                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${t.status === 'Done' ? 'bg-emerald-500/10 text-emerald-400' : t.status === 'InProgress' ? 'bg-accent-soft text-accent' : 'bg-surface-2 text-text-secondary'}`}>
                                                {t.status === 'ToDo' ? 'To Do' : t.status === 'InProgress' ? 'In Progress' : 'Done'}
                                            </span>
                                        </div>
                                        <div className="text-sm text-text-primary truncate mt-0.5">{t.title}</div>
                                    </div>
                                    {t.assigneeFullName && (
                                        <span className="text-[11px] text-text-muted truncate max-w-[120px] hidden sm:block">{t.assigneeFullName}</span>
                                    )}
                                    <span className={`text-[11px] font-medium hidden sm:block ${t.priority === 'Critical' ? 'text-red-400' : t.priority === 'High' ? 'text-orange-400' : 'text-text-muted'}`}>
                                        {t.priority}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </AppShell>
    );
}
