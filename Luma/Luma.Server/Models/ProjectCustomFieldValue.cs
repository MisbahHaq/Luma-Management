using System.ComponentModel.DataAnnotations;

namespace Luma.Server.Models;

public class ProjectCustomFieldValue
{
    public Guid Id { get; set; }

    [Required]
    public Guid CustomFieldId { get; set; }

    public ProjectCustomField? CustomField { get; set; }

    [Required]
    public Guid TaskId { get; set; }

    public TaskItem? Task { get; set; }

    public string? Value { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
