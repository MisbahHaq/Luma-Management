using System.ComponentModel.DataAnnotations;

namespace Luma.Server.DTOs.TimeLogs;

public class CreateTimeLogDto
{
    [Required]
    public Guid TaskId { get; set; }

    [Required]
    [Range(0.01, 1000)]
    public double Hours { get; set; }

    public DateTime? Date { get; set; }

    [MaxLength(2000)]
    public string? Note { get; set; }
}

public class TimeLogResponseDto
{
    public Guid Id { get; set; }
    public Guid TaskId { get; set; }
    public string TaskTitle { get; set; } = string.Empty;
    public Guid ProjectId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string? UserFullName { get; set; }
    public DateTime Date { get; set; }
    public double Hours { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
}
