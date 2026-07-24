import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, UserPlus, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import AppShell from '../components/AppShell';
import { workspacesApi, usersApi } from '../api/endpoints';
import type { WorkspaceMember, UserSummary, WorkspaceRole } from '../types/types';

const ROLE_OPTIONS: WorkspaceRole[] = ['Owner', 'Admin', 'Member'];

export default function MembersPage() {
    const { currentUser } = useAuth();
    const { currentWorkspace, refreshWorkspaces } = useWorkspace();
    const navigate = useNavigate();

    const [members, setMembers] = useState<WorkspaceMember[]>([]);
    const [allUsers, setAllUsers] = useState<UserSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const [newMemberId, setNewMemberId] = useState('');

    const isOwner = currentWorkspace?.createdByUserId === currentUser?.id;
    const canManage = currentUser?.role === 'Admin' || isOwner;

    const myWorkspaceRole = members.find((m) => m.userId === currentUser?.id)?.role;

    const load = async () => {
        if (!currentWorkspace?.id) return;
        setLoading(true);
        setError(null);
        try {
            const [membersRes, usersRes] = await Promise.all([
                workspacesApi.members(currentWorkspace.id),
                canManage ? usersApi.list() : Promise.resolve({ data: [] as UserSummary[] }),
            ]);
            setMembers(membersRes.data);
            setAllUsers(usersRes.data);
        } catch {
            setError('Failed to load members.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, [currentWorkspace?.id]);

    const handleAddMember = async (e: FormEvent) => {
        e.preventDefault();
        if (!newMemberId || !currentWorkspace?.id) return;
        setSaving(true);
        try {
            await workspacesApi.addMember(currentWorkspace.id, newMemberId, 'Member');
            setNewMemberId('');
            await load();
            await refreshWorkspaces();
        } catch {
            setError('Failed to add member.');
        } finally {
            setSaving(false);
        }
    };

    const handleChangeRole = async (userId: string, role: WorkspaceRole) => {
        if (!currentWorkspace?.id) return;
        try {
            await workspacesApi.changeMemberRole(currentWorkspace.id, userId, role);
            await load();
        } catch {
            setError('Failed to update role.');
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!currentWorkspace?.id) return;
        if (!window.confirm('Remove this member from the workspace?')) return;
        try {
            await workspacesApi.removeMember(currentWorkspace.id, userId);
            await load();
            await refreshWorkspaces();
        } catch {
            setError('Failed to remove member.');
        }
    };

    const availableUsers = allUsers.filter((u) => !members.some((m) => m.userId === u.id));

    return (
        <AppShell breadcrumb={<span>Workspace</span>} title="Members">
            <div className="max-w-7xl mx-auto space-y-4">
                {error && (
                    <div className="px-3 py-2 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                        {error}
                    </div>
                )}

                {!currentWorkspace ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Shield className="w-10 h-10 text-text-muted mb-3" />
                        <p className="text-sm text-text-secondary mb-1">No workspace selected</p>
                        <p className="text-xs text-text-muted mb-4">Switch to a workspace to view its members.</p>
                        <button
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-accent text-white hover:bg-accent/90 transition-colors"
                            onClick={() => navigate('/projects')}
                        >
                            Go to projects
                        </button>
                    </div>
                ) : loading ? (
                    <p className="text-text-muted text-xs">Loading members...</p>
                ) : (
                    <div className="bg-surface-1 border border-border-subtle rounded-md overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border-subtle">
                            <div>
                                <h3 className="text-sm font-medium text-text-primary">Workspace members</h3>
                                <p className="text-[11px] text-text-muted mt-0.5">
                                    {members.length} member{members.length === 1 ? '' : 's'} in {currentWorkspace.name}
                                </p>
                            </div>
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
                                    const isSelf = member.userId === currentUser?.id;
                                    const roleBadgeVariant =
                                        member.role === 'Owner'
                                            ? 'info'
                                            : member.role === 'Admin'
                                                ? 'default'
                                                : 'outline';

                                    return (
                                        <div
                                            key={member.userId}
                                            className="flex items-center gap-3 px-3 py-2.5 border-b border-border-subtle last:border-0 hover:bg-surface-2/50 transition-colors"
                                        >
                                            <div className="w-8 h-8 rounded-md bg-accent-soft flex items-center justify-center text-accent text-xs font-medium flex-shrink-0">
                                                {(member.fullName ?? member.email ?? '?')
                                                    .split(' ')
                                                    .map((w) => w[0])
                                                    .slice(0, 2)
                                                    .join('')
                                                    .toUpperCase()}
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
                                                        value={member.role}
                                                        onChange={(e) =>
                                                            void handleChangeRole(member.userId, e.target.value as WorkspaceRole)
                                                        }
                                                        className="bg-surface-2 border border-border-subtle rounded-md px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-accent transition-colors cursor-pointer"
                                                    >
                                                        {ROLE_OPTIONS.map((r) => (
                                                            <option key={r} value={r}>
                                                                {r}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded border border-border-subtle text-text-secondary bg-surface-2">
                                                        {member.role}
                                                    </span>
                                                )}
                                                {canManage && !isSelf && member.role !== 'Owner' && (
                                                    <button
                                                        type="button"
                                                        className="p-1 rounded-md hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors"
                                                        onClick={() => void handleRemoveMember(member.userId)}
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
                            <form
                                onSubmit={handleAddMember}
                                className="flex items-center gap-2 px-3 py-2.5 border-t border-border-subtle bg-surface-1/50"
                            >
                                <select
                                    value={newMemberId}
                                    onChange={(e) => setNewMemberId(e.target.value)}
                                    className="flex-1 bg-surface-2 border border-border-subtle rounded-md px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent transition-colors cursor-pointer"
                                >
                                    <option value="">Add member…</option>
                                    {availableUsers.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.fullName ?? u.email}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="submit"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={saving || !newMemberId}
                                >
                                    <UserPlus className="w-3.5 h-3.5" />
                                    {saving ? 'Adding...' : 'Add'}
                                </button>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </AppShell>
    );
}
