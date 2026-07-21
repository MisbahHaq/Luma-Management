using System.ComponentModel.DataAnnotations;

namespace Luma.Server.Models;

public enum ActivityAction
{
    ProjectCreated,
    ProjectUpdated,
    ProjectDeleted,
    TaskCreated,
    TaskUpdated,
    TaskMoved,
    TaskDeleted,
    CommentAdded,
    AttachmentAdded,
    AttachmentRemoved,
    MemberAdded,
    MemberRemoved,
    SprintCreated,
    SprintUpdated,
    SprintCompleted,
    DependencyAdded,
    DependencyRemoved,
    TimeLogged,
    PasswordResetRequested,
    PasswordResetCompleted,
    CommentUpdated,
    CommentRemoved,
    LabelCreated,
    LabelUpdated,
    LabelRemoved,
    TaskLabelAdded,
    TaskLabelRemoved,
    TaskBulkStatusChanged,
    TaskBulkPriorityChanged,
    TaskBulkAssigneeChanged,
    TaskBulkDeleted
}

public class ActivityLog
{
    public Guid Id { get; set; }

    [Required]
    public ActivityAction Action { get; set; }

    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    public Guid? ProjectId { get; set; }

    public Project? Project { get; set; }

    public Guid? TaskId { get; set; }

    public TaskItem? Task { get; set; }

    [Required]
    public string ActorId { get; set; } = string.Empty;

    public ApplicationUser? Actor { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
