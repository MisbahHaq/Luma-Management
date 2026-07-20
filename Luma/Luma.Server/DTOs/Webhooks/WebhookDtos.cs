using System.ComponentModel.DataAnnotations;
using Luma.Server.Models;

namespace Luma.Server.DTOs.Webhooks;

public class CreateWebhookSubscriptionDto
{
    [Required]
    public Guid TenantId { get; set; }

    public Guid? ProjectId { get; set; }

    [Required, MaxLength(500)]
    public string Url { get; set; } = string.Empty;

    [Required, MaxLength(500)]
    public string Secret { get; set; } = string.Empty;

    [Required, MaxLength(1000)]
    public string Events { get; set; } = string.Empty;
}

public class UpdateWebhookSubscriptionDto
{
    [MaxLength(500)]
    public string? Url { get; set; }

    [MaxLength(500)]
    public string? Secret { get; set; }

    [MaxLength(1000)]
    public string? Events { get; set; }

    public bool? IsActive { get; set; }
}

public class WebhookSubscriptionResponseDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string TenantName { get; set; } = string.Empty;
    public Guid? ProjectId { get; set; }
    public string? ProjectName { get; set; }
    public string Url { get; set; } = string.Empty;
    public string Events { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedByUserId { get; set; } = string.Empty;
    public string? CreatedByUserFullName { get; set; }
    public int PendingDeliveries { get; set; }
    public int FailedDeliveries { get; set; }
}

public class WebhookDeliveryResponseDto
{
    public Guid Id { get; set; }
    public Guid SubscriptionId { get; set; }
    public string EventType { get; set; } = string.Empty;
    public WebhookDeliveryStatus Status { get; set; }
    public int Attempts { get; set; }
    public int MaxAttempts { get; set; }
    public string? LastError { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}
