import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { reportsApi, activityApi } from '../api/endpoints';
import AppShell from '../components/AppShell';
import type { DashboardSummary, ActivityLog } from '../types/types';

interface TimeBlock {
    id: string;
    title: string;
    time: string;
    duration: string;
    color: string;
    status: string;
    attendees?: string[];
}

interface DaySchedule {
    day: string;
    date: string;
    blocks: TimeBlock[];
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

const ACTIVITY_COLORS: Record<string, string> = {
    'TaskCreated': '#ADC6FF',
    'TaskUpdated': '#FFE58F',
    'TaskCompleted': '#B7E4A7',
    'TaskMoved': '#D3ADF7',
    'CommentAdded': '#ADC6FF',
    'MemberAdded': '#D3ADF7',
    'ProjectCreated': '#FFE58F',
};

function getActivityColor(action: string): string {
    return ACTIVITY_COLORS[action] ?? '#A5A5A5';
}

function formatActivityAction(action: string): string {
    return action.replace(/([A-Z])/g, ' $1').trim();
}

export default function ModernDashboard() {
    const { currentUser } = useAuth();
    const { currentWorkspace: _currentWorkspace } = useWorkspace();
    const navigate = useNavigate();
    const weekDays = useMemo<DaySchedule[]>(() => generateWeekDays(), []);
    const [stats, setStats] = useState<DashboardSummary | null>(null);
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [viewMode, setViewMode] = useState<'Today' | 'Week' | 'Month'>('Week');

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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadStats();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadActivity();
    }, []);

    const userName = currentUser?.fullName?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'User';

    const statCards = [
        { label: 'Total Projects', value: stats?.totalProjects ?? 0, color: '#FFE58F', icon: '📁' },
        { label: 'Active Tasks', value: stats?.inProgressTasks ?? 0, color: '#ADC6FF', icon: '⚡' },
        { label: 'Completed', value: stats?.completedTasks ?? 0, color: '#B7E4A7', icon: '✓' },
        { label: 'Overdue', value: stats?.overdueTasks ?? 0, color: '#FFADAD', icon: '!' },
    ];

    const recentActivities = activities.slice(0, 6);

    return (
        <AppShell>
            {/* Greeting + Actions */}
            <div className="modern-greeting-row">
                <div>
                    <h1 className="modern-greeting">Stay up to date, {userName}</h1>
                    <p className="modern-subtitle">Here's what's happening across your projects this week.</p>
                </div>
                <div className="modern-actions">
                    <button className="modern-btn-primary" onClick={() => navigate('/projects')}>+ Add Task</button>
                    <div className="modern-view-toggle">
                        {(['Today', 'Week', 'Month'] as const).map((mode) => (
                            <button
                                key={mode}
                                className={`modern-view-btn ${viewMode === mode ? 'active' : ''}`}
                                onClick={() => setViewMode(mode)}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Stats Bento Row */}
            <div className="modern-stats-row">
                {statCards.map((stat) => (
                    <div
                        key={stat.label}
                        className="modern-stat-card modern-stat-colored"
                        style={{ '--stat-color': stat.color } as React.CSSProperties}
                    >
                        <div className="modern-stat-icon">{stat.icon}</div>
                        <div className="modern-stat-info">
                            <div className="modern-stat-value">{stat.value}</div>
                            <div className="modern-stat-label">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Weekly Calendar Bento */}
            <div className="modern-calendar-bento">
                <div className="modern-calendar-header">
                    <h2 className="modern-calendar-title">Weekly Schedule</h2>
                    <span className="modern-calendar-subtitle">
                        {weekDays[0]?.date} — {weekDays[weekDays.length - 1]?.date}
                    </span>
                </div>
                <div className="modern-calendar-grid">
                    {weekDays.map((day) => (
                        <div
                            key={day.day}
                            className={`modern-calendar-col ${day.day === 'Wed' ? 'today-col' : ''}`}
                        >
                            <div className="modern-calendar-col-head">
                                <span className="modern-day-name">{day.day}</span>
                                <span className={`modern-day-date ${day.day === 'Wed' ? 'today-date' : ''}`}>{day.date}</span>
                            </div>
                            <div className="modern-calendar-col-body">
                                {day.blocks.length === 0 && (
                                    <div className="modern-empty-block">No events</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Bento Row */}
            <div className="modern-bottom-bento">
                {/* Project Progress */}
                <div className="modern-bento-card modern-bento-wide">
                    <h3 className="modern-bento-title">Project Progress</h3>
                    <div className="modern-progress-list">
                        {stats?.projects?.slice(0, 4).map((project) => (
                            <div key={project.projectId} className="modern-progress-item">
                                <div className="modern-progress-item-header">
                                    <span className="modern-progress-item-name">{project.projectName}</span>
                                    <span className="modern-progress-item-pct">{project.completionPercentage}%</span>
                                </div>
                                <div className="modern-progress-track">
                                    <div
                                        className="modern-progress-fill"
                                        style={{ width: `${project.completionPercentage}%` }}
                                    />
                                </div>
                                <div className="modern-progress-item-meta">
                                    <span>{project.completedTasks}/{project.totalTasks} tasks</span>
                                    <span className={`modern-health-${project.healthStatus.toLowerCase()}`}>{project.healthStatus}</span>
                                </div>
                            </div>
                        )) || (
                            <p className="modern-muted-text">Open a project to see progress.</p>
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="modern-bento-card">
                    <h3 className="modern-bento-title">Recent Activity</h3>
                    <div className="modern-activity-list">
                        {recentActivities.length > 0 ? recentActivities.map((item) => (
                            <div key={item.id} className="modern-activity-item">
                                <div className="modern-activity-dot" style={{ backgroundColor: getActivityColor(item.action) }} />
                                <div className="modern-activity-content">
                                    <div className="modern-activity-action">{formatActivityAction(item.action)}</div>
                                    <div className="modern-activity-target">{item.description}</div>
                                </div>
                                <span className="modern-activity-time">{new Date(item.createdAt).toLocaleDateString()}</span>
                            </div>
                        )) : (
                            <p className="modern-muted-text">No recent activity.</p>
                        )}
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
