import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { workspacesApi } from '../api/endpoints';
import type { Workspace } from '../types/types';

interface WorkspaceContextValue {
    currentWorkspace: Workspace | null;
    workspaces: Workspace[];
    loading: boolean;
    switchWorkspace: (id: string) => void;
    refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
    const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(() => {
        const stored = localStorage.getItem('luma_workspace');
        return stored ? (JSON.parse(stored) as Workspace) : null;
    });
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshWorkspaces = async () => {
        try {
            const { data } = await workspacesApi.list();
            setWorkspaces(data);
            if (!currentWorkspace && data.length > 0) {
                setCurrentWorkspace(data[0]);
                localStorage.setItem('luma_workspace', JSON.stringify(data[0]));
            }
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refreshWorkspaces();
    }, []);

    const switchWorkspace = (id: string) => {
        const ws = workspaces.find(w => w.id === id) ?? null;
        setCurrentWorkspace(ws);
        if (ws) {
            localStorage.setItem('luma_workspace', JSON.stringify(ws));
        } else {
            localStorage.removeItem('luma_workspace');
        }
    };

    return (
        <WorkspaceContext.Provider value={{ currentWorkspace, workspaces, loading, switchWorkspace, refreshWorkspaces }}>
            {children}
        </WorkspaceContext.Provider>
    );
}

export function useWorkspace(): WorkspaceContextValue {
    const ctx = useContext(WorkspaceContext);
    if (!ctx) {
        throw new Error('useWorkspace must be used within a WorkspaceProvider');
    }
    return ctx;
}
