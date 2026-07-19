using Luma.Server.Data;
using Luma.Server.DTOs.TaskDependencies;
using Luma.Server.Models;
using Luma.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Luma.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TaskDependenciesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ActivityService _activity;
    private readonly NotificationService _notifications;

    public TaskDependenciesController(
        AppDbContext context,
        ActivityService activity,
        NotificationService notifications)
    {
        _context = context;
        _activity = activity;
        _notifications = notifications;
    }

    [HttpGet("project/{projectId}")]
    public async Task<ActionResult<IEnumerable<TaskDependencyResponseDto>>> GetByProject(Guid projectId)
    {
        var deps = await _context.TaskDependencies
            .Where(d => d.ProjectId == projectId)
            .Include(d => d.Task)
            .Include(d => d.DependsOnTask)
            .OrderBy(d => d.TaskId)
            .Select(d => ToDto(d))
            .ToListAsync();

        return Ok(deps);
    }

    [HttpGet("task/{taskId}")]
    public async Task<ActionResult<IEnumerable<TaskDependencyResponseDto>>> GetByTask(Guid taskId)
    {
        var deps = await _context.TaskDependencies
            .Where(d => d.TaskId == taskId || d.DependsOnTaskId == taskId)
            .Include(d => d.Task)
            .Include(d => d.DependsOnTask)
            .Select(d => ToDto(d))
            .ToListAsync();

        return Ok(deps);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Member")]
    public async Task<ActionResult<TaskDependencyResponseDto>> Create(CreateTaskDependencyDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (dto.TaskId == dto.DependsOnTaskId)
        {
            return BadRequest(new { message = "A task cannot depend on itself." });
        }

        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var task = await _context.Tasks.FindAsync(dto.TaskId);
        var dependsOn = await _context.Tasks.FindAsync(dto.DependsOnTaskId);
        if (task is null || dependsOn is null)
        {
            return BadRequest(new { message = "Invalid task(s)." });
        }

        if (task.ProjectId != dependsOn.ProjectId)
        {
            return BadRequest(new { message = "Both tasks must belong to the same project." });
        }

        if (await CreatesCycle(dto.TaskId, dto.DependsOnTaskId))
        {
            return BadRequest(new { message = "This dependency would create a cycle." });
        }

        if (await _context.TaskDependencies.AnyAsync(d =>
                d.TaskId == dto.TaskId && d.DependsOnTaskId == dto.DependsOnTaskId))
        {
            return BadRequest(new { message = "Dependency already exists." });
        }

        var dependency = new TaskDependency
        {
            TaskId = dto.TaskId,
            DependsOnTaskId = dto.DependsOnTaskId,
            Type = dto.Type,
            ProjectId = task.ProjectId
        };

        _context.TaskDependencies.Add(dependency);
        await _context.SaveChangesAsync();

        await _activity.LogAsync(
            ActivityAction.DependencyAdded,
            $"'{task.Title}' now depends on '{dependsOn.Title}'",
            userId,
            task.ProjectId,
            task.Id);

        var created = await _context.TaskDependencies
            .Include(d => d.Task)
            .Include(d => d.DependsOnTask)
            .FirstAsync(d => d.Id == dependency.Id);

        return CreatedAtAction(nameof(GetByTask), new { taskId = dependency.TaskId }, ToDto(created));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = GetCurrentUserId();
        var dependency = await _context.TaskDependencies.FindAsync(id);
        if (dependency is null)
        {
            return NotFound();
        }

        _context.TaskDependencies.Remove(dependency);
        await _context.SaveChangesAsync();

        if (userId is not null)
        {
            await _activity.LogAsync(
                ActivityAction.DependencyRemoved,
                "Task dependency removed",
                userId,
                dependency.ProjectId,
                dependency.TaskId);
        }

        return NoContent();
    }

    private async Task<bool> CreatesCycle(Guid taskId, Guid dependsOnTaskId)
    {
        var dependsProjectId = (await _context.Tasks.FindAsync(dependsOnTaskId))!.ProjectId;
        var adjacency = await _context.TaskDependencies
            .Where(d => d.ProjectId == dependsProjectId)
            .Select(d => new { d.TaskId, d.DependsOnTaskId })
            .ToListAsync();

        var visited = new HashSet<Guid>();
        var stack = new Queue<Guid>();
        stack.Enqueue(dependsOnTaskId);

        while (stack.Count > 0)
        {
            var current = stack.Dequeue();
            if (current == taskId)
            {
                return true;
            }
            if (!visited.Add(current))
            {
                continue;
            }
            foreach (var edge in adjacency.Where(e => e.TaskId == current))
            {
                stack.Enqueue(edge.DependsOnTaskId);
            }
        }

        return false;
    }

    private static TaskDependencyResponseDto ToDto(TaskDependency d) => new()
    {
        Id = d.Id,
        TaskId = d.TaskId,
        TaskTitle = d.Task?.Title ?? string.Empty,
        DependsOnTaskId = d.DependsOnTaskId,
        DependsOnTaskTitle = d.DependsOnTask?.Title ?? string.Empty,
        Type = d.Type,
        ProjectId = d.ProjectId
    };

    private string? GetCurrentUserId() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
}
