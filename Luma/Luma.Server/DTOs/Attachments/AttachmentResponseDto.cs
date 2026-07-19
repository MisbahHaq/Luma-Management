using System.ComponentModel.DataAnnotations;

namespace Luma.Server.DTOs.Attachments;

public class AttachmentResponseDto
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public Guid TaskId { get; set; }
    public string UploadedById { get; set; } = string.Empty;
    public string? UploadedByFullName { get; set; }
    public DateTime CreatedAt { get; set; }
}
