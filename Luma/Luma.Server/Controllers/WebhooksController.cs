using Luma.Server.Data;
using Luma.Server.DTOs.Webhooks;
using Luma.Server.Models;
using Luma.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Luma.Server.Controllers;

[ApiController]
[Route("api/webhooks")]
[Authorize]
public class WebhooksController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ActivityService _activity;
    private readonly WebhookDispatcherService _dispatcher;

    public WebhooksController(AppDbContext context, ActivityService activity, WebhookDispatcherService dispatcher)
    {
        _context = context;
        _activity = activity;
        _dispatcher = dispatcher;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<WebhookSubscriptionResponseDto>>> GetAll([FromQuery] Guid? tenantId, [FromQuery] Guid? projectId)
    {
        // CROSS-TENANT: Admin platform view. Explicit tenantId/projectId params are the
        // intentional scoping; bypass the global tenant filter.
        var query = _context.WebhookSubscriptions
            .IgnoreQueryFilters()
            .Include(w => w.Tenant)
            .Include(w => w.Project)
            .Include(w => w.CreatedByUser)
            .AsQueryable();

        if (tenantId.HasValue)
        {
            query = query.Where(w => w.TenantId == tenantId.Value);
        }

        if (projectId.HasValue)
        {
            query = query.Where(w => w.ProjectId == projectId.Value);
        }

        var subscriptions = await query
            .OrderByDescending(w => w.CreatedAt)
            .Select(w => new WebhookSubscriptionResponseDto
            {
                Id = w.Id,
                TenantId = w.TenantId,
                TenantName = w.Tenant != null ? w.Tenant.Name : string.Empty,
                ProjectId = w.ProjectId,
                ProjectName = w.Project != null ? w.Project.Name : null,
                Url = w.Url,
                Events = w.Events,
                IsActive = w.IsActive,
                CreatedAt = w.CreatedAt,
                CreatedByUserId = w.CreatedByUserId,
                CreatedByUserFullName = w.CreatedByUser != null ? w.CreatedByUser.FullName : null,
                PendingDeliveries = _context.WebhookDeliveries.Count(d => d.SubscriptionId == w.Id && d.Status == WebhookDeliveryStatus.Pending),
                FailedDeliveries = _context.WebhookDeliveries.Count(d => d.SubscriptionId == w.Id && d.Status == WebhookDeliveryStatus.Failed)
            })
            .ToListAsync();

        return Ok(subscriptions);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<WebhookSubscriptionResponseDto>> Get(Guid id)
    {
        var subscription = await _context.WebhookSubscriptions
            .Include(w => w.Tenant)
            .Include(w => w.Project)
            .Include(w => w.CreatedByUser)
            .FirstOrDefaultAsync(w => w.Id == id);

        if (subscription is null)
        {
            return NotFound();
        }

        return Ok(new WebhookSubscriptionResponseDto
        {
            Id = subscription.Id,
            TenantId = subscription.TenantId,
            TenantName = subscription.Tenant?.Name ?? string.Empty,
            ProjectId = subscription.ProjectId,
            ProjectName = subscription.Project?.Name,
            Url = subscription.Url,
            Events = subscription.Events,
            IsActive = subscription.IsActive,
            CreatedAt = subscription.CreatedAt,
            CreatedByUserId = subscription.CreatedByUserId,
            CreatedByUserFullName = subscription.CreatedByUser?.FullName,
            PendingDeliveries = _context.WebhookDeliveries.Count(d => d.SubscriptionId == subscription.Id && d.Status == WebhookDeliveryStatus.Pending),
            FailedDeliveries = _context.WebhookDeliveries.Count(d => d.SubscriptionId == subscription.Id && d.Status == WebhookDeliveryStatus.Failed)
        });
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Member")]
    public async Task<ActionResult<WebhookSubscriptionResponseDto>> Create(CreateWebhookSubscriptionDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var tenant = await _context.Tenants.FindAsync(dto.TenantId);
        if (tenant is null)
        {
            return BadRequest(new { message = "Tenant not found." });
        }

        if (dto.ProjectId.HasValue)
        {
            var project = await _context.Projects.FindAsync(dto.ProjectId.Value);
            if (project is null)
            {
                return BadRequest(new { message = "Project not found." });
            }
        }

        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var subscription = new WebhookSubscription
        {
            TenantId = dto.TenantId,
            ProjectId = dto.ProjectId,
            Url = dto.Url,
            Secret = dto.Secret,
            Events = dto.Events,
            CreatedByUserId = userId
        };

        _context.WebhookSubscriptions.Add(subscription);
        await _context.SaveChangesAsync();

        await _activity.LogAsync(ActivityAction.ProjectUpdated, $"Webhook subscription created for '{subscription.Url}'", userId);

        return CreatedAtAction(nameof(Get), new { id = subscription.Id }, new WebhookSubscriptionResponseDto
        {
            Id = subscription.Id,
            TenantId = subscription.TenantId,
            TenantName = tenant.Name,
            ProjectId = subscription.ProjectId,
            Url = subscription.Url,
            Events = subscription.Events,
            IsActive = subscription.IsActive,
            CreatedAt = subscription.CreatedAt,
            CreatedByUserId = subscription.CreatedByUserId
        });
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> Update(Guid id, UpdateWebhookSubscriptionDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var subscription = await _context.WebhookSubscriptions.FindAsync(id);
        if (subscription is null)
        {
            return NotFound();
        }

        if (dto.Url is not null) subscription.Url = dto.Url;
        if (dto.Secret is not null) subscription.Secret = dto.Secret;
        if (dto.Events is not null) subscription.Events = dto.Events;
        if (dto.IsActive.HasValue) subscription.IsActive = dto.IsActive.Value;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var subscription = await _context.WebhookSubscriptions.FindAsync(id);
        if (subscription is null)
        {
            return NotFound();
        }

        _context.WebhookSubscriptions.Remove(subscription);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id:guid}/deliveries")]
    public async Task<ActionResult<IEnumerable<WebhookDeliveryResponseDto>>> GetDeliveries(Guid id)
    {
        var subscription = await _context.WebhookSubscriptions.FindAsync(id);
        if (subscription is null)
        {
            return NotFound();
        }

        var deliveries = await _context.WebhookDeliveries
            .Where(d => d.SubscriptionId == id)
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => new WebhookDeliveryResponseDto
            {
                Id = d.Id,
                SubscriptionId = d.SubscriptionId,
                EventType = d.EventType,
                Status = d.Status,
                Attempts = d.Attempts,
                MaxAttempts = d.MaxAttempts,
                LastError = d.LastError,
                CreatedAt = d.CreatedAt,
                CompletedAt = d.CompletedAt
            })
            .ToListAsync();

        return Ok(deliveries);
    }

    private string? GetCurrentUserId() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
}
