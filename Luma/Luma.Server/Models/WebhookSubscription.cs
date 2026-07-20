using System.ComponentModel.DataAnnotations;

namespace Luma.Server.Models;

public class WebhookSubscription
{
    public Guid Id { get; set; }

    [Required]
    public Guid TenantId { get; set; }

    public Tenant? Tenant { get; set; }

    public Guid? ProjectId { get; set; }

    public Project? Project { get; set; }

    [Required]
    [MaxLength(500)]
    public string Url { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string Secret { get; set; } = string.Empty;

    [Required]
    [MaxLength(1000)]
    public string Events { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required]
    public string CreatedByUserId { get; set; } = string.Empty;

    public ApplicationUser? CreatedByUser { get; set; }

    public ICollection<WebhookDelivery> Deliveries { get; set; } = new List<WebhookDelivery>();
}
