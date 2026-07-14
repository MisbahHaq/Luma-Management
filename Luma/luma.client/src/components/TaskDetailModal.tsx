import { useEffect, useState, type FormEvent } from 'react';
import client from '../api/client';
import {
    STATUS_LABELS,
    PRIORITY_LABELS,
    type Comment,
    type Task,
    type TaskPriority,
    type TaskStatus,
    type UserSummary,
} from '../types/types';

interface TaskDetailModalProps {
    task: Task;
    canEdit: boolean;
    onClose: () => void;
    onSaved: (updated: Task) => void;
}

const STATUSES: TaskStatus[] = ['ToDo', 'InProgress', 'Done'];
const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High'];

export default function TaskDetailModal({
    task,
    canEdit,
    onClose,
    onSaved,
}: TaskDetailModalProps) {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description ?? '');
    const [status, setStatus] = useState<TaskStatus>(task.status);
    const [priority, setPriority] = useState<TaskPriority>(task.priority);
    const [assigneeId, setAssigneeId] = useState<string | null>(task.assigneeId);
    const [users, setUsers] = useState<UserSummary[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                const [commentsRes, usersRes] = await Promise.all([
                    client.get<Comment[]>(`/comments/task/${task.id}`),
                    canEdit ? client.get<UserSummary[]>('/users') : Promise.resolve({ data: [] as UserSummary[] }),
                ]);
                if (!active) return;
                setComments(commentsRes.data);
                setUsers(usersRes.data);
            } catch {
                if (active) setError('Failed to load task details.');
            }
        };
        load();
        return () => {
            active = false;
        };
    }, [task.id, canEdit]);

    const save = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            const { data } = await client.put<Task>(`/tasks/${task.id}`, {
                title: title.trim(),
                description: description.trim() || null,
                status,
                priority,
                dueDate: task.dueDate,
                assigneeId,
            });
            onSaved(data);
        } catch {
            setError('Failed to save changes.');
        } finally {
            setSaving(false);
        }
    };

    const addComment = async (e: FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            const { data } = await client.post<Comment>('/comments', {
                taskId: task.id,
                text: newComment.trim(),
            });
            setComments((prev) => [...prev, data]);
            setNewComment('');
        } catch {
            setError('Failed to add comment.');
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="card modal modal-lg" onClick={(e) => e.stopPropagation()}>
                <div className="modal-head">
                    <h3>{title}</h3>
                    <button className="btn btn-ghost" onClick={onClose}>
                        ✕
                    </button>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={save} className="task-form">
                    <label>
                        Title
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={!canEdit}
                        />
                    </label>

                    <label>
                        Description
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            disabled={!canEdit}
                        />
                    </label>

                    <div className="form-row">
                        <label>
                            Status
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                                disabled={!canEdit}
                            >
                                {STATUSES.map((s) => (
                                    <option key={s} value={s}>
                                        {STATUS_LABELS[s]}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            Priority
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                                disabled={!canEdit}
                            >
                                {PRIORITIES.map((p) => (
                                    <option key={p} value={p}>
                                        {PRIORITY_LABELS[p]}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            Assignee
                            <select
                                value={assigneeId ?? ''}
                                onChange={(e) => setAssigneeId(e.target.value || null)}
                                disabled={!canEdit}
                            >
                                <option value="">Unassigned</option>
                                {users.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.fullName ?? u.email}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {canEdit && (
                        <div className="modal-actions">
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? 'Saving...' : 'Save changes'}
                            </button>
                        </div>
                    )}
                </form>

                <div className="comments">
                    <h4>Comments</h4>
                    {comments.length === 0 ? (
                        <p className="muted small">No comments yet.</p>
                    ) : (
                        <ul className="comment-list">
                            {comments.map((c) => (
                                <li key={c.id} className="comment">
                                    <div className="comment-head">
                                        <strong>{c.userFullName}</strong>
                                        <small className="muted">
                                            {new Date(c.createdAt).toLocaleString()}
                                        </small>
                                    </div>
                                    <p>{c.text}</p>
                                </li>
                            ))}
                        </ul>
                    )}

                    <form className="comment-form" onSubmit={addComment}>
                        <input
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                        />
                        <button type="submit" className="btn btn-primary">
                            Send
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
