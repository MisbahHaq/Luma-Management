using Luma.Server.Data;
using Luma.Server.DTOs.Milestones;
using Luma.Server.Models;
using Luma.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Luma.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MilestonesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ActivityService _activity;
    private readonly ProjectAuthorizationService _authz;

    public MilestonesController(AppDbContext context, ActivityService activity, ProjectAuthorizationService authz)
    {
        _context = context;
        _activity = activity;
        _authz = authz;
    }

    [HttpGet("project/{projectId}")]
    public async Task<ActionResult<IEnumerable<MilestoneResponseDto>>> GetByProject(Guid projectId)
    {
        var project = await _context.Projects.FindAsync(projectId);
        if (project is null)
        {
            return NotFound();
        }

        var milestones = await _context.Milestones
            .Where(m => m.ProjectId == projectId)
            .Include(m => m.Tasks)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync();

        return Ok(milestones.Select(ToDto));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MilestoneResponseDto>> Get(Guid id)
    {
        var milestone = await _context.Milestones
            .Include(m => m.Tasks)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (milestone is null)
        {
            return NotFound();
        }

        return Ok(ToDto(milestone));
    }

    [HttpPost("project/{projectId}")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<ActionResult<MilestoneResponseDto>> Create(Guid projectId, CreateMilestoneDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = GetCurrentUserId();
        var globalRole = GetCurrentUserRole();

        var project = await _context.Projects.FindAsync(projectId);
        if (project is null)
        {
            return NotFound();
        }

        if (!await _authz.CanWriteProjectAsync(projectId, userId, globalRole))
        {
            return StatusCode(403, new { message = "You do not have permission to add milestones to this project." });
        }

        var milestone = new Milestone
        {
            ProjectId = projectId,
            Name = dto.Name,
            Description = dto.Description,
            DueDate = dto.DueDate,
            Status = MilestoneStatus.Open
        };

        _context.Milestones.Add(milestone);
        await _context.SaveChangesAsync();

        if (userId is not null)
        {
            await _activity.LogAsync(ActivityAction.ProjectCreated, $"Milestone '{milestone.Name}' was created in '{project.Name}'", userId, projectId);
        }

        return CreatedAtAction(nameof(Get), new { id = milestone.Id }, ToDto(milestone));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> Update(Guid id, UpdateMilestoneDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = GetCurrentUserId();
        var globalRole = GetCurrentUserRole();

        var milestone = await _context.Milestones
            .Include(m => m.Tasks)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (milestone is null)
        {
            return NotFound();
        }

        if (!await _authz.CanWriteProjectAsync(milestone.ProjectId, userId, globalRole))
        {
            return StatusCode(403, new { message = "You do not have permission to edit this milestone." });
        }

        if (!string.IsNullOrWhiteSpace(dto.Name))
        {
            milestone.Name = dto.Name;
        }

        if (dto.Description is not null)
        {
            milestone.Description = dto.Description;
        }

        if (dto.DueDate is not null)
        {
            milestone.DueDate = dto.DueDate;
        }

        if (dto.Status.HasValue)
        {
            milestone.Status = dto.Status.Value;
        }

        await _context.SaveChangesAsync();

        if (userId is not null)
        {
            await _activity.LogAsync(ActivityAction.ProjectUpdated, $"Milestone '{milestone.Name}' was updated", userId, milestone.ProjectId);
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = GetCurrentUserId();
        var globalRole = GetCurrentUserRole();

        var milestone = await _context.Milestones.FindAsync(id);
        if (milestone is null)
        {
            return NotFound();
        }

        if (!await _authz.CanWriteProjectAsync(milestone.ProjectId, userId, globalRole))
        {
            return StatusCode(403, new { message = "You do not have permission to delete this milestone." });
        }

        _context.Tasks.Where(t => t.MilestoneId == id).ExecuteUpdate(s => s.SetProperty(t => t.MilestoneId, (Guid?)null));
        _context.Milestones.Remove(milestone);
        await _context.SaveChangesAsync();

        if (userId is not null)
        {
            await _activity.LogAsync(ActivityAction.ProjectDeleted, $"Milestone '{milestone.Name}' was deleted", userId, milestone.ProjectId);
        }

        return NoContent();
    }

    [HttpPut("{id}/tasks/{taskId}")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> AddTask(Guid id, Guid taskId)
    {
        var userId = GetCurrentUserId();
        var globalRole = GetCurrentUserRole();

        var milestone = await _context.Milestones.FindAsync(id);
        if (milestone is null)
        {
            return NotFound();
        }

        var task = await _context.Tasks.FindAsync(taskId);
        if (task is null)
        {
            return NotFound();
        }

        if (task.ProjectId != milestone.ProjectId)
        {
            return BadRequest(new { message = "Task does not belong to the same project as the milestone." });
        }

        if (!await _authz.CanWriteProjectAsync(milestone.ProjectId, userId, globalRole))
        {
            return StatusCode(403, new { message = "You do not have permission to modify this milestone." });
        }

        task.MilestoneId = milestone.Id;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}/tasks/{taskId}")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> RemoveTask(Guid id, Guid taskId)
    {
        var userId = GetCurrentUserId();
        var globalRole = GetCurrentUserRole();

        var milestone = await _context.Milestones.FindAsync(id);
        if (milestone is null)
        {
            return NotFound();
        }

        var task = await _context.Tasks.FindAsync(taskId);
        if (task is null)
        {
            return NotFound();
        }

        if (!await _authz.CanWriteProjectAsync(milestone.ProjectId, userId, globalRole))
        {
            return StatusCode(403, new { message = "You do not have permission to modify this milestone." });
        }

        task.MilestoneId = null;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private static MilestoneResponseDto ToDto(Milestone m) => new()
    {
        Id = m.Id,
        ProjectId = m.ProjectId,
        Name = m.Name,
        Description = m.Description,
        DueDate = m.DueDate,
        Status = m.Status.ToString(),
        CreatedAt = m.CreatedAt,
        TaskCount = m.Tasks?.Count ?? 0,
        CompletedTaskCount = m.Tasks?.Count(t => t.Status == Models.TaskStatus.Done) ?? 0,
        ProgressPercentage = m.Tasks != null && m.Tasks.Count > 0
            ? (int)Math.Round((double)m.Tasks.Count(t => t.Status == Models.TaskStatus.Done) / m.Tasks.Count * 100)
            : 0
    };

    private string? GetCurrentUserId() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

    private string? GetCurrentUserRole() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
}
