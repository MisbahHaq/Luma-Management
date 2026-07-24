import type { User, Workspace, WorkspaceMember, Project, ProjectMemberSummary, Task, Comment, Sprint, Milestone, TaskDependency, TimeLog, ActivityLog, Notification, DashboardSummary, Attachment, Label, TaskStatus, TaskPriority, TaskItemType, SprintStatus } from '../types';

export const mockUser: User = {
    id: 'user-1',
    email: 'admin@luma.com',
    fullName: 'Admin User',
    role: 'Admin',
};

export const mockWorkspaces: Workspace[] = [
    {
        id: 'ws-1',
        name: 'Acme Corp',
        slug: 'acme-corp',
        tenantId: 'tenant-1',
        createdAt: '2024-01-15T00:00:00Z',
        createdByUserId: 'user-1',
        createdByUserFullName: 'Admin User',
        memberCount: 5,
        projectCount: 3,
    },
];

export const mockWorkspaceMembers: WorkspaceMember[] = [
    { userId: 'user-1', fullName: 'Admin User', email: 'admin@luma.com', role: 'Owner', addedAt: '2024-01-15T00:00:00Z' },
    { userId: 'user-2', fullName: 'Sarah Chen', email: 'sarah@example.com', role: 'Admin', addedAt: '2024-01-16T00:00:00Z' },
    { userId: 'user-3', fullName: 'James Wilson', email: 'james@example.com', role: 'Member', addedAt: '2024-01-17T00:00:00Z' },
    { userId: 'user-4', fullName: 'Emily Davis', email: 'emily@example.com', role: 'Member', addedAt: '2024-01-18T00:00:00Z' },
    { userId: 'user-5', fullName: 'Michael Brown', email: 'michael@example.com', role: 'Member', addedAt: '2024-01-19T00:00:00Z' },
];

export const mockProjects: Project[] = [
    {
        id: 'proj-1',
        name: 'Website Redesign',
        description: 'Complete overhaul of the company website with modern design and improved UX.',
        createdAt: '2024-02-01T00:00:00Z',
        createdByUserId: 'user-1',
        createdByUserFullName: 'Admin User',
        workspaceId: 'ws-1',
        workspaceName: 'Acme Corp',
        workspaceSlug: 'acme-corp',
        issueKeyPrefix: 'WEB',
    },
    {
        id: 'proj-2',
        name: 'Mobile App v2',
        description: 'Next generation mobile application with offline support and push notifications.',
        createdAt: '2024-02-15T00:00:00Z',
        createdByUserId: 'user-1',
        createdByUserFullName: 'Admin User',
        workspaceId: 'ws-1',
        workspaceName: 'Acme Corp',
        workspaceSlug: 'acme-corp',
        issueKeyPrefix: 'MOB',
    },
    {
        id: 'proj-3',
        name: 'API Integration',
        description: 'Third-party API integrations for payment processing and analytics.',
        createdAt: '2024-03-01T00:00:00Z',
        createdByUserId: 'user-2',
        createdByUserFullName: 'Sarah Chen',
        workspaceId: 'ws-1',
        workspaceName: 'Acme Corp',
        workspaceSlug: 'acme-corp',
        issueKeyPrefix: 'API',
    },
];

export const mockProjectMembers: ProjectMemberSummary[] = [
    { id: 'user-1', fullName: 'Admin User', email: 'admin@luma.com', globalRole: 'Admin', projectRole: 'Owner' },
    { id: 'user-2', fullName: 'Sarah Chen', email: 'sarah@example.com', globalRole: 'Admin', projectRole: 'Editor' },
    { id: 'user-3', fullName: 'James Wilson', email: 'james@example.com', globalRole: 'Member', projectRole: 'Editor' },
    { id: 'user-4', fullName: 'Emily Davis', email: 'emily@example.com', globalRole: 'Member', projectRole: 'Viewer' },
];

