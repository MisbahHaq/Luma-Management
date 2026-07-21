using System.ComponentModel.DataAnnotations;

namespace Luma.Server.Models;

public class Workspace
{
    public Guid Id { get; set; }

    [Required]
    public Guid TenantId { get; set; }

    public Tenant? Tenant { get; set; }

    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Slug { get; set; } = string.Empty;

    [Required]
    public string CreatedByUserId { get; set; } = string.Empty;

    public ApplicationUser? CreatedByUser { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Project> Projects { get; set; } = new List<Project>();

    public ICollection<WorkspaceMember> Members { get; set; } = new List<WorkspaceMember>();
}
