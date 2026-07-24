import { useMemo, useState, useRef, useEffect } from 'react';
import type { Label, ProjectMemberSummary, Task, TaskItemType, TaskPriority, TaskStatus } from '../types/types';
import Avatar from './Avatar';
import KebabMenu from './KebabMenu';
import { ChevronRight, Layers, FileText, Bug, CheckSquare, Flame, AlertTriangle, Minus, ArrowDown, Inbox, Plus, X, Search, Filter } from 'lucide-react';

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

const STATUS_LABEL: Record<TaskStatus, string> = {
    ToDo: 'Backlog',
    InProgress: 'In Progress',
    Review: 'Review',
    Done: 'Done',
};

const STATUS_COLORS: Record<TaskStatus, string> = {
    ToDo: 'bg-surface-1 text-text-secondary border-border-subtle',
    InProgress: 'bg-accent-soft text-accent border-accent/20',
    Review: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Done: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const TYPE_COLORS: Record<TaskItemType, string> = {
    Epic: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    Story: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Bug: 'bg-red-500/10 text-red-400 border-red-500/20',
    Task: 'bg-surface-1 text-text-secondary border-border-subtle',
};

function FilterSelect({
    value,
    onChange,
    options,
}: {
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
}) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="bg-surface-1 border border-border-subtle text-text-primary text-xs rounded-md px-2 py-1.5 focus:outline-none focus:border-accent transition-colors cursor-pointer"
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
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
    const ref = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (ref.current) ref.current.focus();
    }, []);

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 flex-1">
            <input
                ref={ref}
                type="text"
                value={draftTitle}
                placeholder="Issue title…"
                onChange={(e) => setDraftTitle(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') onSubmit();
                    if (e.key === 'Escape') onCancel();
                }}
                className="flex-1 bg-surface-1 border border-border-subtle rounded-md px-2 py-1 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
            />
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
            <div
                className="flex items-center gap-3 px-3 py-2 bg-surface-2/80 border-b border-border-subtle cursor-pointer hover:bg-surface-2 transition-colors"
                onClick={onToggle}
            >
                <button
                    type="button"
                    className="flex-shrink-0 text-text-muted hover:text-text-secondary transition-colors"
                    onClick={(e) => { e.stopPropagation(); onToggle(); }}
                >
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-150 ${collapsed ? '' : 'rotate-90'}`} />
                </button>

                <div className="flex-shrink-0">
                    <span className="inline-flex items-center border rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-purple-500/10 text-purple-400 border-purple-500/20">
                        <Layers className="w-3 h-3" />
                        <span className="ml-1 hidden sm:inline">Epic</span>
                    </span>
                </div>

                <span className="font-mono text-[11px] text-text-muted tabular-nums w-[80px] flex-shrink-0">
                    {epic.issueKey}
                </span>

                <span className="text-sm font-medium text-text-primary truncate flex-1 min-w-0">
                    {epic.title}
                </span>

                <span className="text-[11px] text-text-muted tabular-nums flex-shrink-0">
                    {kids.length}
                </span>

                <div className="h-1 flex-1 max-w-[100px] bg-surface-1 rounded-full overflow-hidden flex-shrink-0">
                    <div
                        className="h-full bg-accent rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <span className="text-[10px] font-mono tabular-nums text-text-muted flex-shrink-0">
                    {progress}%
                </span>
            </div>

            {!collapsed && kids.map((k) => renderRow(k, 1, 'pl-10'))}
            {!collapsed && canEdit && (
                <div className="bg-surface-2/30 border-b border-border-subtle">
                    {adding ? (
                        <QuickAddInput
                            draftTitle={draftTitle}
                            setDraftTitle={setDraftTitle}
                            onCancel={onStartAdd}
                            onSubmit={() => submitAdd('Task')}
                        />
                    ) : (
                        <button
                            type="button"
                            className="w-full text-left text-xs text-text-muted hover:text-text-secondary px-3 py-1.5 transition-colors"
                            onClick={onStartAdd}
                        >
                            + Add issue
                        </button>
                    )}
                </div>
            )}
        </>
    );
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

    const TypeIcon = ({ type }: { type: TaskItemType }) => {
        const iconMap: Record<TaskItemType, React.ComponentType<{ className?: string }>> = {
            Epic: Layers,
            Story: FileText,
            Bug: Bug,
            Task: CheckSquare,
        };
        const colorMap: Record<TaskItemType, string> = {
            Epic: 'text-purple-400',
            Story: 'text-blue-400',
            Bug: 'text-red-400',
            Task: 'text-gray-400',
        };
        const Icon = iconMap[type];
        return <Icon className={`w-3.5 h-3.5 ${colorMap[type]}`} />;
    };

    const PriorityIcon = ({ priority }: { priority: TaskPriority }) => {
        const iconMap: Record<TaskPriority, React.ComponentType<{ className?: string }>> = {
            Critical: Flame,
            High: AlertTriangle,
            Medium: Minus,
            Low: ArrowDown,
        };
        const colorMap: Record<TaskPriority, string> = {
            Critical: 'text-red-400',
            High: 'text-amber-400',
            Medium: 'text-gray-400',
            Low: 'text-blue-400',
        };
        const Icon = iconMap[priority];
        return <Icon className={`w-3.5 h-3.5 ${colorMap[priority]}`} />;
    };

    const renderRow = (t: Task, _depth: number, extraClass?: string) => {
        const taskLabels = labels?.[t.id] ?? [];
        const isDone = t.status === 'Done';
        return (
            <div
                key={t.id}
                className={`group flex items-center gap-3 px-3 py-1.5 border-b border-border-subtle hover:bg-surface-2/50 cursor-pointer transition-colors duration-150 ${extraClass ?? ''}`}
                onClick={() => onOpenTask(t)}
            >
                {t.type === 'Epic' && (
                    <button
                        type="button"
                        className="flex-shrink-0 text-text-muted hover:text-text-secondary transition-colors"
                        onClick={(e) => { e.stopPropagation(); toggle(t.id); }}
                    >
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-150 ${collapsed[t.id] ? '' : 'rotate-90'}`} />
                    </button>
                )}

                <div className="flex-shrink-0">
                    <span className={`inline-flex items-center border rounded-md px-1.5 py-0.5 text-[10px] font-medium ${TYPE_COLORS[t.type]}`}>
                        <TypeIcon type={t.type} />
                        <span className="ml-1 hidden sm:inline">{t.type}</span>
                    </span>
                </div>

                <span className="font-mono text-[11px] text-text-muted tabular-nums w-[80px] flex-shrink-0 min-w-0 truncate">
                    {keyFor(tasks, t)}
                </span>

                <span className={`text-sm font-medium truncate flex-1 min-w-0 ${isDone ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                    {t.title}
                </span>

                {taskLabels.length > 0 && (
                    <div className="hidden md:flex items-center gap-1 flex-wrap max-w-[200px] flex-shrink-0">
                        {taskLabels.slice(0, 3).map((l) => (
                            <span
                                key={l.id}
                                className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded border truncate max-w-[80px]"
                                style={{
                                    backgroundColor: `${l.color}15`,
                                    color: l.color,
                                    borderColor: `${l.color}35`,
                                }}
                            >
                                {l.name}
                            </span>
                        ))}
                    </div>
                )}

                <span className={`hidden sm:inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border ${STATUS_COLORS[t.status]}`}>
                    {STATUS_LABEL[t.status]}
                </span>

                <span className="hidden sm:flex items-center flex-shrink-0">
                    <PriorityIcon priority={t.priority} />
                </span>

                <span className="flex-shrink-0">
                    <Avatar name={assigneeName(t)} size={20} />
                </span>

                <div className="hidden group-hover:flex items-center gap-1 flex-shrink-0">
                    {canEdit && (
                        <>
                            <button
                                type="button"
                                className="p-1 rounded-md hover:bg-surface-1 text-text-muted hover:text-text-secondary transition-colors"
                                onClick={(e) => { e.stopPropagation(); onToggleDone(t); }}
                                title={isDone ? 'Reopen' : 'Mark done'}
                            >
                                {isDone ? <X className="w-3.5 h-3.5" /> : <CheckSquare className="w-3.5 h-3.5" />}
                            </button>
                            <button
                                type="button"
                                className="p-1 rounded-md hover:bg-surface-1 text-text-muted hover:text-red-400 transition-colors"
                                onClick={(e) => { e.stopPropagation(); onDelete(t); }}
                                title="Delete"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </>
                    )}
                    <KebabMenu label={`Actions for ${t.title}`}>
                        {(close) => (
                            <>
                                <button
                                    type="button"
                                    className="w-full text-left text-xs px-2 py-1.5 hover:bg-surface-2 rounded transition-colors"
                                    onClick={() => { onToggleDone(t); close(); }}
                                >
                                    {isDone ? 'Reopen' : 'Mark done'}
                                </button>
                                <button
                                    type="button"
                                    className="w-full text-left text-xs px-2 py-1.5 hover:bg-surface-2 rounded transition-colors text-red-400"
                                    onClick={() => { onDelete(t); close(); }}
                                >
                                    Delete
                                </button>
                            </>
                        )}
                    </KebabMenu>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search issues…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full bg-surface-1 border border-border-subtle rounded-md pl-9 pr-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                    />
                </div>
                <button
                    type="button"
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border transition-colors ${showFilters ? 'bg-surface-2 border-border-default text-text-primary' : 'border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-default'}`}
                    onClick={() => setShowFilters((s) => !s)}
                >
                    <Filter className="w-3.5 h-3.5" />
                    Filters
                </button>
                {showFilters && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <FilterSelect
                            value={statusFilter}
                            onChange={(v) => setStatusFilter(v as TaskStatus | 'all')}
                            options={[
                                { value: 'all', label: 'All' },
                                { value: 'ToDo', label: 'Backlog' },
                                { value: 'InProgress', label: 'In Progress' },
                                { value: 'Review', label: 'Review' },
                                { value: 'Done', label: 'Done' },
                            ]}
                        />
                        <FilterSelect
                            value={priorityFilter}
                            onChange={(v) => setPriorityFilter(v as TaskPriority | 'all')}
                            options={[
                                { value: 'all', label: 'All' },
                                { value: 'Critical', label: 'Critical' },
                                { value: 'High', label: 'High' },
                                { value: 'Medium', label: 'Medium' },
                                { value: 'Low', label: 'Low' },
                            ]}
                        />
                        <FilterSelect
                            value={typeFilter}
                            onChange={(v) => setTypeFilter(v as TaskItemType | 'all')}
                            options={[
                                { value: 'all', label: 'All' },
                                { value: 'Epic', label: 'Epic' },
                                { value: 'Story', label: 'Story' },
                                { value: 'Bug', label: 'Bug' },
                                { value: 'Task', label: 'Task' },
                            ]}
                        />
                    </div>
                )}
            </div>

            <div className="border border-border-subtle rounded-md overflow-hidden bg-surface-1">
                {filteredEpics.length === 0 && filteredTop.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Inbox className="w-10 h-10 mb-3 text-text-muted" />
                        <p className="text-text-primary font-medium mb-1 text-sm">No issues found</p>
                        <p className="text-text-secondary text-xs">Try adjusting your filters or create a new issue.</p>
                    </div>
                ) : (
                    <>
                        {filteredEpics.map((epic) => {
                            const isCollapsed = collapsed[epic.id];
                            return (
                                <EpicGroup
                                    key={epic.id}
                                    epic={epic}
                                    kids={childrenOf(epic.id)}
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

                        {canEdit && (
                            <div
                                className="group flex items-center gap-3 px-3 py-2 border-t border-border-subtle text-text-muted hover:text-text-secondary cursor-pointer transition-colors"
                                onClick={() => { if (addingTo !== 'root') startAdd('root'); }}
                            >
                                {addingTo === 'root' ? (
                                    <QuickAddInput
                                        draftTitle={draftTitle}
                                        setDraftTitle={setDraftTitle}
                                        onCancel={() => setAddingTo(null)}
                                        onSubmit={() => submitAdd('Task')}
                                    />
                                ) : (
                                    <>
                                        <Plus className="w-3.5 h-3.5" />
                                        <span className="text-xs">Add issue</span>
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}