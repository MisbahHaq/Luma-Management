import { useEffect, useState, type FormEvent } from 'react';
import { timeLogsApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import type { Task, TimeLog } from '../types/types';

interface TimeTrackingProps {
    projectId: string;
    tasks: Task[];
    canEdit: boolean;
}

export default function TimeTracking({ projectId, tasks, canEdit }: TimeTrackingProps) {
    const { currentUser } = useAuth();
    const [logs, setLogs] = useState<TimeLog[]>([]);
    const [taskId, setTaskId] = useState('');
    const [hours, setHours] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        try {
            const { data } = await timeLogsApi.forProject(projectId, 1, 100);
            setLogs(data.items);
        } catch {
            setError('Failed to load time logs.');
        }
    };

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    const totalHours = logs.reduce((sum, l) => sum + l.hours, 0);

    const add = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        const h = parseFloat(hours);
        if (!taskId || isNaN(h) || h <= 0) {
            setError('Select a task and enter valid hours.');
            return;
        }
        setSaving(true);
        try {
            await timeLogsApi.create({
                taskId,
                hours: h,
                date,
                note: note.trim() || null,
            });
            setTaskId('');
            setHours('');
            setNote('');
            setDate(new Date().toISOString().slice(0, 10));
            await load();
        } catch {
            setError('Failed to log time.');
        } finally {
            setSaving(false);
        }
    };

    const remove = async (id: string) => {
        try {
            await timeLogsApi.remove(id);
            await load();
        } catch {
            setError('Failed to delete time log.');
        }
    };

    const myLogs = currentUser ? logs.filter((l) => l.userId === currentUser.id) : [];
    const myTotal = myLogs.reduce((sum, l) => sum + l.hours, 0);

    return (
        <div className="card timesheet">
            <div className="section-head">
                <h4>Time tracking</h4>
                <small className="muted">
                    {totalHours.toFixed(1)}h logged · you: {myTotal.toFixed(1)}h
                </small>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <form className="time-form" onSubmit={add}>
                <select value={taskId} onChange={(e) => setTaskId(e.target.value)}>
                    <option value="">Task…</option>
                    {tasks.map((t) => (
                        <option key={t.id} value={t.id}>
                            {t.title}
                        </option>
                    ))}
                </select>
                <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    placeholder="Hours"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                />
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                <input
                    placeholder="Note (optional)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                />
                <button type="submit" className="btn btn-primary small" disabled={saving}>
                    {saving ? 'Saving...' : 'Log time'}
                </button>
            </form>

            {logs.length === 0 ? (
                <p className="muted small">No time logged yet.</p>
            ) : (
                <table className="table time-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Task</th>
                            <th>User</th>
                            <th>Hours</th>
                            <th>Note</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((l) => (
                            <tr key={l.id}>
                                <td>{new Date(l.date).toLocaleDateString()}</td>
                                <td>{l.taskTitle}</td>
                                <td>{l.userFullName ?? 'Unknown'}</td>
                                <td>{l.hours.toFixed(2)}</td>
                                <td className="muted">{l.note ?? ''}</td>
                                <td>
                                    {canEdit && l.userId === currentUser?.id && (
                                        <button
                                            className="btn btn-ghost small"
                                            onClick={() => void remove(l.id)}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
