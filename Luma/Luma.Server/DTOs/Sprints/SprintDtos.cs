using Luma.Server.Models;
using System.ComponentModel.DataAnnotations;

namespace Luma.Server.DTOs.Sprints;

public class CreateSprintDto
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    public SprintStatus Status { get; set; } = SprintStatus.Planned;

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    [Required]
    public Guid ProjectId { get; set; }
}

public class UpdateSprintDto
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    public SprintStatus Status { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }
}

public class SprintResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public SprintStatus Status { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public Guid ProjectId { get; set; }
    public string CreatedByUserId { get; set; } = string.Empty;
    public string? CreatedByUserFullName { get; set; }
    public DateTime CreatedAt { get; set; }
}
