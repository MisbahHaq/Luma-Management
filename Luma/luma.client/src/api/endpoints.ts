import client from './client';
import type {
    ActivityLog,
    Attachment,
    Notification,
    ProjectMember,
    Sprint,
    TaskDependency,
    TimeLog,
    UserSummary,
    BurndownReport,
    VelocityReport,
    ProjectHealth,
    DashboardSummary,
} from '../types/types';

export const attachmentsApi = {
    list: (taskId: string) => client.get<Attachment[]>(`/attachments/task/${taskId}`),
    upload: (taskId: string, file: File) => {
        const form = new FormData();
        form.append('file', file);
        return client.post<Attachment>(`/attachments/task/${taskId}`, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    downloadUrl: (id: string) => `/api/attachments/${id}/download`,
    remove: (id: string) => client.delete(`/attachments/${id}`),
};

export const activityApi = {
    forTask: (taskId: string) => client.get<ActivityLog[]>(`/activity/task/${taskId}`),
    forProject: (projectId: string) => client.get<ActivityLog[]>(`/activity/project/${projectId}`),
};

export const notificationsApi = {
    mine: () => client.get<Notification[]>('/notifications'),
    unreadCount: () => client.get<number>('/notifications/unread-count'),
    markRead: (id: string) => client.post(`/notifications/${id}/read`),
    markAllRead: () => client.post('/notifications/read-all'),
};

export const membersApi = {
    list: (projectId: string) => client.get<ProjectMember[]>(`/projects/${projectId}/members`),
    add: (projectId: string, userId: string) =>
        client.post(`/projects/${projectId}/members`, { userId }),
    remove: (projectId: string, userId: string) =>
        client.delete(`/projects/${projectId}/members/${userId}`),
};

export const usersApi = {
    list: () => client.get<UserSummary[]>('/users'),
};

export const tasksApi = {
    move: (taskId: string, status: string) =>
        client.put(`/tasks/${taskId}/move`, { status }),
};

export const sprintsApi = {
    forProject: (projectId: string) =>
        client.get<Sprint[]>(`/sprints/project/${projectId}`),
    get: (id: string) => client.get<Sprint>(`/sprints/${id}`),
    create: (payload: {
        name: string;
        description?: string | null;
        status: string;
        startDate?: string | null;
        endDate?: string | null;
        projectId: string;
    }) => client.post<Sprint>('/sprints', payload),
    update: (id: string, payload: {
        name: string;
        description?: string | null;
        status: string;
        startDate?: string | null;
        endDate?: string | null;
    }) => client.put(`/sprints/${id}`, payload),
    remove: (id: string) => client.delete(`/sprints/${id}`),
    addTask: (id: string, taskId: string) =>
        client.put(`/sprints/${id}/tasks/${taskId}`),
    removeTask: (id: string, taskId: string) =>
        client.delete(`/sprints/${id}/tasks/${taskId}`),
};

export const dependenciesApi = {
    forProject: (projectId: string) =>
        client.get<TaskDependency[]>(`/taskdependencies/project/${projectId}`),
    forTask: (taskId: string) =>
        client.get<TaskDependency[]>(`/taskdependencies/task/${taskId}`),
    create: (payload: {
        taskId: string;
        dependsOnTaskId: string;
        type: string;
    }) => client.post<TaskDependency>('/taskdependencies', payload),
    remove: (id: string) => client.delete(`/taskdependencies/${id}`),
};

export const timeLogsApi = {
    forTask: (taskId: string) =>
        client.get<TimeLog[]>(`/timelogs/task/${taskId}`),
    forProject: (projectId: string) =>
        client.get<TimeLog[]>(`/timelogs/project/${projectId}`),
    forUser: (userId: string) =>
        client.get<TimeLog[]>(`/timelogs/user/${userId}`),
    create: (payload: {
        taskId: string;
        hours: number;
        date?: string | null;
        note?: string | null;
    }) => client.post<TimeLog>('/timelogs', payload),
    remove: (id: string) => client.delete(`/timelogs/${id}`),
};

export const reportsApi = {
    dashboard: () => client.get<DashboardSummary>('/reports/dashboard'),
    burndown: (projectId: string) => client.get<BurndownReport>(`/reports/projects/${projectId}/burndown`),
    velocity: (projectId: string) => client.get<VelocityReport>(`/reports/projects/${projectId}/velocity`),
    health: (projectId: string) => client.get<ProjectHealth>(`/reports/projects/${projectId}/health`),
};

export const exportApi = {
    excel: (projectId: string) => `/api/export/projects/${projectId}/excel`,
    pdf: (projectId: string) => `/api/export/projects/${projectId}/pdf`,
    burndownPdf: (projectId: string) => `/api/export/projects/${projectId}/burndown/pdf`,
};

export const publicPortalApi = {
    project: (projectId: string, token: string) =>
        client.get(`/public/projects/${projectId}`, { headers: { 'X-Public-Token': token } }),
    tasks: (projectId: string, token: string) =>
        client.get(`/public/projects/${projectId}/tasks`, { headers: { 'X-Public-Token': token } }),
    members: (projectId: string, token: string) =>
        client.get(`/public/projects/${projectId}/members`, { headers: { 'X-Public-Token': token } }),
    health: (projectId: string, token: string) =>
        client.get(`/public/projects/${projectId}/health`, { headers: { 'X-Public-Token': token } }),
};
