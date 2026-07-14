export type UserRole = 'Admin' | 'Member' | 'Viewer';

export type TaskStatus = 'ToDo' | 'InProgress' | 'Done';

export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface User {
    id: string;
    email: string;
    fullName: string | null;
    role: UserRole;
}

export interface Project {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    createdByUserId: string;
    createdByUserFullName: string | null;
}

export interface Task {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string | null;
    projectId: string;
    assigneeId: string | null;
    assigneeFullName: string | null;
    createdAt: string;
}

export interface Comment {
    id: string;
    taskId: string;
    userId: string;
    userFullName: string;
    text: string;
    createdAt: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface UserSummary {
    id: string;
    fullName: string | null;
    email: string | null;
    role: UserRole;
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
    ToDo: 'To Do',
    InProgress: 'In Progress',
    Done: 'Done',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
    Low: 'Low',
    Medium: 'Medium',
    High: 'High',
};
