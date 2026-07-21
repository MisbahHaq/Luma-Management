using System.ComponentModel.DataAnnotations;

namespace Luma.Server.DTOs.Comments;

public class CommentUpdateDto
{
    [Required, MaxLength(4000)]
    public string Text { get; set; } = string.Empty;
}
