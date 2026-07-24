import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, UserPlus, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AppShell from '../components/AppShell';
import { mockTasks, mockProjectMembers, mockComments, mockTimeLogs, mockUsers } from '../api/mock';
import { Badge } from '../components/primitives/Badge';
import { Button } from '../components/primitives/Button';
import { Avatar } from '../components/primitives/Avatar';
import type { Task, ProjectMemberSummary, ProjectRole } from '../types';
import { STATUS_LABELS, PRIORITY_LABELS, TASK_TYPE_LABELS } from '../api/mock';

type ViewMode = 'list' | 'kanban' | 'plan';

export default function ProjectDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [view, setView] = useState<ViewMode>('list');
    const [showMembers, setShowMembers] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [newTitle, setNewTitle] = useState('');
    const [newPriority, setNewPriority] = useState<Task['priority']>('Medium');
    const [newType, setNewType] = useState<Task['type']>('Task');
    const [newMemberId, setNewMemberId] = useState('');
    const [localTasks, setLocalTasks] = useState<Task[]>([]);
    const [localMembers, setLocalMembers] = useState<ProjectMemberSummary[]>([]);

    const project = id ? {
        id,
        name: id === 'proj-1' ? 'Website Redesign' : id === 'proj-2' ? 'Mobile App v2' : 'API Integration',
        description: 'Demo project',
        issueKeyPrefix: id === 'proj-1' ? 'WEB' : id === 'proj-2' ? 'MOB' : 'API',
        createdAt: '', createdByUserId: '', createdByUserFullName: '', workspaceId: null, workspaceName: null, workspaceSlug: null
    } : null;

    const isOwner = localMembers.some((m) => m.id === user?.id && m.projectRole === 'Owner');
    const canEdit = user?.role === 'Admin' || user?.role === 'Member' || isOwner;

    useEffect(() => {
        if (!id) return;
        setLocalTasks(mockTasks.filter((t) => t.projectId === id));
        setLocalMembers(mockProjectMembers);
    }, [id]);

    const completion = localTasks.length === 0 ? 0 : Math.round((localTasks.filter((t) => t.status === 'Done').length / localTasks.length) * 100);

    const createTask = () => {
        if (!newTitle.trim() || !id) return;
        const newTask: Task = {
            id: `task-${Date.now()}`,
            title: newTitle.trim(),
            description: null,
            status: 'ToDo',
            priority: newPriority,
            type: newType,
            parentTaskId: null,
            dueDate: null,
            projectId: id,
            sprintId: null,
            milestoneId: null,
            assigneeId: null,
            assigneeFullName: null,
            createdAt: new Date().toISOString(),
            issueNumber: localTasks.length + 1,
            issueKey: project?.issueKeyPrefix ? `${project.issueKeyPrefix}-${localTasks.length + 1}` : `TASK-${localTasks.length + 1}`,
        };
        setLocalTasks((prev) => [...prev, newTask]);
        setNewTitle('');
        setShowCreate(false);
    };

    const addMember = () => {
        if (!newMemberId) return;
        const u = mockUsers.find((usr) => usr.id === newMemberId);
        if (!u) return;
        setLocalMembers((prev) => [...prev, { id: u.id, fullName: u.fullName, email: u.email, globalRole: u.role, projectRole: 'Editor' }]);
        setNewMemberId('');
    };

    const removeMember = (userId: string) => {
        setLocalMembers((prev) => prev.filter((m) => m.id !== userId));
    };

    const changeMemberRole = (userId: string, role: ProjectRole) => {
        setLocalMembers((prev) => prev.map((m) => (m.id === userId ? { ...m, projectRole: role } as ProjectMemberSummary : m)));
    };

    const availableUsers = mockUsers.filter((u) => !localMembers.some((m) => m.id === u.id));

    return (
        <AppShell
            breadcrumb={
                <>
                    <span className="crumb-link" onClick={() => navigate('/projects')}>{project?.name ?? 'Workspace'}</span>
                    <span className="crumb-sep">/</span>
                    <span>Projects</span>
                    <span className="crumb-sep">/</span>
                    <span>{project?.name ?? '…'}</span>
                </>
            }
            title={project?.name}
            project={project}
            completion={completion}
        >
            <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-0.5 bg-surface-2 rounded-lg p-0.5">
                    {(['list', 'kanban', 'plan'] as const).map((v) => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${view === v ? 'bg-surface-1 text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
                        >
                            {v === 'list' ? 'List' : v === 'kanban' ? 'Kanban' : 'Plan'}
                        </button>
                    ))}
                    <button
                        onClick={() => setShowMembers((s) => !s)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${showMembers ? 'bg-surface-1 text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
                    >
                        Members ({localMembers.length})
                    </button>
                </div>
                {canEdit && (
                    <Button size="sm" onClick={() => setShowCreate(true)}>
                        <Plus className="w-3.5 h-3.5" />
                        New Task
                    </Button>
                )}
            </div>

            {showMembers && (
                <div className="border border-border-subtle rounded-md overflow-hidden bg-surface-1 mb-4">
                    <div className="flex items-center justify-between px-3 py-2.5 border-b border-border-subtle">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-medium text-text-primary">Project members</h3>
                            <span className="text-[10px] font-mono tabular-nums text-text-muted bg-surface-2 px-1.5 py-0.5 rounded-md">{localMembers.length}</span>
                        </div>
                    </div>
                    {localMembers.length === 0 ? (
                        <div className="px-3 py-8 text-center text-xs text-text-muted">No members yet.</div>
                    ) : (
                        <div>
                            {localMembers.map((m) => (
                                <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 border-b border-border-subtle last:border-0 hover:bg-surface-2/50 transition-colors">
                                    <Avatar name={m.fullName ?? m.email} size="md" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-text-primary truncate">{m.fullName ?? 'Unnamed'}</div>
                                        <div className="text-[11px] text-text-muted truncate">{m.email}</div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {isOwner ? (
                                            <select
                                                value={m.projectRole}
                                                onChange={(e) => changeMemberRole(m.id, e.target.value as ProjectRole)}
                                                className="bg-surface-2 border border-border-subtle rounded-md px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-accent transition-colors cursor-pointer"
                                            >
                                                <option value="Owner">Owner</option>
                                                <option value="Editor">Editor</option>
                                                <option value="Viewer">Viewer</option>
                                            </select>
                                        ) : (
                                            <Badge variant={m.projectRole === 'Owner' ? 'info' : m.projectRole === 'Editor' ? 'default' : 'outline'}>
                                                {m.projectRole}
                                            </Badge>
                                        )}
                                        {canEdit && m.id !== user?.id && (
                                            <button
                                                type="button"
                                                className="p-1 rounded-md hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors"
                                                onClick={() => removeMember(m.id)}
                                                title="Remove member"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {canEdit && availableUsers.length > 0 && (
                        <form onSubmit={(e) => { e.preventDefault(); addMember(); }} className="flex items-center gap-2 px-3 py-2.5 border-t border-border-subtle">
                            <select
                                value={newMemberId}
                                onChange={(e) => setNewMemberId(e.target.value)}
                                className="flex-1 bg-surface-2 border border-border-subtle rounded-md px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent transition-colors cursor-pointer"
                            >
                                <option value="">Add member…</option>
                                {availableUsers.map((u) => (
                                    <option key={u.id} value={u.id}>{u.fullName ?? u.email}</option>
                                ))}
                            </select>
                            <Button type="submit" size="sm" disabled={!newMemberId}>
                                <UserPlus className="w-3.5 h-3.5" />
                                Add
                            </Button>
                        </form>
                    )}
                </div>
            )}

            {view === 'kanban' ? (
                <div className="grid grid-cols-3 gap-3">
                    {(['ToDo', 'InProgress', 'Done'] as const).map((status) => {
                        const tasks = localTasks.filter((t) => t.status === status);
                        return (
                            <div key={status} className="bg-surface-1 border border-border-subtle rounded-md p-2">
                                <div className="text-xs font-medium text-text-secondary mb-2 px-1">{STATUS_LABELS[status]} ({tasks.length})</div>
                                <div className="space-y-2">
                                    {tasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="bg-surface-2 border border-border-subtle rounded-md p-2.5 cursor-pointer hover:border-border-default transition-colors"
                                            onClick={() => setSelectedTask(task)}
                                        >
                                            <div className="text-xs font-medium text-text-primary mb-1">{task.title}</div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-text-muted">{task.issueKey}</span>
                                                <span className="text-[10px] text-text-muted">{PRIORITY_LABELS[task.priority as keyof typeof PRIORITY_LABELS]}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : view === 'list' ? (
                <div className="bg-surface-1 border border-border-subtle rounded-md overflow-hidden">
                    {localTasks.length === 0 ? (
                        <div className="px-3 py-10 text-center text-xs text-text-muted">No tasks yet. Create your first task.</div>
                    ) : (
                        localTasks.map((task) => (
                            <div
                                key={task.id}
                                className="flex items-center gap-3 px-3 py-2.5 border-b border-border-subtle last:border-0 hover:bg-surface-2/50 cursor-pointer transition-colors"
                                onClick={() => setSelectedTask(task)}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-text-primary truncate">{task.title}</div>
                                    <div className="text-[11px] text-text-muted mt-0.5">
                                        {task.issueKey} · {STATUS_LABELS[task.status]} · {PRIORITY_LABELS[task.priority]} · {TASK_TYPE_LABELS[task.type]}
                                    </div>
                                </div>
                                <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                                    <span className="text-[10px] text-text-muted">{task.assigneeFullName ?? 'Unassigned'}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="plan-grid">
                    <div className="bg-surface-1 border border-border-subtle rounded-md p-4">
                        <h3 className="text-sm font-medium text-text-primary mb-3">Gantt Timeline</h3>
                        <div className="space-y-2">
                            {localTasks.map((task) => (
                                <div key={task.id} className="flex items-center gap-3">
                                    <div className="w-32 text-xs text-text-secondary truncate">{task.title}</div>
                                    <div className="flex-1 h-4 bg-surface-2 rounded overflow-hidden relative">
                                        <div
                                            className="h-full bg-accent rounded"
                                            style={{ width: `${Math.min(100, (localTasks.indexOf(task) + 1) * 15)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-surface-1 border border-border-subtle rounded-md p-4">
                            <h3 className="text-sm font-medium text-text-primary mb-2">Sprints</h3>
                            <p className="text-xs text-text-muted">No active sprints in demo.</p>
                        </div>
                        <div className="bg-surface-1 border border-border-subtle rounded-md p-4">
                            <h3 className="text-sm font-medium text-text-primary mb-2">Milestones</h3>
                            <p className="text-xs text-text-muted">No milestones in demo.</p>
                        </div>
                    </div>
                </div>
            )}

            {selectedTask && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedTask(null)}>
                    <div className="bg-surface-1 border border-border-subtle rounded-xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
                            <h3 className="text-sm font-semibold text-text-primary">{selectedTask.title}</h3>
                            <button onClick={() => setSelectedTask(null)} className="p-1 rounded-md hover:bg-surface-2 text-text-muted">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="text-xs text-text-muted">{selectedTask.issueKey} · {STATUS_LABELS[selectedTask.status]} · {PRIORITY_LABELS[selectedTask.priority]}</div>
                            {selectedTask.description && <p className="text-sm text-text-secondary">{selectedTask.description}</p>}
                            <div>
                                <h4 className="text-xs font-medium text-text-secondary mb-1">Comments</h4>
                                <div className="space-y-2">
                                    {mockComments.filter((c) => c.taskId === selectedTask.id).map((c) => (
                                        <div key={c.id} className="text-xs text-text-muted bg-surface-2 rounded-md px-2.5 py-2">
                                            <span className="font-medium text-text-secondary">{c.userFullName}</span>: {c.text}
                                        </div>
                                    ))}
                                    {mockComments.filter((c) => c.taskId === selectedTask.id).length === 0 && (
                                        <div className="text-xs text-text-muted">No comments yet.</div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-medium text-text-secondary mb-1">Time Logs</h4>
                                <div className="space-y-1">
                                    {mockTimeLogs.filter((tl) => tl.taskId === selectedTask.id).map((tl) => (
                                        <div key={tl.id} className="text-xs text-text-muted flex justify-between">
                                            <span>{tl.userFullName}</span>
                                            <span>{tl.hours}h on {new Date(tl.date).toLocaleDateString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showCreate && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
                    <div className="bg-surface-1 border border-border-subtle rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
                            <h3 className="text-sm font-semibold text-text-primary">New task</h3>
                            <button onClick={() => setShowCreate(false)} className="p-1 rounded-md hover:bg-surface-2 text-text-muted">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-4 space-y-3">
                            <label className="block">
                                <span className="block text-xs font-medium text-text-secondary mb-1">Title</span>
                                <input
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="Task title"
                                    autoFocus
                                    className="w-full bg-surface-2 border border-border-subtle rounded-md px-2.5 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                                />
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="block">
                                    <span className="block text-xs font-medium text-text-secondary mb-1">Type</span>
                                    <select
                                        value={newType}
                                        onChange={(e) => setNewType(e.target.value as Task['type'])}
                                        className="w-full bg-surface-2 border border-border-subtle rounded-md px-2.5 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors cursor-pointer"
                                    >
                                        <option value="Task">Task</option>
                                        <option value="Story">Story</option>
                                        <option value="Bug">Bug</option>
                                        <option value="Epic">Epic</option>
                                    </select>
                                </label>
                                <label className="block">
                                    <span className="block text-xs font-medium text-text-secondary mb-1">Priority</span>
                                    <select
                                        value={newPriority}
                                        onChange={(e) => setNewPriority(e.target.value as Task['priority'])}
                                        className="w-full bg-surface-2 border border-border-subtle rounded-md px-2.5 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors cursor-pointer"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Critical">Critical</option>
                                    </select>
                                </label>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border-subtle">
                            <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-xs font-medium rounded-md border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-default transition-colors">
                                Cancel
                            </button>
                            <button onClick={createTask} className="px-3 py-1.5 text-xs font-medium rounded-md bg-accent text-white hover:bg-accent/90 transition-colors">
                                Add task
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppShell>
    );
}
