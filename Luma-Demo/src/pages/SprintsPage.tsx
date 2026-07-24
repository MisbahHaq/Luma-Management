import { useState, useMemo } from 'react';
import AppShell from '../components/AppShell';
import { mockSprints, mockTasks, SPRINT_STATUS_LABELS } from '../api/mock';
import type { Sprint } from '../types';
import { ChevronRight } from 'lucide-react';

export default function SprintsPage() {
    const [selected, setSelected] = useState<Sprint | null>(null);

    const sprintsWithCounts = useMemo(() => {
        return mockSprints.map((s) => {
            const tasks = mockTasks.filter((t) => t.sprintId === s.id);
            const done = tasks.filter((t) => t.status === 'Done').length;
            return { ...s, taskCount: tasks.length, completedCount: done };
        });
    }, []);

    return (
        <AppShell breadcrumb={<span>Workspace</span>} title="Sprints">
            <div className="max-w-7xl mx-auto space-y-4">
                <div className="bg-surface-1 border border-border-subtle rounded-md overflow-hidden">
                    {sprintsWithCounts.length === 0 ? (
                        <div className="px-3 py-10 text-center text-xs text-text-muted">No sprints yet.</div>
                    ) : (
                        sprintsWithCounts.map((s) => (
                            <div
                                key={s.id}
                                className="group flex items-center gap-3 px-3 py-2.5 border-b border-border-subtle last:border-0 hover:bg-surface-2/50 cursor-pointer transition-colors"
                                onClick={() => setSelected(s)}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-text-primary truncate">{s.name}</div>
                                    <div className="text-[11px] text-text-muted mt-0.5">
                                        {s.taskCount} tasks · {s.completedCount} completed · {SPRINT_STATUS_LABELS[s.status]}
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </div>
                        ))
                    )}
                </div>

                {selected && (
                    <div className="bg-surface-1 border border-border-subtle rounded-md p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium text-text-primary">{selected.name}</h3>
                            <button onClick={() => setSelected(null)} className="text-xs text-text-muted hover:text-text-primary">Close</button>
                        </div>
                        <p className="text-xs text-text-muted mb-3">{selected.description}</p>
                        <div className="text-xs text-text-muted">
                            {selected.startDate && <span>Start: {new Date(selected.startDate).toLocaleDateString()}</span>}
                            {selected.startDate && selected.endDate && <span className="mx-2">·</span>}
                            {selected.endDate && <span>End: {new Date(selected.endDate).toLocaleDateString()}</span>}
                        </div>
                    </div>
                )}
            </div>
        </AppShell>
    );
}
