using System.ComponentModel.DataAnnotations;

namespace Luma.Server.Models;

public enum SprintStatus
{
    Planned,
    Active,
    Completed
}

public class Sprint
{
    public Guid Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    public SprintStatus Status { get; set; } = SprintStatus.Planned;

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    [Required]
    public Guid ProjectId { get; set; }

    public Project? Project { get; set; }

    [Required]
    public string CreatedByUserId { get; set; } = string.Empty;

    public ApplicationUser? CreatedByUser { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
}

public enum DependencyType
{
    Blocks,
    BlockedBy
}

public class TaskDependency
{
    public Guid Id { get; set; }

    [Required]
    public Guid TaskId { get; set; }

    public TaskItem? Task { get; set; }

    [Required]
    public Guid DependsOnTaskId { get; set; }

    public TaskItem? DependsOnTask { get; set; }

    public DependencyType Type { get; set; } = DependencyType.BlockedBy;

    [Required]
    public Guid ProjectId { get; set; }

    public Project? Project { get; set; }
}

public class TimeLog
{
    public Guid Id { get; set; }

    [Required]
    public Guid TaskId { get; set; }

    public TaskItem? Task { get; set; }

    [Required]
    public Guid ProjectId { get; set; }

    public Project? Project { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;

    public ApplicationUser? User { get; set; }

    public DateTime Date { get; set; } = DateTime.UtcNow.Date;

    public double Hours { get; set; }

    [MaxLength(2000)]
    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
