using System.ComponentModel.DataAnnotations;

namespace Luma.Server.Models;

public class Milestone
{
    public Guid Id { get; set; }

    [Required]
    public Guid ProjectId { get; set; }

    public Project? Project { get; set; }

    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    public DateTime? DueDate { get; set; }

    public MilestoneStatus Status { get; set; } = MilestoneStatus.Open;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
}

public enum MilestoneStatus
{
    Open,
    Completed
}
