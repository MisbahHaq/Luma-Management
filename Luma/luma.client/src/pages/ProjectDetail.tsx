import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import KanbanBoard from '../components/KanbanBoard';
import SprintsPanel from '../components/SprintsPanel';
import DependenciesPanel from '../components/DependenciesPanel';
import TimeTracking from '../components/TimeTracking';
import GanttView from '../components/GanttView';
import IssueHierarchyTable from '../components/IssueHierarchyTable';
import MilestonesPanel from '../components/MilestonesPanel';
import AppShell from '../components/AppShell';
import TaskDetailSheet from '../components/TaskDetailSheet';
import Avatar from '../components/Avatar';
import { membersApi, usersApi, tasksApi } from '../api/endpoints';
import { labelsApi } from '../api/endpoints';
import { Badge } from '../components/primitives/Badge';
import { Button } from '../components/primitives/Button';
import { UserPlus, X, Plus } from 'lucide-react';
import {
    PRIORITY_LABELS,
    TASK_TYPE_LABELS,
    type Project,
    type Task,
    type TaskItemType,
    type TaskPriority,
    type TaskStatus,
    type ProjectMemberSummary,
    type ProjectRole,
    type UserSummary,
    type Label,
} from '../types/types';

type ViewMode = 'list' | 'kanban' | 'plan';

const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High', 'Critical'];
const TYPES: TaskItemType[] = ['Task', 'Story', 'Bug', 'Epic'];

