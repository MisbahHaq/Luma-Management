using System.ComponentModel.DataAnnotations;

namespace Luma.Server.Models;

public class TaskItem
{
    public Guid Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(4000)]
    public string? Description { get; set; }

    public TaskStatus Status { get; set; } = TaskStatus.ToDo;

    public TaskPriority Priority { get; set; } = TaskPriority.Medium;

    public TaskItemType Type { get; set; } = TaskItemType.Task;

    public Guid? ParentTaskId { get; set; }

    public TaskItem? ParentTask { get; set; }

    public ICollection<TaskItem> Children { get; set; } = new List<TaskItem>();

    public DateTime? DueDate { get; set; }

    [Required]
    public Guid ProjectId { get; set; }

    public Project? Project { get; set; }

    public Guid? SprintId { get; set; }

    public Sprint? Sprint { get; set; }

    public string? AssigneeId { get; set; }

    public ApplicationUser? Assignee { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Comment> Comments { get; set; } = new List<Comment>();

    public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
}
