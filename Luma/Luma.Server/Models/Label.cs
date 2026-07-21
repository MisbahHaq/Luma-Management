using System.ComponentModel.DataAnnotations;

namespace Luma.Server.Models;

public class Label
{
    public Guid Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(7)]
    public string Color { get; set; } = string.Empty;

    [Required]
    public Guid ProjectId { get; set; }

    public Project? Project { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class TaskLabel
{
    public Guid Id { get; set; }

    [Required]
    public Guid TaskId { get; set; }

    public TaskItem? Task { get; set; }

    [Required]
    public Guid LabelId { get; set; }

    public Label? Label { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
