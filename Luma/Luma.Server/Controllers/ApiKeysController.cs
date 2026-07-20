using System.Security.Cryptography;
using System.Text;
using Luma.Server.Data;
using Luma.Server.DTOs.ApiKeys;
using Luma.Server.Models;
using Luma.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Luma.Server.Controllers;

[ApiController]
[Route("api/api-keys")]
[Authorize]
public class ApiKeysController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ActivityService _activity;

    public ApiKeysController(AppDbContext context, ActivityService activity)
    {
        _context = context;
        _activity = activity;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ApiKeyResponseDto>>> GetAll([FromQuery] Guid? tenantId)
    {
        // CROSS-TENANT: Admin platform view. The explicit tenantId param is the
        // intentional scoping; bypass the global tenant query filter so an Admin
        // without an X-Tenant-Id header can still list keys for any tenant.
        var query = _context.ApiKeys
            .IgnoreQueryFilters()
            .Include(k => k.Tenant)
            .AsQueryable();

        if (tenantId.HasValue)
        {
            query = query.Where(k => k.TenantId == tenantId.Value);
        }

        var keys = await query
            .OrderByDescending(k => k.CreatedAt)
            .Select(k => new ApiKeyResponseDto
            {
                Id = k.Id,
                TenantId = k.TenantId,
                TenantName = k.Tenant != null ? k.Tenant.Name : string.Empty,
                Name = k.Name,
                KeyPrefix = k.KeyPrefix,
                Scopes = k.Scopes,
                ExpiresAt = k.ExpiresAt,
                CreatedAt = k.CreatedAt,
                LastUsedAt = k.LastUsedAt,
                IsActive = k.IsActive
            })
            .ToListAsync();

        return Ok(keys);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiKeyResponseDto>> Get(Guid id)
    {
        var key = await _context.ApiKeys
            .Include(k => k.Tenant)
            .FirstOrDefaultAsync(k => k.Id == id);

        if (key is null)
        {
            return NotFound();
        }

        return Ok(new ApiKeyResponseDto
        {
            Id = key.Id,
            TenantId = key.TenantId,
            TenantName = key.Tenant?.Name ?? string.Empty,
            Name = key.Name,
            KeyPrefix = key.KeyPrefix,
            Scopes = key.Scopes,
            ExpiresAt = key.ExpiresAt,
            CreatedAt = key.CreatedAt,
            LastUsedAt = key.LastUsedAt,
            IsActive = key.IsActive
        });
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Member")]
    public async Task<ActionResult<ApiKeyCreatedResponseDto>> Create(CreateApiKeyDto dto)
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

        var rawKey = GenerateSecureKey();
        var keyHash = HashKey(rawKey);
        var prefix = rawKey[..8];

        var apiKey = new ApiKey
        {
            TenantId = dto.TenantId,
            Name = dto.Name,
            KeyPrefix = prefix,
            KeyHash = keyHash,
            Scopes = dto.Scopes,
            ExpiresAt = dto.ExpiresAt
        };

        _context.ApiKeys.Add(apiKey);
        await _context.SaveChangesAsync();

        var userId = GetCurrentUserId();
        if (userId is not null)
        {
            await _activity.LogAsync(ActivityAction.ProjectCreated, $"API key '{apiKey.Name}' created for tenant '{tenant.Name}'", userId);
        }

        return CreatedAtAction(nameof(Get), new { id = apiKey.Id }, new ApiKeyCreatedResponseDto
        {
            Id = apiKey.Id,
            Key = rawKey,
            Name = apiKey.Name,
            ExpiresAt = apiKey.ExpiresAt
        });
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var key = await _context.ApiKeys.FindAsync(id);
        if (key is null)
        {
            return NotFound();
        }

        _context.ApiKeys.Remove(key);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private static string GenerateSecureKey()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes).Replace("+", "").Replace("/", "").Replace("=", "")[..32];
    }

    private static string HashKey(string key)
    {
        using var sha = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(key);
        var hash = sha.ComputeHash(bytes);
        return Convert.ToBase64String(hash);
    }

    private string? GetCurrentUserId() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
}