export default function ProjectDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [view, setView] = useState<ViewMode>('list');
    const [selected, setSelected] = useState<Task | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [showCreate, setShowCreate] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [newPriority, setNewPriority] = useState<TaskPriority>('Medium');
    const [newType, setNewType] = useState<TaskItemType>('Task');
    const [newParentId, setNewParentId] = useState<string>('');
    const [saving, setSaving] = useState(false);

    const [members, setMembers] = useState<ProjectMemberSummary[]>([]);
    const [allUsers, setAllUsers] = useState<UserSummary[]>([]);
    const [showMembers, setShowMembers] = useState(false);
    const [newMemberId, setNewMemberId] = useState('');
    const [taskLabels, setTaskLabels] = useState<Record<string, Label[]>>({});

    const canEdit = currentUser?.role === 'Admin' || currentUser?.role === 'Member';

    const load = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [projRes, tasksRes, membersRes, usersRes] = await Promise.all([
                client.get<Project>(`/projects/${id}`),
                tasksApi.byProject(id, 1, 100),
                membersApi.list(id),
                canEdit ? usersApi.list() : Promise.resolve({ data: [] as UserSummary[] }),
            ]);
            setProject(projRes.data);
            setTasks(tasksRes.data.items);
            setMembers(membersRes.data);
            setAllUsers(usersRes.data);

            const taskLabelMap: Record<string, Label[]> = {};
            for (const task of tasksRes.data.items) {
                const tl = await labelsApi.forTask(task.id);
                taskLabelMap[task.id] = tl.data;
            }
            setTaskLabels(taskLabelMap);
        } catch {
            setError('Failed to load project.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const completion = tasks.length === 0
        ? 0
        : Math.round((tasks.filter((t) => t.status === 'Done').length / tasks.length) * 100);

    const handleTaskSaved = (updated: Task) => {
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setSelected(updated);
    };

    const handleTaskMoved = (taskId: string, status: TaskStatus) => {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
    };

    const toggleDone = async (task: Task) => {
        const next: TaskStatus = task.status === 'Done' ? 'ToDo' : 'Done';
        try {
            await client.put(`/tasks/${task.id}`, {
                title: task.title,
                description: task.description,
                status: next,
                priority: task.priority,
                type: task.type,
                parentTaskId: task.parentTaskId,
                dueDate: task.dueDate,
                assigneeId: task.assigneeId,
            });
            setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)));
        } catch {
            setError('Failed to update task.');
        }
    };

    const deleteTask = async (task: Task) => {
        if (!window.confirm(`Delete "${task.title}"?`)) return;
        try {
            await client.delete(`/tasks/${task.id}`);
            setTasks((prev) => prev.filter((t) => t.id !== task.id && t.parentTaskId !== task.id));
        } catch {
            setError('Failed to delete task.');
        }
    };

    const createTask = async (e: FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !id) return;
        setSaving(true);
        setError(null);
        try {
            const { data } = await client.post<Task>('/tasks', {
                title: title.trim(),
                description: description.trim() || null,
                status: 'ToDo' as TaskStatus,
                priority: newPriority,
                type: newType,
                parentTaskId: newParentId || null,
                projectId: id,
                assigneeId: null,
            });
            setTasks((prev) => [...prev, data]);
            setTitle('');
            setDescription('');
            setNewPriority('Medium');
            setNewType('Task');
            setNewParentId('');
            setShowCreate(false);
        } catch {
            setError('Failed to create task.');
        } finally {
            setSaving(false);
        }
    };

    const addMember = async (e: FormEvent) => {
        e.preventDefault();
        if (!newMemberId || !id) return;
        try {
            await membersApi.add(id, newMemberId);
            const { data } = await membersApi.list(id);
            setMembers(data);
            setNewMemberId('');
        } catch {
            setError('Failed to add member.');
        }
    };

    const changeMemberRole = async (userId: string, role: ProjectRole) => {
        if (!id) return;
        try {
            await membersApi.changeRole(id, userId, role);
            const { data } = await membersApi.list(id);
            setMembers(data);
        } catch {
            setError('Failed to change member role.');
        }
    };

    const isProjectOwner = members.find((m) => m.id === currentUser?.id)?.projectRole === 'Owner';

    const removeMember = async (userId: string) => {
        if (!id) return;
        try {
            await membersApi.remove(id, userId);
            setMembers((prev) => prev.filter((m) => m.id !== userId));
        } catch {
            setError('Failed to remove member.');
        }
    };

    const epicOptions = tasks.filter((t) => t.type === 'Epic');

    return (
        <AppShell
            breadcrumb={
                <>
                    <span className="crumb-link" onClick={() => navigate('/projects')}>{project?.workspaceName ?? 'Workspace'}</span>
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
            {error && <div className="alert alert-error">{error}</div>}

            {loading ? (
                <p className="muted">Loading...</p>
            ) : project ? (
                <>
                    {project.description && <p className="text-xs text-text-muted mt-1 mb-3">{project.description}</p>}

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
                                Members ({members.length})
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
                        <div className="border border-border-subtle rounded-md overflow-hidden bg-surface-1 mt-4">
                            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border-subtle">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-medium text-text-primary">Project members</h3>
                                    <span className="text-[10px] font-mono tabular-nums text-text-muted bg-surface-2 px-1.5 py-0.5 rounded-md">{members.length}</span>
                                </div>
                            </div>

                            {members.length === 0 ? (
                                <div className="px-3 py-8 text-center">
                                    <p className="text-xs text-text-muted">No members yet.</p>
                                </div>
                            ) : (
                                <div>
                                    {members.map((m) => (
                                        <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 border-b border-border-subtle last:border-0 hover:bg-surface-2/50 transition-colors">
                                            <Avatar name={m.fullName ?? m.email} size={32} />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-text-primary truncate">{m.fullName ?? m.email}</div>
                                                <div className="text-[11px] text-text-muted truncate">{m.email}</div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {isProjectOwner ? (
                                                    <select
                                                        value={m.projectRole}
                                                        onChange={(e) => void changeMemberRole(m.id, e.target.value as ProjectRole)}
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
                                                {canEdit && m.id !== currentUser?.id && (
                                                    <button
                                                        type="button"
                                                        className="p-1 rounded-md hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors"
                                                        onClick={() => void removeMember(m.id)}
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

                            {canEdit && (
                                <form onSubmit={addMember} className="flex items-center gap-2 px-3 py-2.5 border-t border-border-subtle">
                                    <select
                                        value={newMemberId}
                                        onChange={(e) => setNewMemberId(e.target.value)}
                                        className="flex-1 bg-surface-2 border border-border-subtle rounded-md px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent transition-colors cursor-pointer"
                                    >
                                        <option value="">Add member…</option>
                                        {allUsers.filter((u) => !members.some((m) => m.id === u.id)).map((u) => (
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
                        <KanbanBoard tasks={tasks} onTaskClick={setSelected} onTaskMoved={handleTaskMoved} labels={taskLabels} />
                    ) : view === 'list' ? (
                        <IssueHierarchyTable
                            tasks={tasks}
                            members={members}
                            canEdit={canEdit}
                            onOpenTask={setSelected}
                            onToggleDone={toggleDone}
                            onDelete={deleteTask}
                            onQuickAdd={async (parentId, type) => {
                                if (!id) return;
                                const t = window.prompt('Issue title');
                                if (!t?.trim()) return;
                                try {
                                    const { data } = await client.post<Task>('/tasks', {
                                        title: t.trim(),
                                        status: 'ToDo',
                                        priority: 'Medium',
                                        type,
                                        parentTaskId: parentId,
                                        projectId: id,
                                        assigneeId: null,
                                    });
                                    setTasks((prev) => [...prev, data]);
                                } catch {
                                    setError('Failed to create issue.');
                                }
                            }}
                            labels={taskLabels}
                        />
                    ) : (
                        <div className="plan-grid">
                            <GanttView tasks={tasks} />
                            <SprintsPanel projectId={id!} tasks={tasks} canEdit={canEdit} onTasksChanged={load} />
                            <MilestonesPanel projectId={id!} tasks={tasks} canEdit={canEdit} onTasksChanged={load} />
                            <DependenciesPanel projectId={id!} tasks={tasks} canEdit={canEdit} />
                            <TimeTracking projectId={id!} tasks={tasks} canEdit={canEdit} />
                        </div>
                    )}
                </>
            ) : (
                <p className="muted">Project not found.</p>
            )}

            {selected && (
                <TaskDetailSheet
                    task={selected}
                    tasks={tasks}
                    canEdit={canEdit}
                    onClose={() => setSelected(null)}
                    onSaved={handleTaskSaved}
                />
            )}

            {showCreate && (
                <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
                    <form className="modal modal-lg" onClick={(e) => e.stopPropagation()} onSubmit={createTask}>
                        <div className="modal-head">
                            <h3>New task</h3>
                            <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>
                                ✕
                            </button>
                        </div>
                        <label>
                            Title
                            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" autoFocus />
                        </label>
                        <label>
                            Description
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Optional" />
                        </label>
                        <div className="form-row">
                            <label>
                                Type
                                <select value={newType} onChange={(e) => setNewType(e.target.value as TaskItemType)}>
                                    {TYPES.map((t) => (
                                        <option key={t} value={t}>{TASK_TYPE_LABELS[t]}</option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Priority
                                <select value={newPriority} onChange={(e) => setNewPriority(e.target.value as TaskPriority)}>
                                    {PRIORITIES.map((p) => (
                                        <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                Epic parent
                                <select value={newParentId} onChange={(e) => setNewParentId(e.target.value)}>
                                    <option value="">None</option>
                                    {epicOptions.map((ep) => (
                                        <option key={ep.id} value={ep.id}>{ep.title}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                            <button type="submit" className="modern-btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Add task'}</button>
                        </div>
                    </form>
                </div>
            )}
        </AppShell>
    );
}
