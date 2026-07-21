using Luma.Server.Data;
using Luma.Server.DTOs.Activity;
using Luma.Server.Models;
using Luma.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Luma.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ActivityController : ControllerBase
{
    private readonly AppDbContext _context;

    public ActivityController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("task/{taskId}")]
    public async Task<ActionResult<Luma.Server.DTOs.Common.PagedResult<ActivityLogResponseDto>>> GetByTask(Guid taskId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var query = _context.ActivityLogs
            .Where(a => a.TaskId == taskId)
            .Include(a => a.Actor)
            .OrderByDescending(a => a.CreatedAt);

        var total = await query.CountAsync();

        var logs = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => ToDto(a))
            .ToListAsync();

        return Ok(new Luma.Server.DTOs.Common.PagedResult<ActivityLogResponseDto>
        {
            Items = logs,
            Total = total,
            Page = page,
            PageSize = pageSize
        });
    }

    [HttpGet("project/{projectId}")]
    public async Task<ActionResult<Luma.Server.DTOs.Common.PagedResult<ActivityLogResponseDto>>> GetByProject(Guid projectId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var query = _context.ActivityLogs
            .Where(a => a.ProjectId == projectId)
            .Include(a => a.Actor)
            .OrderByDescending(a => a.CreatedAt);

        var total = await query.CountAsync();

        var logs = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => ToDto(a))
            .ToListAsync();

        return Ok(new Luma.Server.DTOs.Common.PagedResult<ActivityLogResponseDto>
        {
            Items = logs,
            Total = total,
            Page = page,
            PageSize = pageSize
        });
    }

    [HttpGet("mine")]
    public async Task<ActionResult<IEnumerable<ActivityLogResponseDto>>> GetMine([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var globalRole = GetCurrentUserRole();
        var accessibleProjectIds = _authz.IsGlobalAdmin(globalRole)
            ? await _context.Projects.Select(p => p.Id).ToListAsync()
            : await _context.ProjectMembers
                .Where(m => m.UserId == userId)
                .Select(m => m.ProjectId)
                .ToListAsync();

        var logs = await _context.ActivityLogs
            .Where(a => accessibleProjectIds.Contains(a.ProjectId.Value))
            .Include(a => a.Actor)
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => ToDto(a))
            .ToListAsync();

        return Ok(logs);
    }

    private readonly ProjectAuthorizationService _authz;

    public ActivityController(AppDbContext context, ProjectAuthorizationService authz)
    {
        _context = context;
        _authz = authz;
    }

    private static ActivityLogResponseDto ToDto(ActivityLog a) => new()
    {
        Id = a.Id,
        Action = a.Action.ToString(),
        Description = a.Description,
        ProjectId = a.ProjectId,
        TaskId = a.TaskId,
        ActorId = a.ActorId,
        ActorFullName = a.Actor != null ? a.Actor.FullName : null,
        CreatedAt = a.CreatedAt
    };

    private string? GetCurrentUserId() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

    private string? GetCurrentUserRole() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
}
