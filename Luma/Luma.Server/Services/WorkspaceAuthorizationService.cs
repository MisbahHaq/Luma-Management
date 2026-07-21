using Luma.Server.Data;
using Luma.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace Luma.Server.Services;

public class WorkspaceAuthorizationService
{
    private readonly AppDbContext _context;

    public WorkspaceAuthorizationService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<WorkspaceRole?> GetWorkspaceRoleAsync(Guid workspaceId, string? userId)
    {
        if (string.IsNullOrEmpty(userId))
        {
            return null;
        }

        var member = await _context.WorkspaceMembers
            .FirstOrDefaultAsync(m => m.WorkspaceId == workspaceId && m.UserId == userId);

        return member?.Role;
    }

    public async Task<bool> CanManageMembersAsync(Guid workspaceId, string? userId, string? globalRole)
    {
        if (string.Equals(globalRole, nameof(UserRole.Admin), StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (string.IsNullOrEmpty(userId))
        {
            return false;
        }

        var role = await GetWorkspaceRoleAsync(workspaceId, userId);
        return role == WorkspaceRole.Owner || role == WorkspaceRole.Admin;
    }

    public async Task<bool> CanCreateProjectAsync(Guid workspaceId, string? userId, string? globalRole)
    {
        if (string.Equals(globalRole, nameof(UserRole.Admin), StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (string.IsNullOrEmpty(userId))
        {
            return false;
        }

        var role = await GetWorkspaceRoleAsync(workspaceId, userId);
        return role is WorkspaceRole.Owner or WorkspaceRole.Admin or WorkspaceRole.Member;
    }

    public async Task<bool> CanUpdateWorkspaceAsync(Guid workspaceId, string? userId, string? globalRole)
    {
        if (string.Equals(globalRole, nameof(UserRole.Admin), StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (string.IsNullOrEmpty(userId))
        {
            return false;
        }

        var role = await GetWorkspaceRoleAsync(workspaceId, userId);
        return role == WorkspaceRole.Owner || role == WorkspaceRole.Admin;
    }
}
