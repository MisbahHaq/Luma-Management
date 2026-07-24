import { useEffect, useState, useRef, type FormEvent, type KeyboardEvent } from 'react';
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

interface TaskDetailSheetProps {
    task: Task;
    tasks: Task[];
    canEdit: boolean;
    onClose: () => void;
    onSaved: (updated: Task) => void;
}

    const STATUSES: TaskStatus[] = ['ToDo', 'InProgress', 'Review', 'Done'];
const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High', 'Critical'];
const TYPES: TaskItemType[] = ['Task', 'Story', 'Bug', 'Epic'];

const STATUS_DOT: Record<TaskStatus, string> = {
    ToDo: 'bg-gray-400',
    InProgress: 'bg-blue-400',
    Review: 'bg-amber-400',
    Done: 'bg-emerald-400',
};

const PRIORITY_DOT: Record<TaskPriority, string> = {
    Low: 'bg-gray-400',
    Medium: 'bg-yellow-400',
    High: 'bg-orange-500',
    Critical: 'bg-red-500',
};

function CommandSelect<T extends string>({
    label,
    value,
    options,
    renderOption,
    onChange,
    canEdit,
}: {
    label: string;
    value: string;
    options: { value: T; label: string; dot?: string }[];
    renderOption?: (opt: { value: T; label: string; dot?: string }) => React.ReactNode;
    onChange: (val: T) => void;
    canEdit: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [highlight, setHighlight] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const filtered = options.filter((o) =>
        o.label.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        // Highlight resets implicitly when options re-render via filtered list clamping
    }, [query]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setQuery('');
            }
        };
        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [open]);

    useEffect(() => {
        const handleKey = (e: globalThis.KeyboardEvent) => {
            if (e.key === 'Escape' && open) {
                setOpen(false);
                setQuery('');
            }
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [open]);

    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus();
        }
    }, [open]);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, filtered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filtered[highlight]) {
                onChange(filtered[highlight].value as T);
                setOpen(false);
                setQuery('');
            }
        }
    };

    useEffect(() => {
        if (open && listRef.current) {
            const items = listRef.current.querySelectorAll('[data-idx]');
            items[highlight]?.scrollIntoView({ block: 'nearest' });
        }
    }, [highlight, open]);

    const selected = options.find((o) => o.value === value);

    return (
        <div className="property-row" ref={ref}>
            <span className="text-[10px] font-medium tracking-wider uppercase text-text-muted">{label}</span>
            {canEdit ? (
                <button
                    type="button"
                    className="mt-1 w-full flex items-center justify-between rounded-lg border border-border-subtle bg-bg px-2.5 py-1.5 text-sm text-text-primary text-left hover:border-border-default transition-colors"
                    onClick={() => {
                        setOpen((o) => !o);
                        setQuery('');
                    }}
                >
                    <span className="flex items-center gap-2">
                        {selected?.dot && <span className={`inline-block h-2 w-2 rounded-full ${selected.dot}`} />}
                        {selected?.label ?? 'None'}
                    </span>
                    <svg className="h-3.5 w-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                </button>
            ) : (
                <div className="mt-1 flex items-center gap-2 rounded-lg border border-border-subtle bg-bg px-2.5 py-1.5 text-sm text-text-primary">
                    {selected?.dot && <span className={`inline-block h-2 w-2 rounded-full ${selected.dot}`} />}
                    {selected?.label ?? 'None'}
                </div>
            )}
            {open && canEdit && (
                <div className="absolute right-0 top-full mt-1 z-40 bg-surface-1 border border-border-subtle rounded-lg shadow-xl py-1 min-w-[220px]">
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search..."
                        className="w-full bg-bg border-b border-border-subtle px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                    />
                    <div ref={listRef} className="max-h-48 overflow-y-auto py-1">
                        {filtered.length === 0 ? (
                            <p className="px-3 py-2 text-xs text-text-muted">No results</p>
                        ) : (
                            filtered.map((opt, idx) => (
                                <button
                                    key={opt.value}
                                    data-idx={idx}
                                    type="button"
                                    className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 transition-colors ${
                                        highlight === idx ? 'bg-surface-2 text-text-primary' : 'text-text-secondary'
                                    }`}
                                    onClick={() => {
                                        onChange(opt.value as T);
                                        setOpen(false);
                                        setQuery('');
                                    }}
                                    onMouseEnter={() => setHighlight(idx)}
                                >
                                    {opt.dot && <span className={`inline-block h-2 w-2 rounded-full ${opt.dot}`} />}
                                    {renderOption ? renderOption(opt) : opt.label}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function ActivityItem({ log }: { log: ActivityLog }) {
    return (
        <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
            <div className="min-w-0">
                <p className="text-xs text-text-secondary truncate">{log.description}</p>
                <p className="text-[10px] text-text-muted">
                    {new Date(log.createdAt).toLocaleString()}
                </p>
            </div>
        </li>
    );
}

export default function TaskDetailSheet({
    task,
    tasks,
    canEdit,
    onClose,
    onSaved,
}: TaskDetailSheetProps) {
    const title = task.title;
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
        <div className="fixed inset-0 z-50" onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />
            <div
                className="fixed top-0 right-0 h-full w-full sm:w-[560px] bg-surface-1 border-l border-border-subtle shadow-2xl z-50 overflow-y-auto transform transition-transform duration-300 ease-out"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 z-10 bg-surface-1 border-b border-border-subtle px-6 py-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <span className="text-[10px] font-medium tracking-wider uppercase text-text-muted">{task.issueKey}</span>
                        <h2 className="text-lg font-semibold text-text-primary truncate">{title}</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 rounded-lg p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                            {error}
                        </div>
                    )}

                    <form onSubmit={save}>
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6">
                            <div className="space-y-6">
                                <section>
                                    <h3 className="text-sm font-medium text-text-primary mb-2">Description</h3>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        disabled={!canEdit}
                                        className="min-h-[120px] w-full bg-transparent border border-border-subtle rounded-lg p-3 text-text-primary text-sm resize-y focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors disabled:opacity-60"
                                        placeholder="Add a description..."
                                    />
                                    {canEdit && (
                                        <div className="mt-2 flex items-center justify-end">
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                                            >
                                                {saving ? 'Saving...' : 'Save changes'}
                                            </button>
                                        </div>
                                    )}
                                </section>

                                <section>
                                    <h3 className="text-sm font-medium text-text-primary mb-2">Labels</h3>
                                    <LabelPicker
                                        projectId={task.projectId}
                                        taskId={task.id}
                                        selectedLabels={labels}
                                        canEdit={canEdit}
                                        onLabelsChanged={setLabels}
                                    />
                                </section>

                                <section>
                                    <h3 className="text-sm font-medium text-text-primary mb-2">Attachments</h3>
                                    {canEdit && (
                                        <label className="inline-flex items-center gap-2 rounded-lg border border-border-subtle px-3 py-1.5 text-xs text-text-secondary hover:border-border-default cursor-pointer transition-colors">
                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.75a1.5 1.5 0 01-1.5 1.5h-9a1.5 1.5 0 01-1.5-1.5v-9a1.5 1.5 0 011.5-1.5h3.75m3.75 0l3-3m0 0l-3-3m3 3H15" />
                                            </svg>
                                            {uploading ? 'Uploading...' : 'Attach file'}
                                            <input
                                                type="file"
                                                hidden
                                                onChange={onFileSelected}
                                                disabled={uploading}
                                            />
                                        </label>
                                    )}
                                    {attachments.length === 0 ? (
                                        <p className="mt-2 text-xs text-text-muted">No attachments yet.</p>
                                    ) : (
                                        <ul className="mt-2 space-y-1.5">
                                            {attachments.map((a) => (
                                                <li key={a.id} className="flex items-center justify-between gap-2 rounded-lg border border-border-subtle bg-surface-2/50 px-3 py-2">
                                                    <div className="min-w-0 flex-1">
                                                        <a
                                                            href={attachmentsApi.downloadUrl(a.id)}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-xs text-accent hover:underline truncate block"
                                                        >
                                                            {a.fileName}
                                                        </a>
                                                        <span className="text-[10px] text-text-muted">{(a.sizeBytes / 1024).toFixed(1)} KB</span>
                                                    </div>
                                                    {canEdit && (
                                                        <button
                                                            type="button"
                                                            onClick={() => void removeAttachment(a.id)}
                                                            className="shrink-0 text-[10px] text-text-muted hover:text-red-400 transition-colors"
                                                        >
                                                            Remove
                                                        </button>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </section>

                                <section>
                                    <h3 className="text-sm font-medium text-text-primary mb-2">Comments</h3>
                                    {comments.length === 0 ? (
                                        <p className="text-xs text-text-muted mb-3">No comments yet.</p>
                                    ) : (
                                        <ul className="space-y-2 mb-3">
                                            {comments.map((c) => (
                                                <li key={c.id} className={`rounded-lg border border-border-subtle bg-surface-2/50 p-2.5 ${c.isDeleted ? 'opacity-60' : ''}`}>
                                                    {editingId === c.id ? (
                                                        <div className="space-y-2">
                                                            <textarea
                                                                value={editText}
                                                                onChange={(e) => setEditText(e.target.value)}
                                                                rows={3}
                                                                autoFocus
                                                                className="min-h-[80px] w-full bg-transparent border border-border-subtle rounded-lg p-2 text-text-primary text-xs resize-y focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
                                                            />
                                                            <div className="flex gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => void saveEdit(c.id)}
                                                                    disabled={!editText.trim()}
                                                                    className="rounded-lg bg-accent px-2.5 py-1 text-[11px] font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                                                                >
                                                                    Save
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={cancelEdit}
                                                                    className="rounded-lg border border-border-subtle px-2.5 py-1 text-[11px] text-text-secondary hover:bg-surface-2 transition-colors"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                                <span className="text-xs font-medium text-text-primary">{c.userFullName}</span>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] text-text-muted">
                                                                        {new Date(c.createdAt).toLocaleString()}
                                                                    </span>
                                                                    {c.canEdit && !c.isDeleted && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => startEdit(c)}
                                                                            className="text-[10px] text-text-muted hover:text-text-secondary transition-colors"
                                                                        >
                                                                            Edit
                                                                        </button>
                                                                    )}
                                                                    {c.canDelete && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                if (confirm('Delete this comment?')) {
                                                                                    void deleteComment(c.id);
                                                                                }
                                                                            }}
                                                                            className="text-[10px] text-text-muted hover:text-red-400 transition-colors"
                                                                        >
                                                                            Delete
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <p className="text-xs text-text-secondary whitespace-pre-wrap">{c.isDeleted ? '[deleted]' : c.text}</p>
                                                        </>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    <form onSubmit={addComment} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Write a comment..."
                                            className="flex-1 rounded-lg border border-border-subtle bg-bg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
                                        />
                                        <button
                                            type="submit"
                                            className="rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                                            disabled={!newComment.trim()}
                                        >
                                            Send
                                        </button>
                                    </form>
                                </section>
                            </div>

                            <aside className="space-y-5">
                                <section>
                                    <h3 className="text-sm font-medium text-text-primary mb-3">Properties</h3>
                                    <div className="space-y-3 relative">
                                        <CommandSelect<TaskStatus>
                                            label="Status"
                                            value={status}
                                            options={STATUSES.map((s) => ({
                                                value: s,
                                                label: STATUS_LABELS[s],
                                                dot: STATUS_DOT[s],
                                            }))}
                                            onChange={(val) => setStatus(val)}
                                            canEdit={canEdit}
                                        />
                                        <CommandSelect<TaskPriority>
                                            label="Priority"
                                            value={priority}
                                            options={PRIORITIES.map((p) => ({
                                                value: p,
                                                label: PRIORITY_LABELS[p],
                                                dot: PRIORITY_DOT[p],
                                            }))}
                                            onChange={(val) => setPriority(val)}
                                            canEdit={canEdit}
                                        />
                                        <CommandSelect<TaskItemType>
                                            label="Type"
                                            value={type}
                                            options={TYPES.map((t) => ({
                                                value: t,
                                                label: TASK_TYPE_LABELS[t],
                                            }))}
                                            onChange={(val) => setType(val)}
                                            canEdit={canEdit}
                                        />
                                        <CommandSelect<string>
                                            label="Parent Epic"
                                            value={parentTaskId}
                                            options={[
                                                { value: '', label: 'None' },
                                                ...tasks
                                                    .filter((t) => t.type === 'Epic' && t.id !== task.id)
                                                    .map((t) => ({ value: t.id, label: t.title })),
                                            ]}
                                            onChange={(val) => setParentTaskId(val)}
                                            canEdit={canEdit}
                                        />
                                        <CommandSelect<string>
                                            label="Milestone"
                                            value={milestoneId}
                                            options={[
                                                { value: '', label: 'None' },
                                                ...milestones.map((m) => ({
                                                    value: m.id,
                                                    label: `${m.name} (${m.progressPercentage}%)`,
                                                })),
                                            ]}
                                            onChange={(val) => setMilestoneId(val)}
                                            canEdit={canEdit}
                                        />
                                        <CommandSelect<string>
                                            label="Assignee"
                                            value={assigneeId ?? ''}
                                            options={[
                                                { value: '', label: 'Unassigned' },
                                                ...users.map((u) => ({
                                                    value: u.id,
                                                    label: u.fullName ?? u.email ?? 'Unknown',
                                                })),
                                            ]}
                                            onChange={(val) => setAssigneeId(val || null)}
                                            canEdit={canEdit}
                                        />
                                    </div>
                                </section>

                                <section>
                                    <h3 className="text-sm font-medium text-text-primary mb-3">Activity</h3>
                                    {activity.length === 0 ? (
                                        <p className="text-xs text-text-muted">No activity yet.</p>
                                    ) : (
                                        <ul className="space-y-2">
                                            {activity.slice(0, 20).map((log) => (
                                                <ActivityItem key={log.id} log={log} />
                                            ))}
                                        </ul>
                                    )}
                                </section>
                            </aside>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}