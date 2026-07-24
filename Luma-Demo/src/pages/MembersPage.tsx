import { mockProjectMembers, mockUsers } from '../api/mock';
import { useAuth } from '../context/AuthContext';
import AppShell from '../components/AppShell';
import { X, UserPlus, Shield } from 'lucide-react';
import type { ProjectMemberSummary, WorkspaceRole } from '../types';
import { useState, useEffect, type FormEvent } from 'react';

const ROLE_OPTIONS: WorkspaceRole[] = ['Owner', 'Admin', 'Member'];

export default function MembersPage() {
    const { user } = useAuth();
    const [members, setMembers] = useState<ProjectMemberSummary[]>([]);
    const [allUsers] = useState(mockUsers);
    const [loading, setLoading] = useState(true);
    const [newMemberId, setNewMemberId] = useState('');

    const isOwner = members.some((m) => m.id === user?.id && m.projectRole === 'Owner');
    const canManage = user?.role === 'Admin' || isOwner;

    useEffect(() => {
        setLoading(true);
        setTimeout(() => {
            setMembers(mockProjectMembers);
            setLoading(false);
        }, 300);
    }, []);

    const handleAddMember = async (e: FormEvent) => {
        e.preventDefault();
        if (!newMemberId) return;
        const u = allUsers.find((usr) => usr.id === newMemberId);
        if (!u) return;
        setMembers((prev) => [...prev, { id: u.id, fullName: u.fullName, email: u.email, globalRole: u.role, projectRole: 'Editor' }]);
        setNewMemberId('');
    };

    const handleChangeRole = (userId: string, role: string) => {
        setMembers((prev) => prev.map((m) => (m.id === userId ? { ...m, projectRole: role as ProjectMemberSummary['projectRole'] } : m)));
    };

    const handleRemoveMember = (userId: string) => {
        if (!window.confirm('Remove this member from the workspace?')) return;
        setMembers((prev) => prev.filter((m) => m.id !== userId));
    };

    const availableUsers = allUsers.filter((u) => !members.some((m) => m.id === u.id));

    return (
        <AppShell breadcrumb={<span>Workspace</span>} title="Members">
            <div className="max-w-7xl mx-auto space-y-4">
                {loading ? (
                    <p className="text-text-muted text-xs">Loading members...</p>
                ) : (
                    <div className="bg-surface-1 border border-border-subtle rounded-md overflow-hidden">
                        <div className="px-3 py-2.5 border-b border-border-subtle">
                            <h3 className="text-sm font-medium text-text-primary">Workspace members</h3>
                            <p className="text-[11px] text-text-muted mt-0.5">{members.length} member{members.length === 1 ? '' : 's'}</p>
                        </div>
                        {members.length === 0 ? (
                            <div className="px-3 py-10 text-center">
                                <Shield className="w-8 h-8 text-text-muted mx-auto mb-2" />
                                <p className="text-sm text-text-secondary mb-1">No members yet</p>
                                <p className="text-xs text-text-muted">Invite people to start collaborating.</p>
                            </div>
                        ) : (
                            <div>
                                {members.map((member) => {
                                    const isSelf = member.id === user?.id;
                                    return (
                                        <div key={member.id} className="flex items-center gap-3 px-3 py-2.5 border-b border-border-subtle last:border-0 hover:bg-surface-2/50 transition-colors">
                                            <div className="w-8 h-8 rounded-md bg-accent-soft flex items-center justify-center text-accent text-xs font-medium flex-shrink-0">
                                                {(member.fullName ?? member.email ?? '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-text-primary truncate">
                                                    {member.fullName ?? 'Unnamed'}
                                                    {isSelf && <span className="text-[10px] text-text-muted ml-1.5">(you)</span>}
                                                </div>
                                                <div className="text-[11px] text-text-muted truncate">{member.email}</div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {canManage && !isSelf ? (
                                                    <select
                                                        value={member.projectRole}
                                                        onChange={(e) => handleChangeRole(member.id, e.target.value as WorkspaceRole)}
                                                        className="bg-surface-2 border border-border-subtle rounded-md px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-accent transition-colors cursor-pointer"
                                                    >
                                                        {ROLE_OPTIONS.map((r) => (
                                                            <option key={r} value={r}>{r}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded border border-border-subtle text-text-secondary bg-surface-2">
                                                        {member.projectRole}
                                                    </span>
                                                )}
                                                {canManage && !isSelf && member.projectRole !== 'Owner' && (
                                                    <button
                                                        type="button"
                                                        className="p-1 rounded-md hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors"
                                                        onClick={() => handleRemoveMember(member.id)}
                                                        title="Remove member"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {canManage && availableUsers.length > 0 && (
                            <form onSubmit={handleAddMember} className="flex items-center gap-2 px-3 py-2.5 border-t border-border-subtle bg-surface-1/50">
                                <select
                                    value={newMemberId}
                                    onChange={(e) => setNewMemberId(e.target.value)}
                                    className="flex-1 bg-surface-2 border border-border-subtle rounded-md px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent transition-colors cursor-pointer"
                                >
                                    <option value="">Add member…</option>
                                    {availableUsers.map((u) => (
                                        <option key={u.id} value={u.id}>{u.fullName ?? u.email}</option>
                                    ))}
                                </select>
                                <button
                                    type="submit"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!newMemberId}
                                >
                                    <UserPlus className="w-3.5 h-3.5" />
                                    Add
                                </button>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </AppShell>
    );
}
