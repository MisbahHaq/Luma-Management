using Luma.Server.Data;
using Luma.Server.DTOs.Projects;
using Luma.Server.DTOs.Users;
using Luma.Server.Models;
using Luma.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Luma.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ActivityService _activity;
    private readonly NotificationService _notifications;
    private readonly ProjectAuthorizationService _authz;

    public ProjectsController(
        AppDbContext context,
        ActivityService activity,
        NotificationService notifications,
        ProjectAuthorizationService authz)
    {
        _context = context;
        _activity = activity;
        _notifications = notifications;
        _authz = authz;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProjectResponseDto>>> GetAll()
    {
        var projects = await _context.Projects
            .Include(p => p.CreatedByUser)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new ProjectResponseDto
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                CreatedAt = p.CreatedAt,
                CreatedByUserId = p.CreatedByUserId,
                CreatedByUserFullName = p.CreatedByUser != null ? p.CreatedByUser.FullName : null
            })
            .ToListAsync();

        return Ok(projects);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProjectResponseDto>> Get(Guid id)
    {
        var project = await _context.Projects
            .Include(p => p.CreatedByUser)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project is null)
        {
            return NotFound();
        }

        return Ok(ToDto(project));
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Member")]
    public async Task<ActionResult<ProjectResponseDto>> Create(CreateProjectDto dto)
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

        var project = new Project
        {
            Name = dto.Name,
            Description = dto.Description,
            CreatedByUserId = userId
        };

        _context.Projects.Add(project);
        _context.ProjectMembers.Add(new ProjectMember { Project = project, UserId = userId, Role = ProjectRole.Owner });
        await _context.SaveChangesAsync();

        await _activity.LogAsync(ActivityAction.ProjectCreated, $"Project '{project.Name}' was created", userId, project.Id);

        var created = await _context.Projects
            .Include(p => p.CreatedByUser)
            .FirstAsync(p => p.Id == project.Id);

        return CreatedAtAction(nameof(Get), new { id = project.Id }, ToDto(created));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> Update(Guid id, UpdateProjectDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = GetCurrentUserId();
        var globalRole = GetCurrentUserRole();
        var project = await _context.Projects.FindAsync(id);
        if (project is null)
        {
            return NotFound();
        }

        if (!await _authz.CanWriteProjectAsync(id, userId, globalRole))
        {
            return StatusCode(403, new { message = "You do not have permission to edit this project." });
        }

        project.Name = dto.Name;
        project.Description = dto.Description;

        await _context.SaveChangesAsync();
        if (userId is not null)
        {
            await _activity.LogAsync(ActivityAction.ProjectUpdated, $"Project '{project.Name}' was updated", userId, project.Id);
        }
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var project = await _context.Projects.FindAsync(id);
        if (project is null)
        {
            return NotFound();
        }

        _context.Projects.Remove(project);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id}/members")]
    public async Task<ActionResult<IEnumerable<ProjectMemberSummaryDto>>> GetMembers(Guid id)
    {
        var members = await _context.ProjectMembers
            .Where(m => m.ProjectId == id)
            .Include(m => m.User)
            .OrderBy(m => m.User!.FullName)
            .Select(m => new ProjectMemberSummaryDto
            {
                Id = m.User!.Id,
                FullName = m.User.FullName,
                Email = m.User.Email,
                GlobalRole = m.User.Role,
                ProjectRole = m.Role
            })
            .ToListAsync();

        return Ok(members);
    }

    [HttpPost("{id}/members")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> AddMember(Guid id, AddMemberDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.UserId))
        {
            return BadRequest(new { message = "UserId is required." });
        }

        var userId = GetCurrentUserId();
        var globalRole = GetCurrentUserRole();
        var project = await _context.Projects.FindAsync(id);
        if (project is null)
        {
            return NotFound();
        }

        if (!await _authz.CanWriteProjectAsync(id, userId, globalRole))
        {
            return StatusCode(403, new { message = "You do not have permission to manage members of this project." });
        }

        var user = await _context.Users.FindAsync(dto.UserId);
        if (user is null)
        {
            return BadRequest(new { message = "Invalid user." });
        }

        var exists = await _context.ProjectMembers
            .AnyAsync(m => m.ProjectId == id && m.UserId == dto.UserId);
        if (exists)
        {
            return BadRequest(new { message = "User is already a member." });
        }

        var actorId = GetCurrentUserId();
        _context.ProjectMembers.Add(new ProjectMember { ProjectId = id, UserId = dto.UserId, Role = dto.Role });
        await _context.SaveChangesAsync();

        if (actorId is not null)
        {
            await _activity.LogAsync(ActivityAction.MemberAdded, $"{user.FullName} was added to '{project.Name}'", actorId, project.Id);
            await _notifications.NotifyAsync(
                NotificationType.MemberAdded,
                $"You were added to project '{project.Name}'",
                dto.UserId,
                project.Id,
                link: $"/projects/{project.Id}");
        }

        return NoContent();
    }

    [HttpDelete("{id}/members/{userId}")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> RemoveMember(Guid id, string userId)
    {
        var callerId = GetCurrentUserId();
        var globalRole = GetCurrentUserRole();
        var member = await _context.ProjectMembers
            .FirstOrDefaultAsync(m => m.ProjectId == id && m.UserId == userId);
        if (member is null)
        {
            return NotFound();
        }

        if (!await _authz.CanWriteProjectAsync(id, callerId, globalRole))
        {
            return StatusCode(403, new { message = "You do not have permission to manage members of this project." });
        }

        // Prevent orphaning a project: the last Owner cannot be removed.
        if (member.Role == ProjectRole.Owner)
        {
            var ownerCount = await _context.ProjectMembers
                .CountAsync(m => m.ProjectId == id && m.Role == ProjectRole.Owner);
            if (ownerCount <= 1)
            {
                return BadRequest(new { message = "Cannot remove the last owner of the project." });
            }
        }

        _context.ProjectMembers.Remove(member);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("{id}/members/{userId}/role")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> ChangeMemberRole(Guid id, string userId, ChangeMemberRoleDto dto)
    {
        var callerId = GetCurrentUserId();
        var globalRole = GetCurrentUserRole();
        var member = await _context.ProjectMembers
            .FirstOrDefaultAsync(m => m.ProjectId == id && m.UserId == userId);
        if (member is null)
        {
            return NotFound();
        }

        // Only a project Owner (or global Admin) may change member roles.
        var callerProjectRole = await _authz.GetProjectRoleAsync(id, callerId);
        var isOwner = callerProjectRole == ProjectRole.Owner || _authz.IsGlobalAdmin(globalRole);
        if (!isOwner)
        {
            return StatusCode(403, new { message = "Only a project owner can change member roles." });
        }

        // A role change targeting the last Owner is not allowed (prevents orphaning).
        if (member.Role == ProjectRole.Owner && dto.Role != ProjectRole.Owner)
        {
            var ownerCount = await _context.ProjectMembers
                .CountAsync(m => m.ProjectId == id && m.Role == ProjectRole.Owner);
            if (ownerCount <= 1)
            {
                return BadRequest(new { message = "Cannot change the role of the last owner." });
            }
        }

        member.Role = dto.Role;
        await _context.SaveChangesAsync();

        if (callerId is not null)
        {
            await _activity.LogAsync(ActivityAction.MemberAdded, $"{member.UserId} role changed to {dto.Role}", callerId, id);
        }

        return NoContent();
    }

    [HttpGet("{id}/custom-fields")]
    public async Task<ActionResult<IEnumerable<Luma.Server.DTOs.CustomFields.ProjectCustomFieldResponseDto>>> GetCustomFields(Guid id)
    {
        var project = await _context.Projects.FindAsync(id);
        if (project is null)
        {
            return NotFound();
        }

        var fields = await _context.ProjectCustomFields
            .Where(f => f.ProjectId == id)
            .OrderBy(f => f.SortOrder)
            .Select(f => new Luma.Server.DTOs.CustomFields.ProjectCustomFieldResponseDto
            {
                Id = f.Id,
                ProjectId = f.ProjectId,
                Name = f.Name,
                FieldType = f.FieldType,
                IsRequired = f.IsRequired,
                Options = f.Options,
                SortOrder = f.SortOrder,
                IsActive = f.IsActive,
                CreatedAt = f.CreatedAt,
                UpdatedAt = f.UpdatedAt
            })
            .ToListAsync();

        return Ok(fields);
    }

    [HttpPost("{id}/public-access")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> EnablePublicAccess(Guid id)
    {
        var userId = GetCurrentUserId();
        var globalRole = GetCurrentUserRole();
        var project = await _context.Projects.FindAsync(id);
        if (project is null)
        {
            return NotFound();
        }

        if (!await _authz.CanWriteProjectAsync(id, userId, globalRole))
        {
            return StatusCode(403, new { message = "You do not have permission to manage this project." });
        }

        if (string.IsNullOrEmpty(project.PublicAccessToken))
        {
            project.PublicAccessToken = Guid.NewGuid().ToString("N");
            await _context.SaveChangesAsync();
        }

        if (userId is not null)
        {
            await _activity.LogAsync(ActivityAction.ProjectUpdated, $"Public access enabled for '{project.Name}'", userId, project.Id);
        }

        return Ok(new { token = project.PublicAccessToken });
    }

    [HttpDelete("{id}/public-access")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> DisablePublicAccess(Guid id)
    {
        var userId = GetCurrentUserId();
        var globalRole = GetCurrentUserRole();
        var project = await _context.Projects.FindAsync(id);
        if (project is null)
        {
            return NotFound();
        }

        if (!await _authz.CanWriteProjectAsync(id, userId, globalRole))
        {
            return StatusCode(403, new { message = "You do not have permission to manage this project." });
        }

        project.PublicAccessToken = null;
        await _context.SaveChangesAsync();

        if (userId is not null)
        {
            await _activity.LogAsync(ActivityAction.ProjectUpdated, $"Public access disabled for '{project.Name}'", userId, project.Id);
        }

        return NoContent();
    }

    [HttpPost("{id}/public-access/regenerate")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> RegeneratePublicToken(Guid id)
    {
        var userId = GetCurrentUserId();
        var globalRole = GetCurrentUserRole();
        var project = await _context.Projects.FindAsync(id);
        if (project is null)
        {
            return NotFound();
        }

        if (!await _authz.CanWriteProjectAsync(id, userId, globalRole))
        {
            return StatusCode(403, new { message = "You do not have permission to manage this project." });
        }

        project.PublicAccessToken = Guid.NewGuid().ToString("N");
        await _context.SaveChangesAsync();

        if (userId is not null)
        {
            await _activity.LogAsync(ActivityAction.ProjectUpdated, $"Public access token regenerated for '{project.Name}'", userId, project.Id);
        }

        return Ok(new { token = project.PublicAccessToken });
    }

    private static ProjectResponseDto ToDto(Project p) => new()
    {
        Id = p.Id,
        Name = p.Name,
        Description = p.Description,
        CreatedAt = p.CreatedAt,
        CreatedByUserId = p.CreatedByUserId,
        CreatedByUserFullName = p.CreatedByUser?.FullName
    };

    private string? GetCurrentUserId() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

    private string? GetCurrentUserRole() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
}
