using System.ComponentModel.DataAnnotations;

namespace Luma.Server.Models;

public class BackgroundJob
{
    public Guid Id { get; set; }

    public Guid? TenantId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Type { get; set; } = string.Empty;

    [Required]
    public string Payload { get; set; } = string.Empty;

    public JobStatus Status { get; set; } = JobStatus.Pending;

    public int Priority { get; set; } = 0;

    public int Attempts { get; set; } = 0;

    public int MaxAttempts { get; set; } = 3;

    public DateTime? NextAttemptAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? StartedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    [MaxLength(4000)]
    public string? Error { get; set; }

    public Guid? ParentJobId { get; set; }

    public DateTime? LockedUntil { get; set; }
}

public enum JobStatus
{
    Pending,
    Processing,
    Completed,
    Failed,
    DeadLettered
}