export const mockTasks: Task[] = [
    { id: 'task-1', title: 'Design new homepage layout', description: 'Create high-fidelity mockups for the new homepage.', status: 'Done', priority: 'High', type: 'Task', parentTaskId: null, dueDate: '2024-02-10T00:00:00Z', projectId: 'proj-1', sprintId: null, milestoneId: null, assigneeId: 'user-2', assigneeFullName: 'Sarah Chen', createdAt: '2024-02-01T00:00:00Z', issueNumber: 1, issueKey: 'WEB-1' },
    { id: 'task-2', title: 'Implement responsive navigation', description: 'Build mobile-first navigation component.', status: 'InProgress', priority: 'High', type: 'Story', parentTaskId: null, dueDate: '2024-02-20T00:00:00Z', projectId: 'proj-1', sprintId: 'sprint-1', milestoneId: null, assigneeId: 'user-3', assigneeFullName: 'James Wilson', createdAt: '2024-02-02T00:00:00Z', issueNumber: 2, issueKey: 'WEB-2' },
    { id: 'task-3', title: 'Fix login button alignment', description: 'The login button is misaligned on tablet viewports.', status: 'ToDo', priority: 'Medium', type: 'Bug', parentTaskId: null, dueDate: '2024-02-18T00:00:00Z', projectId: 'proj-1', sprintId: 'sprint-1', milestoneId: null, assigneeId: 'user-4', assigneeFullName: 'Emily Davis', createdAt: '2024-02-03T00:00:00Z', issueNumber: 3, issueKey: 'WEB-3' },
    { id: 'task-4', title: 'Setup offline mode', description: 'Implement service worker and local storage caching.', status: 'ToDo', priority: 'Critical', type: 'Epic', parentTaskId: null, dueDate: '2024-03-15T00:00:00Z', projectId: 'proj-2', sprintId: null, milestoneId: null, assigneeId: 'user-2', assigneeFullName: 'Sarah Chen', createdAt: '2024-02-15T00:00:00Z', issueNumber: 1, issueKey: 'MOB-1' },
    { id: 'task-5', title: 'Push notification service', description: 'Integrate FCM/APNs for push notifications.', status: 'InProgress', priority: 'High', type: 'Task', parentTaskId: 'task-4', dueDate: '2024-03-01T00:00:00Z', projectId: 'proj-2', sprintId: 'sprint-2', milestoneId: null, assigneeId: 'user-3', assigneeFullName: 'James Wilson', createdAt: '2024-02-16T00:00:00Z', issueNumber: 2, issueKey: 'MOB-2' },
    { id: 'task-6', title: 'Payment gateway integration', description: 'Integrate Stripe for payment processing.', status: 'ToDo', priority: 'High', type: 'Task', parentTaskId: null, dueDate: '2024-03-20T00:00:00Z', projectId: 'proj-3', sprintId: null, milestoneId: null, assigneeId: null, assigneeFullName: null, createdAt: '2024-03-01T00:00:00Z', issueNumber: 1, issueKey: 'API-1' },
];

export const mockComments: Comment[] = [
    { id: 'comment-1', taskId: 'task-1', userId: 'user-1', userFullName: 'Admin User', text: 'Looks great! Approved.', createdAt: '2024-02-08T00:00:00Z', isDeleted: false, canEdit: true, canDelete: true },
    { id: 'comment-2', taskId: 'task-1', userId: 'user-2', userFullName: 'Sarah Chen', text: 'Thanks! I will finalize the assets today.', createdAt: '2024-02-08T01:00:00Z', isDeleted: false, canEdit: false, canDelete: false },
    { id: 'comment-3', taskId: 'task-2', userId: 'user-3', userFullName: 'James Wilson', text: 'Started working on the hamburger menu.', createdAt: '2024-02-12T00:00:00Z', isDeleted: false, canEdit: true, canDelete: true },
];

export const mockSprints: Sprint[] = [
    { id: 'sprint-1', name: 'Sprint 1 - Foundation', description: 'Core layout and navigation components', status: 'Active', startDate: '2024-02-05T00:00:00Z', endDate: '2024-02-19T00:00:00Z', projectId: 'proj-1', createdByUserId: 'user-1', createdByUserFullName: 'Admin User', createdAt: '2024-02-01T00:00:00Z' },
    { id: 'sprint-2', name: 'Sprint 2 - Offline Features', description: 'Offline mode and sync', status: 'Planned', startDate: '2024-03-01T00:00:00Z', endDate: '2024-03-15T00:00:00Z', projectId: 'proj-2', createdByUserId: 'user-1', createdByUserFullName: 'Admin User', createdAt: '2024-02-15T00:00:00Z' },
];

