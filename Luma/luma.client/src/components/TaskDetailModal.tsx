import { useEffect, useState, type FormEvent } from 'react';
import client from '../api/client';
import {
    attachmentsApi,
    activityApi,
} from '../api/endpoints';
import {
    STATUS_LABELS,
    PRIORITY_LABELS,
    TASK_TYPE_LABELS,
    type ActivityLog,
    type Attachment,
    type Comment,
    type Task,
    type TaskItemType,
    type TaskPriority,
    type TaskStatus,
    type UserSummary,
} from '../types/types';

interface TaskDetailModalProps {
    task: Task;
    tasks: Task[];
    canEdit: boolean;
    onClose: () => void;
    onSaved: (updated: Task) => void;
}

const STATUSES: TaskStatus[] = ['ToDo', 'InProgress', 'Done'];
const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High', 'Critical'];
const TYPES: TaskItemType[] = ['Task', 'Story', 'Bug', 'Epic'];

export default function TaskDetailModal({
    task,
    tasks,
    canEdit,
    onClose,
    onSaved,
}: TaskDetailModalProps) {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description ?? '');
    const [status, setStatus] = useState<TaskStatus>(task.status);
    const [priority, setPriority] = useState<TaskPriority>(task.priority);
    const [type, setType] = useState<TaskItemType>(task.type);
    const [parentTaskId, setParentTaskId] = useState<string>(task.parentTaskId ?? '');
    const [assigneeId, setAssigneeId] = useState<string | null>(task.assigneeId);
    const [users, setUsers] = useState<UserSummary[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [activity, setActivity] = useState<ActivityLog[]>([]);
    const [newComment, setNewComment] = useState('');
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                const [commentsRes, usersRes, attachmentsRes, activityRes] = await Promise.all([
                    client.get<{ items: Comment[]; total: number; page: number; pageSize: number; totalPages: number }>(`/comments/task/${task.id}?page=1&pageSize=50`),
                    canEdit ? client.get<UserSummary[]>('/users') : Promise.resolve({ data: [] as UserSummary[] }),
                    attachmentsApi.list(task.id),
                    activityApi.forTask(task.id, 1, 50),
                ]);
                if (!active) return;
                setComments(commentsRes.data.items);
                setUsers(usersRes.data);
                setAttachments(attachmentsRes.data);
                setActivity(activityRes.data.items);
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
                type,
                parentTaskId: parentTaskId || null,
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
            setActivity((prev) => [
                { id: crypto.randomUUID(), action: 'CommentAdded', description: 'Comment added', projectId: null, taskId: task.id, actorId: '', actorFullName: 'You', createdAt: new Date().toISOString() },
                ...prev,
            ]);
            setNewComment('');
        } catch {
            setError('Failed to add comment.');
        }
    };

    const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setUploading(true);
        setError(null);
        try {
            const { data } = await attachmentsApi.upload(task.id, file);
            setAttachments((prev) => [data, ...prev]);
        } catch {
            setError('Failed to upload attachment.');
        } finally {
            setUploading(false);
        }
    };

    const removeAttachment = async (id: string) => {
        try {
            await attachmentsApi.remove(id);
            setAttachments((prev) => prev.filter((a) => a.id !== id));
        } catch {
            setError('Failed to delete attachment.');
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
                            Type
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as TaskItemType)}
                                disabled={!canEdit}
                            >
                                {TYPES.map((t) => (
                                    <option key={t} value={t}>
                                        {TASK_TYPE_LABELS[t]}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            Epic parent
                            <select
                                value={parentTaskId}
                                onChange={(e) => setParentTaskId(e.target.value)}
                                disabled={!canEdit}
                            >
                                <option value="">None</option>
                                {tasks
                                    .filter((t) => t.type === 'Epic' && t.id !== task.id)
                                    .map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.title}
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
                    <h4>Attachments</h4>
                    {canEdit && (
                        <div className="attachment-upload">
                            <label className="btn btn-ghost">
                                {uploading ? 'Uploading...' : '📎 Attach file'}
                                <input
                                    type="file"
                                    hidden
                                    onChange={onFileSelected}
                                    disabled={uploading}
                                />
                            </label>
                        </div>
                    )}
                    {attachments.length === 0 ? (
                        <p className="muted small">No attachments yet.</p>
                    ) : (
                        <ul className="attachment-list">
                            {attachments.map((a) => (
                                <li key={a.id} className="attachment">
                                    <a href={attachmentsApi.downloadUrl(a.id)} target="_blank" rel="noreferrer">
                                        {a.fileName}
                                    </a>
                                    <small className="muted">{(a.sizeBytes / 1024).toFixed(1)} KB</small>
                                    {canEdit && (
                                        <button
                                            className="btn btn-ghost small"
                                            onClick={() => void removeAttachment(a.id)}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}

                    <h4>Comments</h4>
                    {comments.length === 0 ? (
                        <p className="muted small">No comments yet.</p>
                    ) : (
                        <ul className="comment-list">
                            {comments.map((c) => (
                                <li key={c.id} className="comment">
                                    <div className="comment-head">
                                        <strong>{c.userFullName}</strong>
                                        <small className="muted timestamp">
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

                <div className="activity">
                    <h4>Activity</h4>
                    {activity.length === 0 ? (
                        <p className="muted small">No activity yet.</p>
                    ) : (
                        <ul className="activity-list">
                            {activity.map((log) => (
                                <li key={log.id} className="activity-item">
                                    <span className={`activity-tag activity-${log.action}`}>
                                        {log.action}
                                    </span>
                                    <span>{log.description}</span>
                                    <small className="muted timestamp">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </small>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
