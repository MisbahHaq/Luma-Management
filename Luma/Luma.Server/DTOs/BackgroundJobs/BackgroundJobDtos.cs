using Luma.Server.Models;
using System.ComponentModel.DataAnnotations;

namespace Luma.Server.DTOs.BackgroundJobs;

public class BackgroundJobResponseDto
{
    public Guid Id { get; set; }
    public Guid? TenantId { get; set; }
    public string Type { get; set; } = string.Empty;
    public JobStatus Status { get; set; }
    public int Priority { get; set; }
    public int Attempts { get; set; }
    public int MaxAttempts { get; set; }
    public DateTime? NextAttemptAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? Error { get; set; }
    public Guid? ParentJobId { get; set; }
}

public class CreateBackgroundJobDto
{
    [Required, MaxLength(100)]
    public string Type { get; set; } = string.Empty;

    [Required]
    public string Payload { get; set; } = string.Empty;

    public int Priority { get; set; } = 0;

    public int MaxAttempts { get; set; } = 3;

    public Guid? TenantId { get; set; }

    public Guid? ParentJobId { get; set; }
}
