using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Channels;
using Luma.Server.Data;
using Luma.Server.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Luma.Server.Services;

public class WebhookDispatcherService
{
    private readonly AppDbContext _context;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<WebhookDispatcherService> _logger;

    public WebhookDispatcherService(AppDbContext context, IHttpClientFactory httpClientFactory, ILogger<WebhookDispatcherService> logger)
    {
        _context = context;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task DispatchAsync(string eventType, object payload, Guid? tenantId = null, Guid? projectId = null)
    {
        var subscriptions = await _context.WebhookSubscriptions
            .Where(w => w.IsActive && w.Events.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Contains(eventType))
            .ToListAsync();

        foreach (var subscription in subscriptions)
        {
            if (subscription.TenantId != tenantId) continue;
            if (subscription.ProjectId.HasValue && subscription.ProjectId != projectId) continue;

            var delivery = new WebhookDelivery
            {
                SubscriptionId = subscription.Id,
                EventType = eventType,
                Payload = System.Text.Json.JsonSerializer.Serialize(payload),
                MaxAttempts = 5,
                NextAttemptAt = DateTime.UtcNow
            };

            _context.WebhookDeliveries.Add(delivery);
        }

        await _context.SaveChangesAsync();
    }

    public async Task ProcessPendingAsync(CancellationToken cancellationToken = default)
    {
        var pending = await _context.WebhookDeliveries
            .Include(d => d.Subscription)
            .Where(d => d.Status == WebhookDeliveryStatus.Pending && d.NextAttemptAt <= DateTime.UtcNow)
            .OrderBy(d => d.CreatedAt)
            .Take(50)
            .ToListAsync(cancellationToken);

        foreach (var delivery in pending)
        {
            await DeliverAsync(delivery, cancellationToken);
        }
    }

    private async Task DeliverAsync(WebhookDelivery delivery, CancellationToken cancellationToken)
    {
        if (delivery.Subscription is null) return;

        delivery.Status = WebhookDeliveryStatus.Pending;
        delivery.Attempts++;
        delivery.NextAttemptAt = null;

        try
        {
            using var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(30);

            using var request = new HttpRequestMessage(HttpMethod.Post, delivery.Subscription.Url);
            request.Content = new StringContent(delivery.Payload, Encoding.UTF8, "application/json");

            var signature = Convert.ToBase64String(System.Security.Cryptography.SHA256.HashData(Encoding.UTF8.GetBytes(delivery.Payload + delivery.Subscription.Secret)));
            request.Headers.Add("X-Luma-Signature", signature);
            request.Headers.Add("X-Luma-Event", delivery.EventType);
            request.Headers.Add("X-Luma-Delivery", delivery.Id.ToString());

            var response = await client.SendAsync(request, cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                delivery.Status = WebhookDeliveryStatus.Succeeded;
                delivery.CompletedAt = DateTime.UtcNow;
            }
            else
            {
                HandleFailure(delivery, $"HTTP {(int)response.StatusCode}: {response.ReasonPhrase}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Webhook delivery failed for {DeliveryId}", delivery.Id);
            HandleFailure(delivery, ex.Message);
        }
        finally
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    private void HandleFailure(WebhookDelivery delivery, string error)
    {
        delivery.LastError = error;

        if (delivery.Attempts >= delivery.MaxAttempts)
        {
            delivery.Status = WebhookDeliveryStatus.DeadLettered;
            delivery.CompletedAt = DateTime.UtcNow;
        }
        else
        {
            delivery.Status = WebhookDeliveryStatus.Failed;
            delivery.NextAttemptAt = DateTime.UtcNow.AddMinutes(Math.Pow(2, delivery.Attempts));
        }
    }
}
