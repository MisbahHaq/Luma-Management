using System.ComponentModel.DataAnnotations;

namespace Luma.Server.Models;

public class WorkspaceMember
{
    public Guid Id { get; set; }

    [Required]
    public Guid WorkspaceId { get; set; }

    public Workspace? Workspace { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;

    public ApplicationUser? User { get; set; }

    [Required]
    public WorkspaceRole Role { get; set; } = WorkspaceRole.Member;

    public DateTime AddedAt { get; set; } = DateTime.UtcNow;
}