export const mockMilestones: Milestone[] = [
    { id: 'mile-1', projectId: 'proj-1', name: 'MVP Launch', description: 'Minimum viable product for public beta', dueDate: '2024-03-01T00:00:00Z', status: 'Open', createdAt: '2024-02-01T00:00:00Z', taskCount: 5, completedTaskCount: 1, progressPercentage: 20 },
    { id: 'mile-2', projectId: 'proj-2', name: 'Beta Release', description: 'Closed beta for select users', dueDate: '2024-04-01T00:00:00Z', status: 'Open', createdAt: '2024-02-15T00:00:00Z', taskCount: 8, completedTaskCount: 0, progressPercentage: 0 },
];

export const mockDependencies: TaskDependency[] = [
    { id: 'dep-1', taskId: 'task-2', taskTitle: 'Implement responsive navigation', dependsOnTaskId: 'task-1', dependsOnTaskTitle: 'Design new homepage layout', type: 'Blocks', projectId: 'proj-1' },
];

export const mockTimeLogs: TimeLog[] = [
    { id: 'tl-1', taskId: 'task-1', taskTitle: 'Design new homepage layout', projectId: 'proj-1', userId: 'user-2', userFullName: 'Sarah Chen', date: '2024-02-05', hours: 4, note: 'Initial mockups', createdAt: '2024-02-05T00:00:00Z' },
    { id: 'tl-2', taskId: 'task-2', taskTitle: 'Implement responsive navigation', projectId: 'proj-1', userId: 'user-3', userFullName: 'James Wilson', date: '2024-02-12', hours: 6, note: 'Navigation component', createdAt: '2024-02-12T00:00:00Z' },
];

export const mockActivities: ActivityLog[] = [
    { id: 'act-1', action: 'TaskCreated', description: 'Admin User created task "Design new homepage layout"', projectId: 'proj-1', taskId: 'task-1', actorId: 'user-1', actorFullName: 'Admin User', createdAt: '2024-02-01T00:00:00Z' },
    { id: 'act-2', action: 'TaskUpdated', description: 'Sarah Chen updated task "Implement responsive navigation"', projectId: 'proj-1', taskId: 'task-2', actorId: 'user-2', actorFullName: 'Sarah Chen', createdAt: '2024-02-05T00:00:00Z' },
    { id: 'act-3', action: 'CommentAdded', description: 'Admin User commented on "Design new homepage layout"', projectId: 'proj-1', taskId: 'task-1', actorId: 'user-1', actorFullName: 'Admin User', createdAt: '2024-02-08T00:00:00Z' },
    { id: 'act-4', action: 'MemberAdded', description: 'Admin User added Emily Davis to Website Redesign', projectId: 'proj-1', taskId: null, actorId: 'user-1', actorFullName: 'Admin User', createdAt: '2024-02-10T00:00:00Z' },
];

export const mockNotifications: Notification[] = [
    { id: 'notif-1', type: 'TaskAssigned', message: 'You were assigned to "Implement responsive navigation"', link: '/projects/proj-1', createdAt: '2024-02-05T00:00:00Z', isRead: false, projectId: 'proj-1', taskId: 'task-2' },
    { id: 'notif-2', type: 'CommentAdded', message: 'Sarah Chen commented on "Design new homepage layout"', link: '/projects/proj-1', createdAt: '2024-02-08T00:00:00Z', isRead: true, projectId: 'proj-1', taskId: 'task-1' },
    { id: 'notif-3', type: 'TaskStatusChanged', message: '"Fix login button alignment" status changed to To Do', link: '/projects/proj-1', createdAt: '2024-02-12T00:00:00Z', isRead: false, projectId: 'proj-1', taskId: 'task-3' },
];

export const mockAttachments: Attachment[] = [
    { id: 'att-1', fileName: 'homepage-mockup.png', contentType: 'image/png', sizeBytes: 245000, taskId: 'task-1', uploadedById: 'user-2', uploadedByFullName: 'Sarah Chen', createdAt: '2024-02-05T00:00:00Z' },
];

export const mockLabels: Label[] = [
    { id: 'label-1', name: 'Design', color: '#818cf8', projectId: 'proj-1' },
    { id: 'label-2', name: 'Frontend', color: '#34d399', projectId: 'proj-1' },
    { id: 'label-3', name: 'Bug', color: '#f87171', projectId: 'proj-1' },
];

