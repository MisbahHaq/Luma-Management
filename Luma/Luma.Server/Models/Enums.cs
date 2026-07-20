namespace Luma.Server.Models;

public enum UserRole
{
    Admin,
    Member,
    Viewer
}

public enum TaskStatus
{
    ToDo,
    InProgress,
    Done
}

public enum TaskPriority
{
    Low,
    Medium,
    High
}

public enum TaskItemType
{
    Epic,
    Story,
    Bug,
    Task
}

public enum ProjectRole
{
    Owner,
    Editor,
    Viewer
}
