using System.ComponentModel.DataAnnotations;

namespace Luma.Server.DTOs.ApiKeys;

public class CreateApiKeyDto
{
    [Required]
    public Guid TenantId { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Scopes { get; set; }

    public DateTime? ExpiresAt { get; set; }
}

public class ApiKeyResponseDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string TenantName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string KeyPrefix { get; set; } = string.Empty;
    public string? Scopes { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastUsedAt { get; set; }
    public bool IsActive { get; set; }
}

public class ApiKeyCreatedResponseDto
{
    public Guid Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DateTime? ExpiresAt { get; set; }
    public string Warning { get; set; } = "Store this key securely. It will not be shown again.";
}
