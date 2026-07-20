using Luma.Server.Data;
using Luma.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace Luma.Server.Services;

/// <summary>
/// Resolves per-project authorization. A caller may write to a project when they
/// are a project Owner/Editor for that ProjectId, or when they hold the global
/// Admin role (platform-level override). Global Viewers are never writers.
/// </summary>
public class ProjectAuthorizationService
{
    private readonly AppDbContext _context;

    public ProjectAuthorizationService(AppDbContext context)
    {
        _context = context;
    }

    public bool IsGlobalAdmin(string? globalRole) =>
        string.Equals(globalRole, nameof(UserRole.Admin), StringComparison.OrdinalIgnoreCase);

    public async Task<bool> CanWriteProjectAsync(Guid projectId, string? userId, string? globalRole)
    {
        if (IsGlobalAdmin(globalRole))
        {
            return true;
        }

        if (string.IsNullOrEmpty(userId))
        {
            return false;
        }

        return await _context.ProjectMembers.AnyAsync(m =>
            m.ProjectId == projectId &&
            m.UserId == userId &&
            (m.Role == ProjectRole.Owner || m.Role == ProjectRole.Editor));
    }

    public async Task<ProjectRole?> GetProjectRoleAsync(Guid projectId, string? userId)
    {
        if (string.IsNullOrEmpty(userId))
        {
            return null;
        }

        var member = await _context.ProjectMembers
            .FirstOrDefaultAsync(m => m.ProjectId == projectId && m.UserId == userId);

        return member?.Role;
    }
}
