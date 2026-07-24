export type UserRole = 'Admin' | 'Member' | 'Viewer';
export type WorkspaceRole = 'Owner' | 'Admin' | 'Member';
export type ProjectRole = 'Owner' | 'Editor' | 'Viewer';
export type TaskStatus = 'ToDo' | 'InProgress' | 'Review' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TaskItemType = 'Epic' | 'Story' | 'Bug' | 'Task';
export type SprintStatus = 'Planned' | 'Active' | 'Completed';
export type MilestoneStatus = 'Open' | 'Completed';
export type DependencyType = 'Blocks' | 'BlockedBy';

export interface User {
    id: string;
    email: string;
    fullName: string | null;
    role: UserRole;
}

export interface Workspace {
    id: string;
    name: string;
    slug: string;
    tenantId: string;
    createdAt: string;
    createdByUserId: string;
    createdByUserFullName: string | null;
    memberCount: number;
    projectCount: number;
}

export interface WorkspaceMember {
    userId: string;
    fullName: string | null;
    email: string | null;
    role: WorkspaceRole;
    addedAt: string;
}

export interface Project {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    createdByUserId: string;
    createdByUserFullName: string | null;
    workspaceId: string | null;
    workspaceName: string | null;
    workspaceSlug: string | null;
    issueKeyPrefix: string;
}

export interface ProjectMemberSummary {
    id: string;
    fullName: string | null;
    email: string | null;
    globalRole: UserRole;
    projectRole: ProjectRole;
}

export interface Task {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    type: TaskItemType;
    parentTaskId: string | null;
    dueDate: string | null;
    projectId: string;
    sprintId: string | null;
    milestoneId: string | null;
    assigneeId: string | null;
    assigneeFullName: string | null;
    createdAt: string;
    issueNumber: number;
    issueKey: string;
}

export interface Comment {
    id: string;
    taskId: string;
    userId: string;
    userFullName: string;
    text: string;
    createdAt: string;
    isDeleted: boolean;
    canEdit: boolean;
    canDelete: boolean;
}

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

export interface Milestone {
    id: string;
    projectId: string;
    name: string;
    description: string | null;
    dueDate: string | null;
    status: MilestoneStatus;
    createdAt: string;
    taskCount: number;
    completedTaskCount: number;
    progressPercentage: number;
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

export interface ActivityLog {
    id: string;
    action: string;
    description: string;
    projectId: string | null;
    taskId: string | null;
    actorId: string;
    actorFullName: string | null;
    createdAt: string;
}

export interface Notification {
    id: string;
    type: string;
    message: string;
    link: string | null;
    createdAt: string;
    isRead: boolean;
    projectId: string | null;
    taskId: string | null;
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
    statusDistribution: { status: string; count: number; percentage: number }[];
    priorityDistribution: { priority: string; count: number; percentage: number }[];
    assigneeWorkload: { assigneeId: string; assigneeName: string; taskCount: number; totalHoursLogged: number }[];
}

export interface BurndownReport {
    projectId: string;
    projectName: string;
    sprintId: string;
    sprintName: string;
    sprintStart: string;
    sprintEnd: string;
    totalTasks: number;
    dataPoints: { date: string; remainingTasks: number; idealRemaining: number }[];
}

export interface VelocityReport {
    projectId: string;
    projectName: string;
    averageVelocity: number;
    dataPoints: { sprintId: string; sprintName: string; sprintStart: string; sprintEnd: string; completedTasks: number; storyPoints: number }[];
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

export interface Label {
    id: string;
    name: string;
    color: string;
    projectId: string;
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
    ToDo: 'Backlog',
    InProgress: 'In Progress',
    Review: 'Review',
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
