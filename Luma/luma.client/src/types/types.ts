export type UserRole = 'Admin' | 'Member' | 'Viewer';

export type TaskStatus = 'ToDo' | 'InProgress' | 'Done';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type TaskItemType = 'Epic' | 'Story' | 'Bug' | 'Task';

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

export interface SearchProjectResult {
    id: string;
    name: string;
    description: string | null;
    taskCount: number;
}

export interface SearchTaskResult {
    id: string;
    title: string;
    description: string | null;
    projectId: string;
    projectName: string;
    status: TaskStatus;
    assigneeFullName: string | null;
}

export interface SearchResponse {
    query: string;
    projects: SearchProjectResult[];
    tasks: SearchTaskResult[];
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
    isDeleted: boolean;
    canEdit: boolean;
    canDelete: boolean;
}

export interface Label {
    id: string;
    name: string;
    color: string;
    projectId: string;
}

export interface BulkResult {
    succeeded: number;
    failed: number;
    errors: string[];
}

export interface BulkStatusRequest {
    taskIds: string[];
    status: string;
}

export interface BulkPriorityRequest {
    taskIds: string[];
    priority: string;
}

export interface BulkAssigneeRequest {
    taskIds: string[];
    assigneeId: string | null;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
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
    | 'TimeLogged'
    | 'TaskBulkStatusChanged'
    | 'TaskBulkPriorityChanged'
    | 'TaskBulkAssigneeChanged'
    | 'TaskBulkDeleted';

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

export type ProjectRole = 'Owner' | 'Editor' | 'Viewer';

export interface ProjectMemberSummary {
    id: string;
    fullName: string | null;
    email: string | null;
    globalRole: UserRole;
    projectRole: ProjectRole;
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

export const STATUS_META: Record<TaskStatus, { label: string; className: string }> = {
    ToDo: { label: 'To Do', className: 'status-todo' },
    InProgress: { label: 'In Progress', className: 'status-inprogress' },
    Done: { label: 'Done', className: 'status-done' },
};

export const PRIORITY_META: Record<TaskPriority, { label: string; className: string }> = {
    Critical: { label: 'Critical', className: 'priority-critical' },
    High: { label: 'High', className: 'priority-high' },
    Medium: { label: 'Medium', className: 'priority-medium' },
    Low: { label: 'Low', className: 'priority-low' },
};

export const TASK_TYPE_META: Record<TaskItemType, { label: string; className: string }> = {
    Epic: { label: 'Epic', className: 'type-epic' },
    Story: { label: 'Story', className: 'type-story' },
    Bug: { label: 'Bug', className: 'type-bug' },
    Task: { label: 'Task', className: 'type-task' },
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

export interface PagedResult<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
