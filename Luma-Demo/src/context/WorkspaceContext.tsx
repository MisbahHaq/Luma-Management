import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Workspace } from '../types';
import { mockWorkspaces } from '../api/mock';

interface WorkspaceContextValue {
    currentWorkspace: Workspace | null;
    workspaces: Workspace[];
    switchWorkspace: (id: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
    const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(() => {
        const stored = localStorage.getItem('luma_demo_workspace');
        return stored ? JSON.parse(stored) : mockWorkspaces[0] ?? null;
    });
    const [workspaces] = useState<Workspace[]>(mockWorkspaces);

    useEffect(() => {
        if (currentWorkspace) {
            localStorage.setItem('luma_demo_workspace', JSON.stringify(currentWorkspace));
        }
    }, [currentWorkspace]);

    const switchWorkspace = (id: string) => {
        const ws = workspaces.find((w) => w.id === id) ?? null;
        setCurrentWorkspace(ws);
    };

    return (
        <WorkspaceContext.Provider value={{ currentWorkspace, workspaces, switchWorkspace }}>
            {children}
        </WorkspaceContext.Provider>
    );
}

export function useWorkspace(): WorkspaceContextValue {
    const ctx = useContext(WorkspaceContext);
    if (!ctx) throw new Error('useWorkspace must be used within a WorkspaceProvider');
    return ctx;
}
