using Luma.Server.Data;
using Luma.Server.DTOs.Tasks;
using Luma.Server.Models;
using Luma.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Luma.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ActivityService _activity;
    private readonly NotificationService _notifications;

    public TasksController(
        AppDbContext context,
        ActivityService activity,
        NotificationService notifications)
    {
        _context = context;
        _activity = activity;
        _notifications = notifications;
    }

    [HttpGet("project/{projectId}")]
    public async Task<ActionResult<IEnumerable<TaskResponseDto>>> GetByProject(Guid projectId)
    {
        var tasks = await _context.Tasks
            .Where(t => t.ProjectId == projectId)
            .Include(t => t.Assignee)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => ToDto(t))
            .ToListAsync();

        return Ok(tasks);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TaskResponseDto>> Get(Guid id)
    {
        var task = await _context.Tasks
            .Include(t => t.Assignee)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (task is null)
        {
            return NotFound();
        }

        return Ok(ToDto(task));
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Member")]
    public async Task<ActionResult<TaskResponseDto>> Create(CreateTaskDto dto)
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

        if (dto.AssigneeId is not null)
        {
            var assignee = await _context.Users.FindAsync(dto.AssigneeId);
            if (assignee is null)
            {
                return BadRequest(new { message = "Invalid assignee." });
            }
        }

        var task = new TaskItem
        {
            Title = dto.Title,
            Description = dto.Description,
            Status = dto.Status,
            Priority = dto.Priority,
            DueDate = dto.DueDate,
            ProjectId = dto.ProjectId,
            AssigneeId = dto.AssigneeId
        };

        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        await _activity.LogAsync(ActivityAction.TaskCreated, $"Task '{task.Title}' was created", userId, project.Id, task.Id);

        if (dto.AssigneeId is not null)
        {
            await _notifications.NotifyAsync(
                NotificationType.TaskAssigned,
                $"You were assigned to task '{task.Title}' in '{project.Name}'",
                dto.AssigneeId,
                project.Id,
                task.Id,
                $"/projects/{project.Id}",
                sendEmail: true);
        }

        var created = await _context.Tasks
            .Include(t => t.Assignee)
            .FirstAsync(t => t.Id == task.Id);

        return CreatedAtAction(nameof(Get), new { id = task.Id }, ToDto(created));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> Update(Guid id, UpdateTaskDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = GetCurrentUserId();
        var task = await _context.Tasks
            .Include(t => t.Project)
            .FirstOrDefaultAsync(t => t.Id == id);
        if (task is null)
        {
            return NotFound();
        }

        if (dto.AssigneeId is not null)
        {
            var assignee = await _context.Users.FindAsync(dto.AssigneeId);
            if (assignee is null)
            {
                return BadRequest(new { message = "Invalid assignee." });
            }
        }

        var previousAssignee = task.AssigneeId;
        task.Title = dto.Title;
        task.Description = dto.Description;
        task.Status = dto.Status;
        task.Priority = dto.Priority;
        task.DueDate = dto.DueDate;
        task.AssigneeId = dto.AssigneeId;

        await _context.SaveChangesAsync();

        if (userId is not null)
        {
            await _activity.LogAsync(ActivityAction.TaskUpdated, $"Task '{task.Title}' was updated", userId, task.ProjectId, task.Id);
        }

        if (dto.AssigneeId is not null && dto.AssigneeId != previousAssignee)
        {
            await _notifications.NotifyAsync(
                NotificationType.TaskAssigned,
                $"You were assigned to task '{task.Title}' in '{task.Project!.Name}'",
                dto.AssigneeId,
                task.ProjectId,
                task.Id,
                $"/projects/{task.ProjectId}",
                sendEmail: true);
        }

        return NoContent();
    }

    [HttpPut("{id}/move")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> Move(Guid id, MoveTaskDto dto)
    {
        var userId = GetCurrentUserId();
        var task = await _context.Tasks
            .Include(t => t.Project)
            .FirstOrDefaultAsync(t => t.Id == id);
        if (task is null)
        {
            return NotFound();
        }

        if (task.Status == dto.Status)
        {
            return NoContent();
        }

        var previous = task.Status;
        task.Status = dto.Status;
        await _context.SaveChangesAsync();

        if (userId is not null)
        {
            await _activity.LogAsync(
                ActivityAction.TaskMoved,
                $"Task '{task.Title}' moved from {previous} to {dto.Status}",
                userId,
                task.ProjectId,
                task.Id);

            await _notifications.NotifyProjectAsync(
                NotificationType.TaskStatusChanged,
                $"Task '{task.Title}' moved to {dto.Status}",
                task.ProjectId,
                excludeUserId: Guid.Parse(userId),
                taskId: task.Id,
                link: $"/projects/{task.ProjectId}",
                sendEmail: false);
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var task = await _context.Tasks.FindAsync(id);
        if (task is null)
        {
            return NotFound();
        }

        var userId = GetCurrentUserId();
        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();

        if (userId is not null)
        {
            await _activity.LogAsync(ActivityAction.TaskDeleted, $"Task '{task.Title}' was deleted", userId, task.ProjectId, task.Id);
        }
        return NoContent();
    }

    private static TaskResponseDto ToDto(TaskItem t) => new()
    {
        Id = t.Id,
        Title = t.Title,
        Description = t.Description,
        Status = t.Status,
        Priority = t.Priority,
        DueDate = t.DueDate,
        ProjectId = t.ProjectId,
        SprintId = t.SprintId,
        AssigneeId = t.AssigneeId,
        AssigneeFullName = t.Assignee?.FullName,
        CreatedAt = t.CreatedAt
    };

    private string? GetCurrentUserId() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
}
