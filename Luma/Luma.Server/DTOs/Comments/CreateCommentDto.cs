using System.ComponentModel.DataAnnotations;

namespace Luma.Server.DTOs.Comments;

public class CreateCommentDto
{
    [Required]
    public Guid TaskId { get; set; }

    [Required, MaxLength(4000)]
    public string Text { get; set; } = string.Empty;
}
