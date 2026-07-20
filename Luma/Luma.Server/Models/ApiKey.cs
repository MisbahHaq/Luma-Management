using System.ComponentModel.DataAnnotations;

namespace Luma.Server.Models;

public class ApiKey
{
    public Guid Id { get; set; }

    [Required]
    public Guid TenantId { get; set; }

    public Tenant? Tenant { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string KeyPrefix { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string KeyHash { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Scopes { get; set; }

    public DateTime? ExpiresAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? LastUsedAt { get; set; }

    public bool IsActive { get; set; } = true;

    [Required]
    public string CreatedByUserId { get; set; } = string.Empty;

    public ApplicationUser? CreatedByUser { get; set; }
}
