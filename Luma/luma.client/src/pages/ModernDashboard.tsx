import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reportsApi, activityApi } from '../api/endpoints';
import AppShell from '../components/AppShell';
import type { DashboardSummary, ActivityLog } from '../types/types';
import { FolderOpen, Activity, Plus } from 'lucide-react';

interface DaySchedule {
    day: string;
    date: string;
    blocks: { id: string; title: string; time: string; duration: string; color: string; status: string }[];
}

const generateWeekDays = (): DaySchedule[] => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const currentDay = today.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    return days.map((day, i) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return { day, date: dateStr, blocks: [] };
    });
};

function getActivityColor(action: string): string {
    const ACTIVITY_COLORS: Record<string, string> = {
        'TaskCreated': '#ADC6FF',
        'TaskUpdated': '#FFE58F',
        'TaskCompleted': '#B7E4A7',
        'TaskMoved': '#D3ADF7',
        'CommentAdded': '#ADC6FF',
        'MemberAdded': '#D3ADF7',
        'ProjectCreated': '#FFE58F',
    };
    return ACTIVITY_COLORS[action] ?? '#A5A5A5';
}

function formatActivityAction(action: string): string {
    return action.replace(/([A-Z])/g, ' $1').trim();
}

function HealthBadge({ status }: { status: string }) {
    const lower = status.toLowerCase();
    const variant = (() => {
        if (lower === 'healthy' || lower === 'ontrack') return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
        if (lower === 'atrisk' || lower === 'atrisk') return 'text-amber-400 border-amber-400/30 bg-amber-400/10';
        return 'text-red-400 border-red-400/30 bg-red-400/10';
    })();
    return (
        <span className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded border ${variant}`}>
            {status}
        </span>
    );
}

export default function ModernDashboard() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const weekDays = useMemo<DaySchedule[]>(() => generateWeekDays(), []);
    const [stats, setStats] = useState<DashboardSummary | null>(null);
    const [activities, setActivities] = useState<ActivityLog[]>([]);

    const loadStats = async () => {
        try {
            const { data } = await reportsApi.dashboard();
            setStats(data);
        } catch {
            setStats({ totalProjects: 0, totalTasks: 0, completedTasks: 0, inProgressTasks: 0, overdueTasks: 0, overallCompletionRate: 0, projects: [] });
        }
    };

    const loadActivity = async () => {
        try {
            const { data } = await activityApi.mine(1, 10);
            setActivities(data);
        } catch {
            setActivities([]);
        }
    };

    useEffect(() => {
        void loadStats();
        void loadActivity();
    }, []);

    const userName = currentUser?.fullName?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'User';

    const statItems = [
        { label: 'Total Projects', value: stats?.totalProjects ?? 0 },
        { label: 'Active', value: stats?.inProgressTasks ?? 0 },
        { label: 'Completed', value: stats?.completedTasks ?? 0 },
        { label: 'Overdue', value: stats?.overdueTasks ?? 0 },
    ];

    const recentActivities = activities.slice(0, 6);

    return (
        <AppShell>
            <div className="max-w-7xl mx-auto p-4 md:p-5 space-y-5">
                {/* Welcome Header */}
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-base font-semibold text-text-primary">Stay up to date, {userName}</h1>
                        <p className="text-xs text-text-muted">Here's what's happening across your projects.</p>
                    </div>
                    <button
                        onClick={() => navigate('/projects')}
                        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-surface-1 border border-border-default rounded-lg text-text-primary hover:bg-surface-2 transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        New Task
                    </button>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {statItems.map((stat) => (
                        <div key={stat.label} className="bg-surface-1 border border-border-subtle rounded-lg p-3">
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className="w-1 h-1 rounded-full bg-accent mr-2 inline-block" />
                                <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">{stat.label}</span>
                            </div>
                            <div className="text-xl font-semibold text-text-primary tabular-nums font-mono">{stat.value}</div>
                        </div>
                    ))}
                </div>

                {/* Project Progress Section */}
                <section>
                    <h2 className="text-sm font-semibold text-text-primary mb-3">Project Progress</h2>
                    {stats?.projects && stats.projects.length > 0 ? (
                        <div className="bg-surface-1 border border-border-subtle rounded-lg divide-y divide-border-subtle">
                            {stats.projects.slice(0, 6).map((project) => (
                                <div
                                    key={project.projectId}
                                    className="flex items-center gap-3 py-2.5 px-3 hover:bg-surface-2/50 rounded-md transition-colors"
                                >
                                    <span className="text-sm font-medium text-text-primary flex-1 truncate">{project.projectName}</span>
                                    <div className="h-1 flex-1 max-w-[120px] bg-surface-2 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-accent rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min(100, project.completionPercentage)}%` }}
                                        />
                                    </div>
                                    <span className="text-[11px] font-mono tabular-nums text-text-muted w-[36px] text-right">{Math.round(project.completionPercentage)}%</span>
                                    <span className="text-[11px] text-text-muted">{project.completedTasks}/{project.totalTasks} tasks</span>
                                    <HealthBadge status={project.healthStatus} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-surface-1 border border-border-subtle rounded-lg p-8 flex flex-col items-center justify-center text-text-muted">
                            <FolderOpen className="w-8 h-8 mb-2 text-text-muted" />
                            <p className="text-sm">No projects yet. Create your first project to get started.</p>
                        </div>
                    )}
                </section>

                {/* Recent Activity Section */}
                <section>
                    <h2 className="text-sm font-semibold text-text-primary mb-3">Recent Activity</h2>
                    {recentActivities.length > 0 ? (
                        <div className="bg-surface-1 border border-border-subtle rounded-lg divide-y divide-border-subtle">
                            {recentActivities.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-start gap-2.5 py-2.5 px-3 hover:bg-surface-2/50 transition-colors"
                                >
                                    <div
                                        className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                                        style={{ backgroundColor: getActivityColor(item.action) }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium text-text-primary">{formatActivityAction(item.action)}</div>
                                        <div className="text-xs text-text-muted truncate">{item.description}</div>
                                    </div>
                                    <span className="text-[10px] font-mono tabular-nums text-text-muted flex-shrink-0">
                                        {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-surface-1 border border-border-subtle rounded-lg p-8 flex flex-col items-center justify-center text-text-muted">
                            <Activity className="w-8 h-8 mb-2 text-text-muted" />
                            <p className="text-sm">No recent activity.</p>
                        </div>
                    )}
                </section>

                {/* Weekly Calendar Section */}
                <section>
                    <h2 className="text-sm font-semibold text-text-primary mb-3">This Week</h2>
                    <div className="grid grid-cols-7 gap-2">
                        {weekDays.map((day) => (
                            <div
                                key={day.day}
                                className="bg-surface-1 border border-border-subtle rounded-lg p-2 min-h-[100px]"
                            >
                                <div className="text-[10px] font-medium text-text-muted uppercase tracking-wider text-center mb-1">{day.day}</div>
                                <div className="text-xs font-medium text-text-primary text-center mb-1.5">{day.date}</div>
                                <div className="space-y-1">
                                    {day.blocks.length === 0 && (
                                        <div className="text-[10px] text-text-muted text-center py-2 opacity-60">No events</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </AppShell>
    );
}