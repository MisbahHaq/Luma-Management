using System.ComponentModel.DataAnnotations;

namespace Luma.Server.Models;

public class Comment
{
    public Guid Id { get; set; }

    [Required]
    public Guid TaskId { get; set; }

    public TaskItem? Task { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;

    public ApplicationUser? User { get; set; }

    [Required]
    [MaxLength(4000)]
    public string Text { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
