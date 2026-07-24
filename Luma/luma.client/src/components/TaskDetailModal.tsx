import { useEffect, useState, type FormEvent } from 'react';
import client from '../api/client';
import {
    attachmentsApi,
    activityApi,
    commentsApi,
    labelsApi,
    milestonesApi,
} from '../api/endpoints';
import {
    STATUS_LABELS,
    PRIORITY_LABELS,
    TASK_TYPE_LABELS,
    type ActivityLog,
    type Attachment,
    type Comment as CommentModel,
    type Label,
    type Task,
    type TaskItemType,
    type TaskPriority,
    type TaskStatus,
    type UserSummary,
    type Milestone,
} from '../types/types';
import LabelPicker from './LabelPicker';

interface TaskDetailModalProps {
    task: Task;
    tasks: Task[];
    canEdit: boolean;
    onClose: () => void;
    onSaved: (updated: Task) => void;
}

    const STATUSES: TaskStatus[] = ['ToDo', 'InProgress', 'Review', 'Done'];
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
    const [milestoneId, setMilestoneId] = useState<string>(task.milestoneId ?? '');
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [assigneeId, setAssigneeId] = useState<string | null>(task.assigneeId);
    const [users, setUsers] = useState<UserSummary[]>([]);
    const [comments, setComments] = useState<CommentModel[]>([]);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [activity, setActivity] = useState<ActivityLog[]>([]);
    const [newComment, setNewComment] = useState('');
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [labels, setLabels] = useState<Label[]>([]);

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                const [commentsRes, usersRes, attachmentsRes, activityRes, labelsRes, milestonesRes] = await Promise.all([
                    client.get<{ items: CommentModel[]; total: number; page: number; pageSize: number; totalPages: number }>(`/comments/task/${task.id}?page=1&pageSize=50`),
                    canEdit ? client.get<UserSummary[]>('/users') : Promise.resolve({ data: [] as UserSummary[] }),
                    attachmentsApi.list(task.id),
                    activityApi.forTask(task.id, 1, 50),
                    labelsApi.forTask(task.id),
                    milestonesApi.forProject(task.projectId),
                ]);
                if (!active) return;
                setComments(commentsRes.data.items);
                setUsers(usersRes.data);
                setAttachments(attachmentsRes.data);
                setActivity(activityRes.data.items);
                setLabels(labelsRes.data);
                setMilestones(milestonesRes.data);
            } catch {
                if (active) setError('Failed to load task details.');
            }
        };
        load();
        return () => {
            active = false;
        };
    }, [task.id, canEdit, task.projectId]);

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
                milestoneId: milestoneId || null,
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
            const { data } = await client.post<CommentModel>('/comments', {
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

    const startEdit = (comment: CommentModel) => {
        setEditingId(comment.id);
        setEditText(comment.text);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditText('');
    };

    const saveEdit = async (commentId: string) => {
        if (!editText.trim()) return;
        try {
            const { data } = await commentsApi.update(commentId, editText.trim());
            setComments((prev) => prev.map((c) => (c.id === commentId ? data : c)));
            setEditingId(null);
            setEditText('');
        } catch {
            setError('Failed to update comment.');
        }
    };

    const deleteComment = async (commentId: string) => {
        try {
            await commentsApi.remove(commentId);
            setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, isDeleted: true, text: '[deleted]' } : c)));
        } catch {
            setError('Failed to delete comment.');
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                <div className="modal-head">
                    <div>
                        <small className="muted modal-issue-key">{task.issueKey}</small>
                        <h3 className="modal-title">{title}</h3>
                    </div>
                    <button type="button" className="btn btn-ghost" onClick={onClose}>
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
                            Milestone
                            <select
                                value={milestoneId}
                                onChange={(e) => setMilestoneId(e.target.value)}
                                disabled={!canEdit}
                            >
                                <option value="">None</option>
                                {milestones.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.name} ({m.progressPercentage}%)
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

                <div className="modal-section">
                    <h4 className="modal-section-title">Labels</h4>
                    <LabelPicker
                        projectId={task.projectId}
                        taskId={task.id}
                        selectedLabels={labels}
                        canEdit={canEdit}
                        onLabelsChanged={setLabels}
                    />
                </div>

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
                                <li key={c.id} className={`comment ${c.isDeleted ? 'comment-deleted' : ''}`}>
                                    {editingId === c.id ? (
                                        <>
                                            <textarea
                                                value={editText}
                                                onChange={(e) => setEditText(e.target.value)}
                                                rows={3}
                                                autoFocus
                                            />
                                            <div className="comment-actions">
                                                <button
                                                    type="button"
                                                    className="btn btn-primary"
                                                    onClick={() => void saveEdit(c.id)}
                                                    disabled={!editText.trim()}
                                                >
                                                    Save
                                                </button>
                                                <button type="button" className="btn btn-ghost" onClick={cancelEdit}>
                                                    Cancel
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="comment-head">
                                                <strong>{c.userFullName}</strong>
                                                <div className="comment-actions">
                                                    <small className="muted timestamp">
                                                        {new Date(c.createdAt).toLocaleString()}
                                                    </small>
                                                    {c.canEdit && !c.isDeleted && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-ghost small"
                                                            onClick={() => startEdit(c)}
                                                        >
                                                            Edit
                                                        </button>
                                                    )}
                                                    {c.canDelete && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-ghost small"
                                                            onClick={() => {
                                                                if (confirm('Delete this comment?')) {
                                                                    void deleteComment(c.id);
                                                                }
                                                            }}
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <p>{c.isDeleted ? '[deleted]' : c.text}</p>
                                        </>
                                    )}
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
