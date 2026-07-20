using System.ComponentModel.DataAnnotations;

namespace Luma.Server.Models;

public class ProjectMember
{
    public Guid Id { get; set; }

    [Required]
    public Guid ProjectId { get; set; }

    public Project? Project { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;

    public ApplicationUser? User { get; set; }

    public ProjectRole Role { get; set; } = ProjectRole.Editor;

    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
}