export const mockUsers = [
    { id: 'user-1', fullName: 'Admin User', email: 'admin@luma.com', role: 'Admin' as const },
    { id: 'user-2', fullName: 'Sarah Chen', email: 'sarah@example.com', role: 'Admin' as const },
    { id: 'user-3', fullName: 'James Wilson', email: 'james@example.com', role: 'Member' as const },
    { id: 'user-4', fullName: 'Emily Davis', email: 'emily@example.com', role: 'Member' as const },
    { id: 'user-5', fullName: 'Michael Brown', email: 'michael@example.com', role: 'Viewer' as const },
];

export const mockDashboard: DashboardSummary = {
    totalProjects: 3,
    totalTasks: 6,
    completedTasks: 1,
    inProgressTasks: 2,
    overdueTasks: 1,
    overallCompletionRate: 17,
    projects: [
        { projectId: 'proj-1', projectName: 'Website Redesign', totalTasks: 3, completedTasks: 1, inProgressTasks: 1, todoTasks: 1, completionPercentage: 33, overdueTasks: 0, averageCompletionTimeDays: 2, totalTimeLoggedHours: 10, healthStatus: 'Healthy', statusDistribution: [{ status: 'To Do', count: 1, percentage: 33 }, { status: 'In Progress', count: 1, percentage: 33 }, { status: 'Done', count: 1, percentage: 33 }], priorityDistribution: [{ priority: 'High', count: 2, percentage: 66 }, { priority: 'Medium', count: 1, percentage: 33 }], assigneeWorkload: [{ assigneeId: 'user-2', assigneeName: 'Sarah Chen', taskCount: 1, totalHoursLogged: 4 }, { assigneeId: 'user-3', assigneeName: 'James Wilson', taskCount: 1, totalHoursLogged: 6 }] },
        { projectId: 'proj-2', projectName: 'Mobile App v2', totalTasks: 2, completedTasks: 0, inProgressTasks: 1, todoTasks: 1, completionPercentage: 0, overdueTasks: 1, averageCompletionTimeDays: 0, totalTimeLoggedHours: 0, healthStatus: 'At Risk', statusDistribution: [{ status: 'To Do', count: 1, percentage: 50 }, { status: 'In Progress', count: 1, percentage: 50 }], priorityDistribution: [{ priority: 'Critical', count: 1, percentage: 50 }, { priority: 'High', count: 1, percentage: 50 }], assigneeWorkload: [{ assigneeId: 'user-2', assigneeName: 'Sarah Chen', taskCount: 1, totalHoursLogged: 0 }, { assigneeId: 'user-3', assigneeName: 'James Wilson', taskCount: 1, totalHoursLogged: 0 }] },
        { projectId: 'proj-3', projectName: 'API Integration', totalTasks: 1, completedTasks: 0, inProgressTasks: 0, todoTasks: 1, completionPercentage: 0, overdueTasks: 0, averageCompletionTimeDays: 0, totalTimeLoggedHours: 0, healthStatus: 'Healthy', statusDistribution: [{ status: 'To Do', count: 1, percentage: 100 }], priorityDistribution: [{ priority: 'High', count: 1, percentage: 100 }], assigneeWorkload: [] },
    ],
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
    ToDo: 'To Do',
    InProgress: 'In Progress',
    Done: 'Done',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
    Critical: 'Critical',
    Low: 'Low',
    Medium: 'Medium',
    High: 'High',
};

export const TASK_TYPE_LABELS: Record<TaskItemType, string> = {
    Epic: 'Epic',
    Story: 'Story',
    Bug: 'Bug',
    Task: 'Task',
};

export const SPRINT_STATUS_LABELS: Record<SprintStatus, string> = {
    Planned: 'Planned',
    Active: 'Active',
    Completed: 'Completed',
};

export const publicPortalApi = {
    project: (projectId: string, _token: string) =>
        Promise.resolve({ data: mockProjects.find((p) => p.id === projectId) ?? null }),
    tasks: (projectId: string, _token: string) =>
        Promise.resolve({ data: mockTasks.filter((t) => t.projectId === projectId) }),
    members: (_projectId: string, _token: string) =>
        Promise.resolve({ data: mockProjectMembers }),
    health: (_projectId: string, _token: string) =>
        Promise.resolve({ data: mockDashboard.projects[0] }),
};
