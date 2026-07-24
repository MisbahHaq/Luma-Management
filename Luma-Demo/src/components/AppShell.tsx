import { useState, useEffect } from 'react';
import { type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './primitives/Avatar';
import { Badge } from './primitives/Badge';
import { Search, PanelLeftClose, PanelLeftOpen, LogOut, Plus, LayoutDashboard, FolderOpen, CheckSquare, Timer, BarChart3, Users } from 'lucide-react';
import type { Project } from '../types';
import NotificationsBell from './NotificationsBell';

interface AppShellProps {
    children: ReactNode;
    breadcrumb?: ReactNode;
    title?: string;
    project?: Project | null;
    completion?: number;
}

const NAV_ITEMS: { label: string; icon: ReactNode; href: string }[] = [
    { label: 'Home', icon: <LayoutDashboard className="w-4 h-4" />, href: '/' },
    { label: 'Projects', icon: <FolderOpen className="w-4 h-4" />, href: '/projects' },
    { label: 'My Tasks', icon: <CheckSquare className="w-4 h-4" />, href: '/my-tasks' },
    { label: 'Sprints', icon: <Timer className="w-4 h-4" />, href: '/sprints' },
    { label: 'Reports', icon: <BarChart3 className="w-4 h-4" />, href: '/reports' },
    { label: 'Members', icon: <Users className="w-4 h-4" />, href: '/members' },
];

export default function AppShell({
    children,
    breadcrumb,
    title,
    project,
    completion,
}: AppShellProps) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const isActive = (href: string) => location.pathname === href;

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    return (
        <div className="shell">
            <aside className={`sidebar ${sidebarCollapsed ? 'w-16 min-w-16' : 'w-[260px] min-w-[260px]'}`}>
                <div className="flex items-center justify-between px-3 py-3">
                    {!sidebarCollapsed && (
                        <span className="text-lg font-bold tracking-tight text-text-primary">Luma</span>
                    )}
                    <button
                        onClick={() => setSidebarCollapsed((c) => !c)}
                        className="p-1.5 rounded-md hover:bg-surface-2 text-text-muted hover:text-text-secondary transition-colors"
                    >
                        {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                    </button>
                </div>

                <nav className="flex flex-col gap-0.5 px-2 flex-1 overflow-y-auto scrollbar-thin">
                    {NAV_ITEMS.map((item) => (
                        <button
                            key={item.label}
                            onClick={() => navigate(item.href)}
                            className={`flex items-center gap-3 px-2.5 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                                isActive(item.href)
                                    ? 'bg-accent-soft text-accent'
                                    : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                            }`}
                        >
                            <span className="flex-shrink-0">{item.icon}</span>
                            {!sidebarCollapsed && <span>{item.label}</span>}
                        </button>
                    ))}
                </nav>

                <div className="border-t border-border-subtle px-2 py-2">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-2.5 py-2 rounded-md text-sm font-medium text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors duration-150 w-full"
                    >
                        <span className="flex-shrink-0"><LogOut className="w-4 h-4" /></span>
                        {!sidebarCollapsed && <span>Log out</span>}
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-12 flex items-center justify-between px-4 border-b border-border-subtle bg-bg/80 backdrop-blur-md flex-shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        {breadcrumb && (
                            <nav className="flex items-center gap-1.5 text-xs text-text-muted truncate">
                                {breadcrumb}
                            </nav>
                        )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={() => navigate('/app')}
                            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-default transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            New Task
                        </button>
                        <button
                            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border border-border-subtle text-text-muted hover:text-text-primary hover:border-border-default transition-colors"
                        >
                            <Search className="w-3.5 h-3.5" />
                            Search
                            <kbd className="hidden md:inline-flex items-center gap-0.5 px-1 py-0.5 text-[10px] font-mono bg-surface-2 rounded border border-border-subtle">⌘K</kbd>
                        </button>
                        <NotificationsBell />
                        <div title={(user?.fullName ?? user?.email) ?? ''}>
                            <Avatar name={(user?.fullName ?? user?.email) ?? ''} size="md" />
                        </div>
                    </div>
                </header>

                {title && (
                    <div className="px-4 py-2.5 border-b border-border-subtle bg-bg/50 flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <h1 className="text-base font-semibold text-text-primary truncate">{title}</h1>
                            {project && (
                                <Badge variant={completion === 100 ? 'success' : 'info'}>
                                    {completion === 100 ? 'Completed' : 'In Progress'}
                                </Badge>
                            )}
                            {typeof completion === 'number' && completion < 100 && (
                                <div className="flex-1 max-w-[120px]">
                                    <div className="h-1 flex-1 bg-surface-2 rounded-full overflow-hidden">
                                        <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${completion}%` }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <main className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-5">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
