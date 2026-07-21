import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import KanbanBoard from '../components/KanbanBoard';
import TaskDetailModal from '../components/TaskDetailModal';
import SprintsPanel from '../components/SprintsPanel';
import DependenciesPanel from '../components/DependenciesPanel';
import TimeTracking from '../components/TimeTracking';
import GanttView from '../components/GanttView';
import IssueHierarchyTable from '../components/IssueHierarchyTable';
import AppShell from '../components/AppShell';
import { membersApi, usersApi, tasksApi } from '../api/endpoints';
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
                    <span className="crumb-link" onClick={() => navigate('/')}>Workspace</span>
                    <span className="crumb-sep">›</span>
                    <span>Projects</span>
                    <span className="crumb-sep">›</span>
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
                    {project.description && <p className="muted project-sub">{project.description}</p>}

                    <div className="modern-view-toggle">
                        <button className={`modern-view-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>List</button>
                        <button className={`modern-view-btn ${view === 'kanban' ? 'active' : ''}`} onClick={() => setView('kanban')}>Kanban</button>
                        <button className={`modern-view-btn ${view === 'plan' ? 'active' : ''}`} onClick={() => setView('plan')}>Plan</button>
                        <button className={`modern-view-btn ${showMembers ? 'active' : ''}`} onClick={() => setShowMembers((s) => !s)}>Members ({members.length})</button>
                    </div>
                    {canEdit && (
                        <button className="modern-btn-primary" onClick={() => setShowCreate(true)} style={{ marginLeft: 'auto' }}>+ New Task</button>
                    )}

                    {showMembers && (
                        <div className="card members-panel">
                            <h4>Project members</h4>
                            <ul className="member-list">
                                {members.map((m) => (
                                    <li key={m.id} className="member">
                                        <span>{m.fullName ?? m.email}</span>
                                        {isProjectOwner ? (
                                            <select
                                                className="role-select"
                                                value={m.projectRole}
                                                onChange={(e) => void changeMemberRole(m.id, e.target.value as ProjectRole)}
                                            >
                                                <option value="Owner">Owner</option>
                                                <option value="Editor">Editor</option>
                                                <option value="Viewer">Viewer</option>
                                            </select>
                                        ) : (
                                            <small className="muted">{m.projectRole}</small>
                                        )}
                                        {canEdit && m.id !== currentUser?.id && (
                                            <button className="btn btn-ghost small" onClick={() => void removeMember(m.id)}>Remove</button>
                                        )}
                                    </li>
                                ))}
                                {members.length === 0 && <li className="muted small">No members yet.</li>}
                            </ul>
                            {canEdit && (
                                <form className="member-add" onSubmit={addMember}>
                                    <select value={newMemberId} onChange={(e) => setNewMemberId(e.target.value)}>
                                        <option value="">Select user…</option>
                                        {allUsers.filter((u) => !members.some((m) => m.id === u.id)).map((u) => (
                                            <option key={u.id} value={u.id}>{u.fullName ?? u.email}</option>
                                        ))}
                                    </select>
                                    <button type="submit" className="btn btn-primary" disabled={!newMemberId}>Add</button>
                                </form>
                            )}
                        </div>
                    )}

                    {view === 'kanban' ? (
                        <KanbanBoard tasks={tasks} onTaskClick={setSelected} onTaskMoved={handleTaskMoved} />
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
                        />
                    ) : (
                        <div className="plan-grid">
                            <GanttView tasks={tasks} />
                            <SprintsPanel projectId={id!} tasks={tasks} canEdit={canEdit} onTasksChanged={load} />
                            <DependenciesPanel projectId={id!} tasks={tasks} canEdit={canEdit} />
                            <TimeTracking projectId={id!} tasks={tasks} canEdit={canEdit} />
                        </div>
                    )}
                </>
            ) : (
                <p className="muted">Project not found.</p>
            )}

            {selected && (
                <TaskDetailModal
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
