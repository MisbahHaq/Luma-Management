using Microsoft.AspNetCore.Http;

namespace Luma.Server.Services;

/// <summary>
/// Resolves the current tenant for the request. The <see cref="TenantResolutionMiddleware"/>
/// stores the resolved tenant id in HttpContext.Items; this scoped service surfaces it to
/// EF Core global query filters. When no tenant is resolved (no X-Tenant-Id header / query
/// param), CurrentTenantId is null and tenant-scoped filters degrade to "no restriction"
/// (except Project, which still shows null-tenant rows).
/// </summary>
public class TenantContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public TenantContext(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? CurrentTenantId
    {
        get
        {
            var items = _httpContextAccessor.HttpContext?.Items;
            if (items is not null && items.TryGetValue("TenantId", out var value) && value is Guid guid)
            {
                return guid;
            }
            return null;
        }
    }

    /// <summary>True when a specific tenant is active for this request.</summary>
    public bool HasTenant => CurrentTenantId is not null;
}
