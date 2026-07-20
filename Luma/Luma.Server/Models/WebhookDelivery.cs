using System.ComponentModel.DataAnnotations;

namespace Luma.Server.Models;

public class WebhookDelivery
{
    public Guid Id { get; set; }

    [Required]
    public Guid SubscriptionId { get; set; }

    public WebhookSubscription? Subscription { get; set; }

    [Required]
    [MaxLength(100)]
    public string EventType { get; set; } = string.Empty;

    [Required]
    public string Payload { get; set; } = string.Empty;

    public WebhookDeliveryStatus Status { get; set; } = WebhookDeliveryStatus.Pending;

    public int Attempts { get; set; } = 0;

    public int MaxAttempts { get; set; } = 5;

    public DateTime? NextAttemptAt { get; set; }

    [MaxLength(2000)]
    public string? LastError { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? CompletedAt { get; set; }
}

public enum WebhookDeliveryStatus
{
    Pending,
    Succeeded,
    Failed,
    DeadLettered
}
