import { NavLink } from 'react-router-dom';

interface NavItem {
    to: string;
    label: string;
    icon: string;
    end?: boolean;
}

const ITEMS: NavItem[] = [
    { to: '/', label: 'Home', icon: '⌂', end: true },
    { to: '/projects', label: 'Projects', icon: '▦' },
    { to: '/sprints', label: 'Sprints', icon: '◷' },
    { to: '/tasks', label: 'Tasks', icon: '☑' },
    { to: '/reports', label: 'Reports', icon: '◔' },
    { to: '/members', label: 'Members', icon: '☺' },
    { to: '/settings', label: 'Settings', icon: '⚙' },
];

export default function Sidebar({
    collapsed,
    onToggle,
}: {
    collapsed: boolean;
    onToggle: () => void;
}) {
    return (
        <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
            <div className="sidebar-brand">
                <span className="sidebar-mark">◓</span>
                {!collapsed && <span className="sidebar-title">Luma</span>}
            </div>
            <nav className="sidebar-nav">
                {ITEMS.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                        title={item.label}
                    >
                        <span className="sidebar-icon">{item.icon}</span>
                        {!collapsed && <span className="sidebar-label">{item.label}</span>}
                    </NavLink>
                ))}
            </nav>
            <button className="sidebar-collapse" onClick={onToggle} aria-label="Toggle sidebar">
                {collapsed ? '»' : '«'}
            </button>
        </aside>
    );
}
