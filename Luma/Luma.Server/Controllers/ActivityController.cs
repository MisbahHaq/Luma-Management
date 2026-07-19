using Luma.Server.Data;
using Luma.Server.DTOs.Activity;
using Luma.Server.Models;
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
    public async Task<ActionResult<IEnumerable<ActivityLogResponseDto>>> GetByTask(Guid taskId)
    {
        var logs = await _context.ActivityLogs
            .Where(a => a.TaskId == taskId)
            .Include(a => a.Actor)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => ToDto(a))
            .ToListAsync();

        return Ok(logs);
    }

    [HttpGet("project/{projectId}")]
    public async Task<ActionResult<IEnumerable<ActivityLogResponseDto>>> GetByProject(Guid projectId)
    {
        var logs = await _context.ActivityLogs
            .Where(a => a.ProjectId == projectId)
            .Include(a => a.Actor)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => ToDto(a))
            .ToListAsync();

        return Ok(logs);
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
}
