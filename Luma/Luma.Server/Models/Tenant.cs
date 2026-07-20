using System.ComponentModel.DataAnnotations;

namespace Luma.Server.Models;

public class Tenant
{
    public Guid Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Slug { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public string CreatedByUserId { get; set; } = string.Empty;

    public ApplicationUser? CreatedByUser { get; set; }

    public ICollection<Project> Projects { get; set; } = new List<Project>();
}
