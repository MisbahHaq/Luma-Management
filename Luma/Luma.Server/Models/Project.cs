using System.ComponentModel.DataAnnotations;

namespace Luma.Server.Models;

public class Project
{
    public Guid Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public string CreatedByUserId { get; set; } = string.Empty;

    public ApplicationUser? CreatedByUser { get; set; }

    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();

    public ICollection<ProjectMember> Members { get; set; } = new List<ProjectMember>();

    public Guid? TenantId { get; set; }

    public Tenant? Tenant { get; set; }

    public Guid? WorkspaceId { get; set; }

    public Workspace? Workspace { get; set; }

    [MaxLength(200)]
    public string? PublicAccessToken { get; set; }

    [Required, MaxLength(10)]
    public string IssueKeyPrefix { get; set; } = string.Empty;
}
