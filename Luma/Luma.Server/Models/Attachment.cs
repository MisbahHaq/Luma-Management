using System.ComponentModel.DataAnnotations;

namespace Luma.Server.Models;

public class Attachment
{
    public Guid Id { get; set; }

    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string ContentType { get; set; } = string.Empty;

    [Required]
    [MaxLength(512)]
    public string ObjectKey { get; set; } = string.Empty;

    public long SizeBytes { get; set; }

    [Required]
    public Guid TaskId { get; set; }

    public TaskItem? Task { get; set; }

    [Required]
    public string UploadedById { get; set; } = string.Empty;

    public ApplicationUser? UploadedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
