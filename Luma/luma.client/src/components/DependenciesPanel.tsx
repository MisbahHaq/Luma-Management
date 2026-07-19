import { useEffect, useState, type FormEvent } from 'react';
import { dependenciesApi } from '../api/endpoints';
import type { Task, TaskDependency } from '../types/types';

interface DependenciesPanelProps {
    projectId: string;
    tasks: Task[];
    canEdit: boolean;
}

export default function DependenciesPanel({
    projectId,
    tasks,
    canEdit,
}: DependenciesPanelProps) {
    const [deps, setDeps] = useState<TaskDependency[]>([]);
    const [taskId, setTaskId] = useState('');
    const [dependsOnTaskId, setDependsOnTaskId] = useState('');
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        try {
            const { data } = await dependenciesApi.forProject(projectId);
            setDeps(data);
        } catch {
            setError('Failed to load dependencies.');
        }
    };

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    const add = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!taskId || !dependsOnTaskId) return;
        if (taskId === dependsOnTaskId) {
            setError('A task cannot depend on itself.');
            return;
        }
        try {
            await dependenciesApi.create({
                taskId,
                dependsOnTaskId,
                type: 'BlockedBy',
            });
            setTaskId('');
            setDependsOnTaskId('');
            await load();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setError(msg ?? 'Failed to add dependency.');
        }
    };

    const remove = async (id: string) => {
        try {
            await dependenciesApi.remove(id);
            await load();
        } catch {
            setError('Failed to remove dependency.');
        }
    };

    return (
        <div className="card deps-panel">
            <h4>Task dependencies</h4>
            {error && <div className="alert alert-error">{error}</div>}

            {canEdit && (
                <form className="dep-form" onSubmit={add}>
                    <select value={taskId} onChange={(e) => setTaskId(e.target.value)}>
                        <option value="">Task…</option>
                        {tasks.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.title}
                            </option>
                        ))}
                    </select>
                    <span className="muted">depends on</span>
                    <select value={dependsOnTaskId} onChange={(e) => setDependsOnTaskId(e.target.value)}>
                        <option value="">Blocking task…</option>
                        {tasks.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.title}
                            </option>
                        ))}
                    </select>
                    <button type="submit" className="btn btn-primary small" disabled={!taskId || !dependsOnTaskId}>
                        Add
                    </button>
                </form>
            )}

            {deps.length === 0 ? (
                <p className="muted small">No dependencies defined.</p>
            ) : (
                <ul className="dep-list">
                    {deps.map((d) => (
                        <li key={d.id} className="dep">
                            <span>
                                <strong>{d.taskTitle}</strong> blocked by{' '}
                                <strong>{d.dependsOnTaskTitle}</strong>
                            </span>
                            {canEdit && (
                                <button className="btn btn-ghost small" onClick={() => void remove(d.id)}>
                                    Remove
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {tasks.length === 0 && <p className="muted small">Add tasks to manage dependencies.</p>}
        </div>
    );
}
