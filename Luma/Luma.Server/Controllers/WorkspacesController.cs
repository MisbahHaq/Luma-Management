using Luma.Server.Data;
using Luma.Server.DTOs.Workspaces;
using Luma.Server.Models;
using Luma.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Luma.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WorkspacesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ActivityService _activity;
    private readonly NotificationService _notifications;
    private readonly WorkspaceAuthorizationService _authz;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public WorkspacesController(
        AppDbContext context,
        ActivityService activity,
        NotificationService notifications,
        WorkspaceAuthorizationService authz,
        IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _activity = activity;
        _notifications = notifications;
        _authz = authz;
        _httpContextAccessor = httpContextAccessor;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<WorkspaceResponseDto>>> GetAll()
    {
        var userId = GetCurrentUserId();
        var globalRole = GetCurrentUserRole();

        IQueryable<Workspace> query = _context.Workspaces
            .Include(w => w.CreatedByUser)
            .Include(w => w.Members)
            .Include(w => w.Projects)
            .OrderByDescending(w => w.CreatedAt);

        if (!string.Equals(globalRole, nameof(UserRole.Admin), StringComparison.OrdinalIgnoreCase) && !string.IsNullOrEmpty(userId))
        {
            var memberWorkspaceIds = await _context.WorkspaceMembers
                .Where(m => m.UserId == userId)
                .Select(m => m.WorkspaceId)
                .ToListAsync();

            query = query.Where(w => memberWorkspaceIds.Contains(w.Id));
        }

        var workspaces = await query.ToListAsync();

        return Ok(workspaces.Select(ToDto));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<WorkspaceResponseDto>> Get(Guid id)
    {
        var workspace = await _context.Workspaces
            .Include(w => w.CreatedByUser)
            .Include(w => w.Members)
            .Include(w => w.Projects)
            .FirstOrDefaultAsync(w => w.Id == id);

        if (workspace is null)
        {
            return NotFound();
        }

        return Ok(ToDto(workspace));
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Member")]
    public async Task<ActionResult<WorkspaceResponseDto>> Create(CreateWorkspaceDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var user = await _context.Users.FindAsync(userId);
        if (user is null)
        {
            return Unauthorized();
        }

        var globalRole = GetCurrentUserRole();
        Guid tenantId;

        if (string.Equals(globalRole, nameof(UserRole.Admin), StringComparison.OrdinalIgnoreCase))
        {
            tenantId = await _context.Workspaces
                .Select(w => w.TenantId)
                .FirstOrDefaultAsync();
            if (tenantId == Guid.Empty)
            {
                tenantId = Guid.NewGuid();
                _context.Tenants.Add(new Tenant
                {
                    Id = tenantId,
                    Name = "Default",
                    Slug = "default",
                    CreatedByUserId = userId
                });
            }
        }
        else
        {
        var projectWithTenant = await _context.ProjectMembers
            .Where(m => m.UserId == userId && m.Project != null && m.Project.TenantId.HasValue)
            .Select(m => m.Project!.TenantId!.Value)
            .FirstOrDefaultAsync();

            if (projectWithTenant == Guid.Empty)
            {
                return BadRequest(new { message = "No tenant associated with your account. Contact an administrator." });
            }

            tenantId = projectWithTenant;
        }

        var slug = (dto.Slug ?? SanitizeSlug(dto.Name)).ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(slug) || slug.Length < 2)
        {
            return BadRequest(new { message = "Slug must be at least 2 characters." });
        }

        var slugExists = await _context.Workspaces.AnyAsync(w => w.TenantId == tenantId && w.Slug == slug);
        if (slugExists)
        {
            return BadRequest(new { message = "A workspace with this slug already exists in your tenant." });
        }

        var workspace = new Workspace
        {
            TenantId = tenantId,
            Name = dto.Name,
            Slug = slug,
            CreatedByUserId = userId
        };

        _context.Workspaces.Add(workspace);
        _context.WorkspaceMembers.Add(new WorkspaceMember
        {
            Workspace = workspace,
            UserId = userId,
            Role = WorkspaceRole.Owner
        });

        await _context.SaveChangesAsync();

        if (userId is not null)
        {
            await _activity.LogAsync(ActivityAction.ProjectCreated, $"Workspace '{workspace.Name}' was created", userId, null);
        }

        return CreatedAtAction(nameof(Get), new { id = workspace.Id }, ToDto(workspace));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> Update(Guid id, UpdateWorkspaceDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = GetCurrentUserId();
        var globalRole = GetCurrentUserRole();

        if (!await _authz.CanUpdateWorkspaceAsync(id, userId, globalRole))
        {
            return StatusCode(403, new { message = "You do not have permission to edit this workspace." });
        }

        var workspace = await _context.Workspaces.FindAsync(id);
        if (workspace is null)
        {
            return NotFound();
        }

        if (!string.IsNullOrWhiteSpace(dto.Name))
        {
            workspace.Name = dto.Name;
        }

        await _context.SaveChangesAsync();

        if (userId is not null)
        {
            await _activity.LogAsync(ActivityAction.ProjectUpdated, $"Workspace '{workspace.Name}' was updated", userId, null);
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = GetCurrentUserId();
        var globalRole = GetCurrentUserRole();

        if (!await _authz.CanUpdateWorkspaceAsync(id, userId, globalRole))
        {
            return StatusCode(403, new { message = "You do not have permission to delete this workspace." });
        }

        var workspace = await _context.Workspaces
            .Include(w => w.Projects)
            .FirstOrDefaultAsync(w => w.Id == id);

        if (workspace is null)
        {
            return NotFound();
        }

        foreach (var project in workspace.Projects.ToList())
        {
            _context.Projects.Remove(project);
        }

        _context.Workspaces.Remove(workspace);
        await _context.SaveChangesAsync();

        if (userId is not null)
        {
            await _activity.LogAsync(ActivityAction.ProjectDeleted, $"Workspace '{workspace.Name}' was deleted", userId, null);
        }

        return NoContent();
    }

    [HttpGet("{id}/members")]
    public async Task<ActionResult<IEnumerable<WorkspaceMemberSummaryDto>>> GetMembers(Guid id)
    {
        var workspace = await _context.Workspaces.FindAsync(id);
        if (workspace is null)
        {
            return NotFound();
        }

        var members = await _context.WorkspaceMembers
            .Where(m => m.WorkspaceId == id)
            .Include(m => m.User)
            .OrderBy(m => m.User!.FullName)
            .Select(m => new WorkspaceMemberSummaryDto
            {
                UserId = m.User!.Id,
                FullName = m.User.FullName,
                Email = m.User.Email,
                Role = m.Role,
                AddedAt = m.AddedAt
            })
            .ToListAsync();

        return Ok(members);
    }

    [HttpPost("{id}/members")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> AddMember(Guid id, AddWorkspaceMemberDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.UserId))
        {
            return BadRequest(new { message = "UserId is required." });
        }

        var userId = GetCurrentUserId();
        var globalRole = GetCurrentUserRole();

        if (!await _authz.CanManageMembersAsync(id, userId, globalRole))
        {
            return StatusCode(403, new { message = "You do not have permission to manage members of this workspace." });
        }

        var workspace = await _context.Workspaces.FindAsync(id);
        if (workspace is null)
        {
            return NotFound();
        }

        var user = await _context.Users.FindAsync(dto.UserId);
        if (user is null)
        {
            return BadRequest(new { message = "Invalid user." });
        }

        var exists = await _context.WorkspaceMembers.AnyAsync(m => m.WorkspaceId == id && m.UserId == dto.UserId);
        if (exists)
        {
            return BadRequest(new { message = "User is already a member of this workspace." });
        }

        var actorId = GetCurrentUserId();
        _context.WorkspaceMembers.Add(new WorkspaceMember { WorkspaceId = id, UserId = dto.UserId, Role = dto.Role });
        await _context.SaveChangesAsync();

        if (actorId is not null)
        {
            await _activity.LogAsync(ActivityAction.MemberAdded, $"{user.FullName} was added to workspace '{workspace.Name}'", actorId, null);
            await _notifications.NotifyAsync(
                NotificationType.MemberAdded,
                $"You were added to workspace '{workspace.Name}'",
                dto.UserId,
                null,
                link: $"/projects");
        }

        return NoContent();
    }

    [HttpDelete("{id}/members/{userId}")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> RemoveMember(Guid id, string userId)
    {
        var callerId = GetCurrentUserId();
        var globalRole = GetCurrentUserRole();

        if (!await _authz.CanManageMembersAsync(id, callerId, globalRole))
        {
            return StatusCode(403, new { message = "You do not have permission to manage members of this workspace." });
        }

        var member = await _context.WorkspaceMembers
            .FirstOrDefaultAsync(m => m.WorkspaceId == id && m.UserId == userId);
        if (member is null)
        {
            return NotFound();
        }

        if (member.Role == WorkspaceRole.Owner)
        {
            var ownerCount = await _context.WorkspaceMembers.CountAsync(m => m.WorkspaceId == id && m.Role == WorkspaceRole.Owner);
            if (ownerCount <= 1)
            {
                return BadRequest(new { message = "Cannot remove the last owner of the workspace." });
            }
        }

        _context.WorkspaceMembers.Remove(member);
        await _context.SaveChangesAsync();

        if (callerId is not null)
        {
            await _activity.LogAsync(ActivityAction.MemberRemoved, $"{userId} was removed from workspace", callerId, null);
        }

        return NoContent();
    }

    [HttpPut("{id}/members/{userId}/role")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> ChangeMemberRole(Guid id, string userId, AddWorkspaceMemberDto dto)
    {
        var callerId = GetCurrentUserId();
        var globalRole = GetCurrentUserRole();

        if (!await _authz.CanManageMembersAsync(id, callerId, globalRole))
        {
            return StatusCode(403, new { message = "You do not have permission to manage members of this workspace." });
        }

        var member = await _context.WorkspaceMembers
            .FirstOrDefaultAsync(m => m.WorkspaceId == id && m.UserId == userId);
        if (member is null)
        {
            return NotFound();
        }

        if (member.Role == WorkspaceRole.Owner && dto.Role != WorkspaceRole.Owner)
        {
            var ownerCount = await _context.WorkspaceMembers.CountAsync(m => m.WorkspaceId == id && m.Role == WorkspaceRole.Owner);
            if (ownerCount <= 1)
            {
                return BadRequest(new { message = "Cannot change the role of the last owner." });
            }
        }

        member.Role = dto.Role;
        await _context.SaveChangesAsync();

        if (callerId is not null)
        {
            await _activity.LogAsync(ActivityAction.MemberAdded, $"{userId} role changed to {dto.Role}", callerId, null);
        }

        return NoContent();
    }

    private static WorkspaceResponseDto ToDto(Workspace w) => new()
    {
        Id = w.Id,
        Name = w.Name,
        Slug = w.Slug,
        TenantId = w.TenantId,
        CreatedAt = w.CreatedAt,
        CreatedByUserId = w.CreatedByUserId,
        CreatedByUserFullName = w.CreatedByUser?.FullName,
        MemberCount = w.Members?.Count ?? 0,
        ProjectCount = w.Projects?.Count ?? 0
    };

    private static string SanitizeSlug(string name)
    {
        var slug = new string(name.Select(c => char.IsLetterOrDigit(c) ? c : '-').ToArray());
        while (slug.Contains("--"))
        {
            slug = slug.Replace("--", "-");
        }
        return slug.Trim('-');
    }

    private string? GetCurrentUserId() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

    private string? GetCurrentUserRole() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
}
