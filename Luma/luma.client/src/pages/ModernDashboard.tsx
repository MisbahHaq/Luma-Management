import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reportsApi } from '../api/endpoints';
import AppShell from '../components/AppShell';
import type { DashboardSummary } from '../types/types';

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

        const blocks: TimeBlock[] = [];
        if (i < 5) {
            const blockTemplates = [
                { id: '1', title: 'Team Standup', time: '09:00', duration: '30m', color: '#ADC6FF', status: 'In progress...' },
                { id: '2', title: 'Design Review', time: '10:30', duration: '1h', color: '#D3ADF7', status: 'Upcoming' },
                { id: '3', title: 'Sprint Planning', time: '14:00', duration: '2h', color: '#FFE58F', status: 'Scheduled' },
            ];
            const numBlocks = Math.floor(Math.random() * 2) + 1;
            for (let j = 0; j < numBlocks; j++) {
                blocks.push(blockTemplates[j]);
            }
        }
        return { day, date: dateStr, blocks };
    });
};

export default function ModernDashboard() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const weekDays = useMemo<DaySchedule[]>(() => generateWeekDays(), []);
    const [stats, setStats] = useState<DashboardSummary | null>(null);
    const [viewMode, setViewMode] = useState<'Today' | 'Week' | 'Month'>('Week');

    const loadStats = async () => {
        try {
            const { data } = await reportsApi.dashboard();
            setStats(data);
        } catch {
            setStats({ totalProjects: 0, totalTasks: 0, completedTasks: 0, inProgressTasks: 0, overdueTasks: 0, overallCompletionRate: 0, projects: [] });
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadStats();
    }, []);

    const userName = currentUser?.fullName?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'User';

    const statCards = [
        { label: 'Total Projects', value: stats?.totalProjects ?? 0, color: '#FFE58F', icon: '📁' },
        { label: 'Active Tasks', value: stats?.inProgressTasks ?? 0, color: '#ADC6FF', icon: '⚡' },
        { label: 'Completed', value: stats?.completedTasks ?? 0, color: '#B7E4A7', icon: '✓' },
        { label: 'Overdue', value: stats?.overdueTasks ?? 0, color: '#FFADAD', icon: '!' },
    ];

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
                        className="modern-stat-card"
                        style={{ backgroundColor: stat.color }}
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
                                {day.blocks.map((block) => (
                                    <div
                                        key={block.id}
                                        className="modern-time-block"
                                        style={{ backgroundColor: block.color }}
                                    >
                                        <div className="modern-time-block-time">{block.time}</div>
                                        <div className="modern-time-block-title">{block.title}</div>
                                        <div className="modern-time-block-meta">
                                            <span className="modern-time-block-duration">{block.duration}</span>
                                            <span className="modern-time-block-status">{block.status}</span>
                                        </div>
                                    </div>
                                ))}
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
                        {[
                            { action: 'Task completed', target: 'Fix login bug', time: '2m ago', color: '#B7E4A7' },
                            { action: 'Comment added', target: 'API redesign', time: '15m ago', color: '#ADC6FF' },
                            { action: 'Sprint started', target: 'Sprint 12', time: '1h ago', color: '#FFE58F' },
                            { action: 'Member joined', target: 'Design team', time: '3h ago', color: '#D3ADF7' },
                        ].map((item, i) => (
                            <div key={i} className="modern-activity-item">
                                <div className="modern-activity-dot" style={{ backgroundColor: item.color }} />
                                <div className="modern-activity-content">
                                    <div className="modern-activity-action">{item.action}</div>
                                    <div className="modern-activity-target">{item.target}</div>
                                </div>
                                <span className="modern-activity-time">{item.time}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
