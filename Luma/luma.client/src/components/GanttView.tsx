import { useEffect, useRef } from 'react';
import type { Task } from '../types/types';
import { Gantt } from './gantt-shim';

interface GanttViewProps {
    tasks: Task[];
}

const STATUS_COLOR: Record<string, string> = {
    ToDo: '#94a3b8',
    InProgress: '#3b82f6',
    Done: '#22c55e',
};

export default function GanttView({ tasks }: GanttViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const ganttRef = useRef<InstanceType<typeof Gantt> | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const today = new Date();
        const start = new Date(today);
        start.setDate(start.getDate() - 7);

        const mapped = tasks.map((t) => {
            const due = t.dueDate ? new Date(t.dueDate) : new Date(start);
            const begin = new Date(due);
            begin.setDate(begin.getDate() - 3);
            return {
                id: t.id,
                name: t.title,
                start: begin.toISOString().slice(0, 10),
                end: due.toISOString().slice(0, 10),
                progress: t.status === 'Done' ? 100 : t.status === 'InProgress' ? 50 : 0,
                custom_class: `bar-${t.status}`,
                dependencies: '',
            };
        });

        containerRef.current.innerHTML = '';
        ganttRef.current = new Gantt(containerRef.current, mapped, {
            view_mode: 'Day',
            date_format: 'YYYY-MM-DD',
            readonly: true,
            bar_height: 22,
        });

        return () => {
            ganttRef.current?.clear?.();
            ganttRef.current = null;
        };
    }, [tasks]);

    if (tasks.length === 0) {
        return <p className="muted small">No tasks to display on the timeline.</p>;
    }

    return (
        <div className="gantt-wrap">
            <div ref={containerRef} className="gantt" />
            <div className="gantt-legend">
                {Object.entries(STATUS_COLOR).map(([key, color]) => (
                    <span key={key} className="legend-item">
                        <span className="legend-dot" style={{ background: color }} />
                        {key}
                    </span>
                ))}
            </div>
        </div>
    );
}
