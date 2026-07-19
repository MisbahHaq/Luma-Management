using System.ComponentModel.DataAnnotations;

namespace Luma.Server.Models;

public enum NotificationType
{
    TaskAssigned,
    TaskStatusChanged,
    CommentAdded,
    AttachmentAdded,
    MemberAdded,
    Mentioned,
    SprintCreated,
    DependencyAdded,
    TimeLogged
}

public class Notification
{
    public Guid Id { get; set; }

    [Required]
    public NotificationType Type { get; set; }

    [Required]
    [MaxLength(500)]
    public string Message { get; set; } = string.Empty;

    public string? Link { get; set; }

    [Required]
    public string RecipientId { get; set; } = string.Empty;

    public ApplicationUser? Recipient { get; set; }

    public Guid? ProjectId { get; set; }

    public Guid? TaskId { get; set; }

    public bool IsRead { get; set; }

    public bool EmailSent { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
