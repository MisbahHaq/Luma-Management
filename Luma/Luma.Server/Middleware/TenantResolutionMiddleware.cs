using Luma.Server.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Luma.Server.Middleware;

public class TenantResolutionMiddleware
{
    private readonly RequestDelegate _next;
    private const string TenantHeader = "X-Tenant-Id";

    public TenantResolutionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, AppDbContext db)
    {
        if (context.Request.Path.StartsWithSegments("/api/public") ||
            context.Request.Path.StartsWithSegments("/api/auth") ||
            context.Request.Path.StartsWithSegments("/api/sso"))
        {
            await _next(context);
            return;
        }

        string? tenantIdStr = context.Request.Headers[TenantHeader].FirstOrDefault();
        if (string.IsNullOrEmpty(tenantIdStr))
        {
            tenantIdStr = context.Request.Query["tenantId"].ToString();
        }

        if (!string.IsNullOrEmpty(tenantIdStr) && Guid.TryParse(tenantIdStr, out var tenantId))
        {
            var tenant = await db.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId);
            if (tenant is not null)
            {
                context.Items["TenantId"] = tenant.Id;
                context.Items["Tenant"] = tenant;
            }
        }

        await _next(context);
    }
}
