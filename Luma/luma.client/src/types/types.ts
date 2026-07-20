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
    sprintId: string | null;
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

export interface Attachment {
    id: string;
    fileName: string;
    contentType: string;
    sizeBytes: number;
    taskId: string;
    uploadedById: string;
    uploadedByFullName: string | null;
    createdAt: string;
}

export type ActivityAction =
    | 'ProjectCreated'
    | 'ProjectUpdated'
    | 'ProjectDeleted'
    | 'TaskCreated'
    | 'TaskUpdated'
    | 'TaskMoved'
    | 'TaskDeleted'
    | 'CommentAdded'
    | 'AttachmentAdded'
    | 'AttachmentRemoved'
    | 'MemberAdded'
    | 'MemberRemoved'
    | 'SprintCreated'
    | 'SprintUpdated'
    | 'SprintCompleted'
    | 'DependencyAdded'
    | 'DependencyRemoved'
    | 'TimeLogged';

export interface ActivityLog {
    id: string;
    action: ActivityAction;
    description: string;
    projectId: string | null;
    taskId: string | null;
    actorId: string;
    actorFullName: string | null;
    createdAt: string;
}

export type NotificationType =
    | 'TaskAssigned'
    | 'TaskStatusChanged'
    | 'CommentAdded'
    | 'AttachmentAdded'
    | 'MemberAdded'
    | 'Mentioned'
    | 'SprintCreated'
    | 'DependencyAdded'
    | 'TimeLogged';

export interface Notification {
    id: string;
    type: NotificationType;
    message: string;
    link: string | null;
    createdAt: string;
    isRead: boolean;
    projectId: string | null;
    taskId: string | null;
}

export interface ProjectMember {
    id: string;
    userId: string;
    fullName: string | null;
    email: string | null;
    role: UserRole;
}

export type SprintStatus = 'Planned' | 'Active' | 'Completed';

export type DependencyType = 'Blocks' | 'BlockedBy';

export interface Sprint {
    id: string;
    name: string;
    description: string | null;
    status: SprintStatus;
    startDate: string | null;
    endDate: string | null;
    projectId: string;
    createdByUserId: string;
    createdByUserFullName: string | null;
    createdAt: string;
}

export interface TaskDependency {
    id: string;
    taskId: string;
    taskTitle: string;
    dependsOnTaskId: string;
    dependsOnTaskTitle: string;
    type: DependencyType;
    projectId: string;
}

export interface TimeLog {
    id: string;
    taskId: string;
    taskTitle: string;
    projectId: string;
    userId: string;
    userFullName: string | null;
    date: string;
    hours: number;
    note: string | null;
    createdAt: string;
}

export const SPRINT_STATUS_LABELS: Record<SprintStatus, string> = {
    Planned: 'Planned',
    Active: 'Active',
    Completed: 'Completed',
};

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

export interface BurndownPoint {
    date: string;
    remainingTasks: number;
    idealRemaining: number;
}

export interface BurndownReport {
    projectId: string;
    projectName: string;
    sprintId: string;
    sprintName: string;
    sprintStart: string;
    sprintEnd: string;
    totalTasks: number;
    dataPoints: BurndownPoint[];
}

export interface VelocityPoint {
    sprintId: string;
    sprintName: string;
    sprintStart: string;
    sprintEnd: string;
    completedTasks: number;
    storyPoints: number;
}

export interface VelocityReport {
    projectId: string;
    projectName: string;
    averageVelocity: number;
    dataPoints: VelocityPoint[];
}

export interface TaskStatusDistribution {
    status: string;
    count: number;
    percentage: number;
}

export interface TaskPriorityDistribution {
    priority: string;
    count: number;
    percentage: number;
}

export interface AssigneeWorkload {
    assigneeId: string;
    assigneeName: string;
    taskCount: number;
    totalHoursLogged: number;
}

export interface ProjectHealth {
    projectId: string;
    projectName: string;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    completionPercentage: number;
    overdueTasks: number;
    averageCompletionTimeDays: number;
    totalTimeLoggedHours: number;
    healthStatus: string;
    statusDistribution: TaskStatusDistribution[];
    priorityDistribution: TaskPriorityDistribution[];
    assigneeWorkload: AssigneeWorkload[];
}

export interface DashboardSummary {
    totalProjects: number;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    overallCompletionRate: number;
    projects: ProjectHealth[];
}
