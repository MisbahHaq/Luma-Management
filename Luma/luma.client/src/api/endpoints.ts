import client from './client';
import type {
    ActivityLog,
    Attachment,
    Comment,
    Notification,
    ProjectMemberSummary,
    Sprint,
    TaskDependency,
    TimeLog,
    UserSummary,
    BurndownReport,
    VelocityReport,
    ProjectHealth,
    DashboardSummary,
    Task,
    SearchResponse,
    Label,
    BulkResult,
    Workspace,
    WorkspaceMember,
    Milestone,
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

export const commentsApi = {
    list: (taskId: string, page = 1, pageSize = 20) =>
        client.get<{ items: Comment[]; total: number; page: number; pageSize: number; totalPages: number }>(`/comments/task/${taskId}?page=${page}&pageSize=${pageSize}`),
    create: (taskId: string, text: string) =>
        client.post<Comment>('/comments', { taskId, text }),
    update: (id: string, text: string) =>
        client.put<Comment>(`/comments/${id}`, { text }),
    remove: (id: string) => client.delete(`/comments/${id}`),
};

export const activityApi = {
    forTask: (taskId: string, page = 1, pageSize = 20) =>
        client.get<{ items: ActivityLog[]; total: number; page: number; pageSize: number; totalPages: number }>(`/activity/task/${taskId}?page=${page}&pageSize=${pageSize}`),
    forProject: (projectId: string, page = 1, pageSize = 20) =>
        client.get<{ items: ActivityLog[]; total: number; page: number; pageSize: number; totalPages: number }>(`/activity/project/${projectId}?page=${page}&pageSize=${pageSize}`),
    mine: (page = 1, pageSize = 20) =>
        client.get<ActivityLog[]>(`/activity/mine?page=${page}&pageSize=${pageSize}`),
};

export const notificationsApi = {
    mine: (page = 1, pageSize = 20) =>
        client.get<{ items: Notification[]; total: number; page: number; pageSize: number; totalPages: number }>(`/notifications?page=${page}&pageSize=${pageSize}`),
    unreadCount: () => client.get<number>('/notifications/unread-count'),
    markRead: (id: string) => client.post(`/notifications/${id}/read`),
    markAllRead: () => client.post('/notifications/read-all'),
};

export const membersApi = {
    list: (projectId: string) => client.get<ProjectMemberSummary[]>(`/projects/${projectId}/members`),
    add: (projectId: string, userId: string, role = 'Editor') =>
        client.post(`/projects/${projectId}/members`, { userId, role }),
    remove: (projectId: string, userId: string) =>
        client.delete(`/projects/${projectId}/members/${userId}`),
    changeRole: (projectId: string, userId: string, role: string) =>
        client.put(`/projects/${projectId}/members/${userId}/role`, { role }),
};

export const projectsApi = {
    updateIssueKeyPrefix: (projectId: string, prefix: string) =>
        client.put(`/projects/${projectId}/issue-key-prefix`, { prefix }),
};

export const usersApi = {
    list: () => client.get<UserSummary[]>('/users'),
};

export const tasksApi = {
    byProject: (projectId: string, page = 1, pageSize = 20) =>
        client.get<{ items: Task[]; total: number; page: number; pageSize: number; totalPages: number }>(`/tasks/project/${projectId}?page=${page}&pageSize=${pageSize}`),
    myTasks: (params: { page?: number; pageSize?: number; status?: string; priority?: string; type?: string; projectId?: string }) =>
        client.get<{ items: Task[]; total: number }>('/tasks/my', { params }),
    move: (taskId: string, status: string) =>
        client.put(`/tasks/${taskId}/move`, { status }),
    create: (payload: {
        title: string;
        description?: string | null;
        status?: string;
        priority?: string;
        type?: string;
        parentTaskId?: string | null;
        dueDate?: string | null;
        projectId: string;
        assigneeId?: string | null;
    }) => client.post<Task>('/tasks', payload),
    remove: (id: string) => client.delete(`/tasks/${id}`),
};

export const bulkApi = {
    updateStatus: (taskIds: string[], status: string) =>
        client.post<BulkResult>('/tasks/bulk/status', { taskIds, status }),
    updatePriority: (taskIds: string[], priority: string) =>
        client.post<BulkResult>('/tasks/bulk/priority', { taskIds, priority }),
    updateAssignee: (taskIds: string[], assigneeId: string | null) =>
        client.post<BulkResult>('/tasks/bulk/assignee', { taskIds, assigneeId }),
    delete: (taskIds: string[]) =>
        client.post<BulkResult>('/tasks/bulk/delete', { taskIds }),
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
    forTask: (taskId: string, page = 1, pageSize = 20) =>
        client.get<{ items: TimeLog[]; total: number; page: number; pageSize: number; totalPages: number }>(`/timelogs/task/${taskId}?page=${page}&pageSize=${pageSize}`),
    forProject: (projectId: string, page = 1, pageSize = 20) =>
        client.get<{ items: TimeLog[]; total: number; page: number; pageSize: number; totalPages: number }>(`/timelogs/project/${projectId}?page=${page}&pageSize=${pageSize}`),
    forUser: (userId: string, page = 1, pageSize = 20) =>
        client.get<{ items: TimeLog[]; total: number; page: number; pageSize: number; totalPages: number }>(`/timelogs/user/${userId}?page=${page}&pageSize=${pageSize}`),
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

export const searchApi = {
    query: (q: string) => client.get<SearchResponse>('/search', { params: { q } }),
};

export const labelsApi = {
    forProject: (projectId: string) => client.get<Label[]>(`/projects/${projectId}/labels`),
    create: (projectId: string, name: string, color: string) =>
        client.post<Label>(`/projects/${projectId}/labels`, { name, color }),
    update: (projectId: string, id: string, name?: string, color?: string) =>
        client.put(`/projects/${projectId}/labels/${id}`, { name, color }),
    remove: (projectId: string, id: string) => client.delete(`/projects/${projectId}/labels/${id}`),
    forTask: (taskId: string) => client.get<Label[]>(`/tasks/${taskId}/labels`),
    attach: (taskId: string, labelId: string) => client.post(`/tasks/${taskId}/labels/${labelId}`),
    detach: (taskId: string, labelId: string) => client.delete(`/tasks/${taskId}/labels/${labelId}`),
};

export const workspacesApi = {
    list: () => client.get<Workspace[]>('/workspaces'),
    get: (id: string) => client.get<Workspace>(`/workspaces/${id}`),
    create: (name: string, slug?: string) =>
        client.post<Workspace>('/workspaces', { name, slug }),
    update: (id: string, name?: string) =>
        client.put(`/workspaces/${id}`, { name }),
    remove: (id: string) => client.delete(`/workspaces/${id}`),
    members: (id: string) => client.get<WorkspaceMember[]>(`/workspaces/${id}/members`),
    addMember: (id: string, userId: string, role: string) =>
        client.post(`/workspaces/${id}/members`, { userId, role }),
    removeMember: (id: string, userId: string) =>
        client.delete(`/workspaces/${id}/members/${userId}`),
    changeMemberRole: (id: string, userId: string, role: string) =>
        client.put(`/workspaces/${id}/members/${userId}/role`, { role }),
};

export const milestonesApi = {
    forProject: (projectId: string) =>
        client.get<Milestone[]>(`/milestones/project/${projectId}`),
    get: (id: string) => client.get<Milestone>(`/milestones/${id}`),
    create: (projectId: string, payload: {
        name: string;
        description?: string | null;
        dueDate?: string | null;
    }) => client.post<Milestone>(`/milestones/project/${projectId}`, payload),
    update: (id: string, payload: {
        name?: string;
        description?: string | null;
        dueDate?: string | null;
        status?: string;
    }) => client.put(`/milestones/${id}`, payload),
    remove: (id: string) => client.delete(`/milestones/${id}`),
    addTask: (milestoneId: string, taskId: string) =>
        client.put(`/milestones/${milestoneId}/tasks/${taskId}`),
    removeTask: (milestoneId: string, taskId: string) =>
        client.delete(`/milestones/${milestoneId}/tasks/${taskId}`),
};
