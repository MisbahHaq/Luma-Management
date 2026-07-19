using Luma.Server.Data;
using Luma.Server.DTOs.Sprints;
using Luma.Server.Models;
using Luma.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Luma.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SprintsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ActivityService _activity;
    private readonly NotificationService _notifications;

    public SprintsController(
        AppDbContext context,
        ActivityService activity,
        NotificationService notifications)
    {
        _context = context;
        _activity = activity;
        _notifications = notifications;
    }

    [HttpGet("project/{projectId}")]
    public async Task<ActionResult<IEnumerable<SprintResponseDto>>> GetByProject(Guid projectId)
    {
        var sprints = await _context.Sprints
            .Where(s => s.ProjectId == projectId)
            .Include(s => s.CreatedByUser)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => ToDto(s))
            .ToListAsync();

        return Ok(sprints);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SprintResponseDto>> Get(Guid id)
    {
        var sprint = await _context.Sprints
            .Include(s => s.CreatedByUser)
            .FirstOrDefaultAsync(s => s.Id == id);
        if (sprint is null)
        {
            return NotFound();
        }

        return Ok(ToDto(sprint));
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Member")]
    public async Task<ActionResult<SprintResponseDto>> Create(CreateSprintDto dto)
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

        var project = await _context.Projects.FindAsync(dto.ProjectId);
        if (project is null)
        {
            return BadRequest(new { message = "Invalid project." });
        }

        var sprint = new Sprint
        {
            Name = dto.Name,
            Description = dto.Description,
            Status = dto.Status,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            ProjectId = dto.ProjectId,
            CreatedByUserId = userId
        };

        _context.Sprints.Add(sprint);
        await _context.SaveChangesAsync();

        await _activity.LogAsync(ActivityAction.SprintCreated, $"Sprint '{sprint.Name}' was created", userId, project.Id);
        await _notifications.NotifyProjectAsync(
            NotificationType.SprintCreated,
            $"New sprint '{sprint.Name}' in '{project.Name}'",
            project.Id,
            excludeUserId: Guid.Parse(userId),
            link: $"/projects/{project.Id}");

        var created = await _context.Sprints
            .Include(s => s.CreatedByUser)
            .FirstAsync(s => s.Id == sprint.Id);

        return CreatedAtAction(nameof(Get), new { id = sprint.Id }, ToDto(created));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> Update(Guid id, UpdateSprintDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = GetCurrentUserId();
        var sprint = await _context.Sprints.FindAsync(id);
        if (sprint is null)
        {
            return NotFound();
        }

        var wasCompleted = sprint.Status == SprintStatus.Completed;
        sprint.Name = dto.Name;
        sprint.Description = dto.Description;
        sprint.Status = dto.Status;
        sprint.StartDate = dto.StartDate;
        sprint.EndDate = dto.EndDate;

        await _context.SaveChangesAsync();

        if (userId is not null)
        {
            await _activity.LogAsync(ActivityAction.SprintUpdated, $"Sprint '{sprint.Name}' was updated", userId, sprint.ProjectId, taskId: null);
            if (sprint.Status == SprintStatus.Completed && !wasCompleted)
            {
                await _activity.LogAsync(ActivityAction.SprintCompleted, $"Sprint '{sprint.Name}' was completed", userId, sprint.ProjectId);
            }
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var sprint = await _context.Sprints.FindAsync(id);
        if (sprint is null)
        {
            return NotFound();
        }

        _context.Sprints.Remove(sprint);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("{id}/tasks/{taskId}")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> AddTask(Guid id, Guid taskId)
    {
        var sprint = await _context.Sprints.FindAsync(id);
        if (sprint is null)
        {
            return NotFound(new { message = "Invalid sprint." });
        }

        var task = await _context.Tasks.FindAsync(taskId);
        if (task is null || task.ProjectId != sprint.ProjectId)
        {
            return BadRequest(new { message = "Invalid task." });
        }

        task.SprintId = id;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}/tasks/{taskId}")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> RemoveTask(Guid id, Guid taskId)
    {
        var task = await _context.Tasks
            .FirstOrDefaultAsync(t => t.Id == taskId && t.SprintId == id);
        if (task is null)
        {
            return NotFound();
        }

        task.SprintId = null;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private static SprintResponseDto ToDto(Sprint s) => new()
    {
        Id = s.Id,
        Name = s.Name,
        Description = s.Description,
        Status = s.Status,
        StartDate = s.StartDate,
        EndDate = s.EndDate,
        ProjectId = s.ProjectId,
        CreatedByUserId = s.CreatedByUserId,
        CreatedByUserFullName = s.CreatedByUser?.FullName,
        CreatedAt = s.CreatedAt
    };

    private string? GetCurrentUserId() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
}
