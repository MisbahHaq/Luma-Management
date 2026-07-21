using System.ComponentModel.DataAnnotations;
using Luma.Server.Models;

namespace Luma.Server.DTOs.Milestones;

public class CreateMilestoneDto
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    public DateTime? DueDate { get; set; }
}

public class UpdateMilestoneDto
{
    [MaxLength(200)]
    public string? Name { get; set; }

    [MaxLength(2000)]
    public string? Description { get; set; }

    public DateTime? DueDate { get; set; }

    public MilestoneStatus? Status { get; set; }
}

public class MilestoneResponseDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? DueDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int TaskCount { get; set; }
    public int CompletedTaskCount { get; set; }
    public int ProgressPercentage { get; set; }
}
