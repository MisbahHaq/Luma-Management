import { useMemo, useState } from 'react';
import type { Label, ProjectMemberSummary, Task, TaskItemType, TaskPriority, TaskStatus } from '../types/types';
import StatusPill from './StatusPill';
import PriorityPill from './PriorityPill';
import TypeBadge from './TypeBadge';
import Avatar from './Avatar';
import KebabMenu from './KebabMenu';

interface IssueHierarchyTableProps {
    tasks: Task[];
    members: ProjectMemberSummary[];
    canEdit: boolean;
    onOpenTask: (task: Task) => void;
    onToggleDone: (task: Task) => void;
    onDelete: (task: Task) => void;
    onQuickAdd: (parentId: string | null, type: TaskItemType) => void;
    labels?: Record<string, Label[]>;
    selectedIds?: string[];
    onSelectionChange?: (ids: string[]) => void;
}

function keyFor(_tasks: Task[], task: Task): string {
    return task.issueKey;
}

export default function IssueHierarchyTable({
    tasks,
    members,
    canEdit,
    onOpenTask,
    onToggleDone,
    onDelete,
    onQuickAdd,
    labels,
}: IssueHierarchyTableProps) {
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
    const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
    const [typeFilter, setTypeFilter] = useState<TaskItemType | 'all'>('all');
    const [showFilters, setShowFilters] = useState(false);
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
    const [addingTo, setAddingTo] = useState<string | null>(null);
    const [draftTitle, setDraftTitle] = useState('');

    const epics = useMemo(
        () => tasks.filter((t) => t.type === 'Epic' && !t.parentTaskId),
        [tasks],
    );
    const topLevel = useMemo(
        () => tasks.filter((t) => !t.parentTaskId && t.type !== 'Epic'),
        [tasks],
    );
    const childrenOf = (id: string) => tasks.filter((t) => t.parentTaskId === id);

    const matches = (t: Task) =>
        (statusFilter === 'all' || t.status === statusFilter) &&
        (priorityFilter === 'all' || t.priority === priorityFilter) &&
        (typeFilter === 'all' || t.type === typeFilter) &&
        (query.trim() === '' ||
            t.title.toLowerCase().includes(query.trim().toLowerCase()));

    const filteredEpics = epics.filter(matches);
    const filteredTop = topLevel.filter(matches);

    const childProgress = (id: string) => {
        const kids = childrenOf(id);
        if (kids.length === 0) return 0;
        return Math.round((kids.filter((k) => k.status === 'Done').length / kids.length) * 100);
    };

    const startAdd = (parentId: string | null) => {
        setAddingTo(parentId);
        setDraftTitle('');
    };
    const submitAdd = (type: TaskItemType) => {
        if (!draftTitle.trim() || addingTo === null) return;
        onQuickAdd(addingTo, type);
        setAddingTo(null);
        setDraftTitle('');
    };

    const assigneeName = (t: Task) => {
        if (t.assigneeFullName) return t.assigneeFullName;
        const m = members.find((x) => x.id === t.assigneeId);
        return m?.fullName ?? m?.email ?? null;
    };

    const toggle = (id: string) =>
        setCollapsed((c) => ({ ...c, [id]: !c[id] }));

    const renderRow = (t: Task, depth: number, extraClass = '') => {
        const taskLabels = labels?.[t.id] ?? [];
        return (
            <tr
                key={t.id}
                className={`issue-row clickable ${extraClass} ${t.status === 'Done' ? 'issue-done' : ''}`}
                style={{ ['--depth' as string]: depth }}
                onClick={() => onOpenTask(t)}
            >
                <td className="issue-key instrument">{keyFor(tasks, t)}</td>
                <td className="issue-type">
                    <TypeBadge type={t.type} />
                </td>
                <td className="issue-title">
                    <span className="issue-title-text">{t.title}</span>
                    {taskLabels.length > 0 && (
                        <div className="issue-labels">
                            {taskLabels.map((l) => (
                                <span
                                    key={l.id}
                                    className="label-chip"
                                    style={{
                                        backgroundColor: `${l.color}20`,
                                        color: l.color,
                                        borderColor: `${l.color}40`,
                                    }}
                                >
                                    {l.name}
                                </span>
                            ))}
                        </div>
                    )}
                </td>
                <td>
                    <StatusPill status={t.status} />
                </td>
                <td>
                    <PriorityPill priority={t.priority} />
                </td>
                <td className="issue-assignee">
                    <Avatar name={assigneeName(t)} size={24} />
                </td>
                <td className="issue-actions" onClick={(e) => e.stopPropagation()}>
                    {canEdit && (
                        <KebabMenu label={`Actions for ${t.title}`}>
                            {(close) => (
                                <>
                                    <button
                                        className="kebab-item"
                                        onClick={() => {
                                            onToggleDone(t);
                                            close();
                                        }}
                                    >
                                        {t.status === 'Done' ? 'Reopen' : 'Mark done'}
                                    </button>
                                    <button
                                        className="kebab-item kebab-danger"
                                        onClick={() => {
                                            onDelete(t);
                                            close();
                                        }}
                                    >
                                        Delete
                                    </button>
                                </>
                            )}
                        </KebabMenu>
                    )}
                </td>
            </tr>
        );
    };

    return (
        <div className="issue-table-wrap">
            <div className="issue-toolbar">
                <input
                    className="issue-search"
                    placeholder="Search issues…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <div className="filter-wrap">
                    <button
                        className={`btn btn-ghost ${showFilters ? 'btn-active' : ''}`}
                        onClick={() => setShowFilters((s) => !s)}
                    >
                        ⛃ Filters
                    </button>
                    {showFilters && (
                        <div className="filter-popover card">
                            <label>
                                Status
                                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}>
                                    <option value="all">All</option>
                                    <option value="ToDo">To Do</option>
                                    <option value="InProgress">In Progress</option>
                                    <option value="Done">Done</option>
                                </select>
                            </label>
                            <label>
                                Priority
                                <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}>
                                    <option value="all">All</option>
                                    <option value="Critical">Critical</option>
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                            </label>
                            <label>
                                Type
                                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TaskItemType | 'all')}>
                                    <option value="all">All</option>
                                    <option value="Epic">Epic</option>
                                    <option value="Story">Story</option>
                                    <option value="Bug">Bug</option>
                                    <option value="Task">Task</option>
                                </select>
                            </label>
                        </div>
                    )}
                </div>
            </div>

            <div className="card table-card">
                <table className="table issue-table">
                    <thead>
                        <tr>
                            <th>Key</th>
                            <th>Type</th>
                            <th>Title</th>
                            <th>Status</th>
                            <th>Priority</th>
                            <th>Assignee</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEpics.length === 0 && filteredTop.length === 0 && (
                            <tr>
                                <td colSpan={7} className="muted">
                                    No issues match.
                                </td>
                            </tr>
                        )}

                        {filteredEpics.map((epic) => {
                            const kids = childrenOf(epic.id);
                            const isCollapsed = collapsed[epic.id];
                            return (
                                <EpicGroup
                                    key={epic.id}
                                    epic={epic}
                                    kids={kids}
                                    collapsed={!!isCollapsed}
                                    onToggle={() => toggle(epic.id)}
                                    renderRow={renderRow}
                                    canEdit={canEdit}
                                    onStartAdd={() => startAdd(epic.id)}
                                    adding={addingTo === epic.id}
                                    draftTitle={draftTitle}
                                    setDraftTitle={setDraftTitle}
                                    submitAdd={submitAdd}
                                    progress={childProgress(epic.id)}
                                />
                            );
                        })}

                        {filteredTop.map((t) => renderRow(t, 0))}

                        {canEdit && filteredTop.length > 0 && (
                            <tr className="inline-add-row">
                                <td colSpan={7}>
                                    {addingTo === 'root' ? (
                                        <QuickAddInput
                                            draftTitle={draftTitle}
                                            setDraftTitle={setDraftTitle}
                                            onCancel={() => setAddingTo(null)}
                                            onSubmit={() => submitAdd('Task')}
                                        />
                                    ) : (
                                        <button className="inline-add" onClick={() => startAdd('root')}>
                                            + Add issue
                                        </button>
                                    )}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function EpicGroup({
    epic,
    kids,
    collapsed,
    onToggle,
    renderRow,
    canEdit,
    onStartAdd,
    adding,
    draftTitle,
    setDraftTitle,
    submitAdd,
    progress,
}: {
    epic: Task;
    kids: Task[];
    collapsed: boolean;
    onToggle: () => void;
    renderRow: (t: Task, depth: number, extraClass?: string) => React.ReactNode;
    canEdit: boolean;
    onStartAdd: () => void;
    adding: boolean;
    draftTitle: string;
    setDraftTitle: (v: string) => void;
    submitAdd: (type: TaskItemType) => void;
    progress: number;
}) {
    return (
        <>
            <tr className="epic-row" onClick={onToggle}>
                <td colSpan={7}>
                    <div className="epic-header">
                        <span className={`chevron ${collapsed ? 'chevron-closed' : ''}`}>▾</span>
                        <TypeBadge type="Epic" />
                        <span className="epic-title">{epic.title}</span>
                        <span className="epic-count instrument">{kids.length}</span>
                        <span className="epic-progress">
                            <span className="mini-track">
                                <span className="mini-fill" style={{ width: `${progress}%` }} />
                            </span>
                            <span className="instrument small">{progress}%</span>
                        </span>
                    </div>
                </td>
            </tr>
            {!collapsed &&
                kids.map((k) => renderRow(k, 1, 'epic-child'))}
            {!collapsed && canEdit && (
                <tr className="inline-add-row epic-child">
                    <td colSpan={7}>
                        {adding ? (
                            <QuickAddInput
                                draftTitle={draftTitle}
                                setDraftTitle={setDraftTitle}
                                onCancel={onStartAdd}
                                onSubmit={() => submitAdd('Task')}
                            />
                        ) : (
                            <button className="inline-add" onClick={onStartAdd}>
                                + Add issue
                            </button>
                        )}
                    </td>
                </tr>
            )}
        </>
    );
}

function QuickAddInput({
    draftTitle,
    setDraftTitle,
    onCancel,
    onSubmit,
}: {
    draftTitle: string;
    setDraftTitle: (v: string) => void;
    onCancel: () => void;
    onSubmit: () => void;
}) {
    return (
        <span className="quick-add">
            <input
                autoFocus
                value={draftTitle}
                placeholder="Issue title…"
                onChange={(e) => setDraftTitle(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') onSubmit();
                    if (e.key === 'Escape') onCancel();
                }}
            />
            <button className="btn btn-primary small" onClick={onSubmit}>
                Add
            </button>
            <button className="btn btn-ghost small" onClick={onCancel}>
                Cancel
            </button>
        </span>
    );
}
