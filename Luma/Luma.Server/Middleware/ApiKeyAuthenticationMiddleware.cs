using System.Security.Claims;
using System.Text;
using System.Threading.Channels;
using Luma.Server.Data;
using Luma.Server.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Luma.Server.Middleware;

public class ApiKeyAuthenticationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ApiKeyAuthenticationMiddleware> _logger;
    private const string ApiKeyHeader = "X-Api-Key";

    public ApiKeyAuthenticationMiddleware(RequestDelegate next, ILogger<ApiKeyAuthenticationMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, AppDbContext db)
    {
        if (context.Request.Path.StartsWithSegments("/api/api-keys") ||
            context.Request.Path.StartsWithSegments("/api/auth") ||
            context.Request.Path.StartsWithSegments("/api/sso") ||
            context.User.Identity is { IsAuthenticated: true })
        {
            await _next(context);
            return;
        }

        var apiKey = context.Request.Headers[ApiKeyHeader].FirstOrDefault();
        if (string.IsNullOrEmpty(apiKey))
        {
            await _next(context);
            return;
        }

        var prefix = apiKey.Length >= 8 ? apiKey[..8] : apiKey;
        var keyRecord = await db.ApiKeys
            .Include(k => k.Tenant)
            .FirstOrDefaultAsync(k => k.KeyPrefix == prefix && k.IsActive);

        if (keyRecord is null)
        {
            await _next(context);
            return;
        }

        if (keyRecord.ExpiresAt.HasValue && keyRecord.ExpiresAt.Value < DateTime.UtcNow)
        {
            _logger.LogWarning("API key {KeyId} expired", keyRecord.Id);
            await _next(context);
            return;
        }

        using var sha = System.Security.Cryptography.SHA256.Create();
        var hash = Convert.ToBase64String(sha.ComputeHash(Encoding.UTF8.GetBytes(apiKey)));
        if (hash != keyRecord.KeyHash)
        {
            await _next(context);
            return;
        }

        keyRecord.LastUsedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, keyRecord.CreatedByUserId),
            new Claim("ApiKeyId", keyRecord.Id.ToString()),
            new Claim("TenantId", keyRecord.TenantId.ToString()),
            new Claim("ApiKey", "true")
        };

        var identity = new ClaimsIdentity(claims, "ApiKey");
        var principal = new ClaimsPrincipal(identity);
        context.User = principal;

        await _next(context);
    }
}
