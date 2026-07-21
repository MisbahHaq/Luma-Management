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
    private readonly ProjectAuthorizationService _authz;

    public TasksController(
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

    [HttpGet("my")]
    public async Task<ActionResult<Luma.Server.DTOs.Common.PagedResult<TaskResponseDto>>> GetMyTasks(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] string? priority = null,
        [FromQuery] Guid? projectId = null)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var globalRole = GetCurrentUserRole();
        var accessibleProjectIds = await GetAccessibleProjectIdsAsync(userId, globalRole);

        IQueryable<TaskItem> query = _context.Tasks
            .Where(t => t.AssigneeId == userId && accessibleProjectIds.Contains(t.ProjectId))
            .Include(t => t.Assignee);

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<Models.TaskStatus>(status, true, out var taskStatus))
        {
            query = query.Where(t => t.Status == taskStatus);
        }

        if (!string.IsNullOrEmpty(priority) && Enum.TryParse<Models.TaskPriority>(priority, true, out var taskPriority))
        {
            query = query.Where(t => t.Priority == taskPriority);
        }

        if (projectId.HasValue)
        {
            query = query.Where(t => t.ProjectId == projectId.Value);
        }

        var total = await query.CountAsync();

        var tasks = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => ToDto(t))
            .ToListAsync();

        return Ok(new Luma.Server.DTOs.Common.PagedResult<TaskResponseDto>
        {
            Items = tasks,
            Total = total,
            Page = page,
            PageSize = pageSize
        });
    }

    [HttpGet("project/{projectId}")]
    public async Task<ActionResult<Luma.Server.DTOs.Common.PagedResult<TaskResponseDto>>> GetByProject(Guid projectId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var query = _context.Tasks
            .Where(t => t.ProjectId == projectId)
            .Include(t => t.Assignee)
            .OrderByDescending(t => t.CreatedAt);

        var total = await query.CountAsync();

        var tasks = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => ToDto(t))
            .ToListAsync();

        return Ok(new Luma.Server.DTOs.Common.PagedResult<TaskResponseDto>
        {
            Items = tasks,
            Total = total,
            Page = page,
            PageSize = pageSize
        });
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
        var globalRole = GetCurrentUserRole();
        if (userId is null)
        {
            return Unauthorized();
        }

        var project = await _context.Projects.FindAsync(dto.ProjectId);
        if (project is null)
        {
            return BadRequest(new { message = "Invalid project." });
        }

        if (!await _authz.CanWriteProjectAsync(dto.ProjectId, userId, globalRole))
        {
            return StatusCode(403, new { message = "You do not have permission to add tasks to this project." });
        }

        if (dto.AssigneeId is not null)
        {
            var assignee = await _context.Users.FindAsync(dto.AssigneeId);
            if (assignee is null)
            {
                return BadRequest(new { message = "Invalid assignee." });
            }
        }

        if (dto.ParentTaskId is not null)
        {
            var parentError = await ValidateParentAsync(dto.ParentTaskId.Value, dto.ProjectId, null);
            if (parentError is not null)
            {
                return BadRequest(new { message = parentError });
            }
        }

        var task = new TaskItem
        {
            Title = dto.Title,
            Description = dto.Description,
            Status = dto.Status,
            Priority = dto.Priority,
            Type = dto.Type,
            ParentTaskId = dto.ParentTaskId,
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
        var globalRole = GetCurrentUserRole();
        var task = await _context.Tasks
            .Include(t => t.Project)
            .FirstOrDefaultAsync(t => t.Id == id);
        if (task is null)
        {
            return NotFound();
        }

        if (!await _authz.CanWriteProjectAsync(task.ProjectId, userId, globalRole))
        {
            return StatusCode(403, new { message = "You do not have permission to edit this task." });
        }

        if (dto.AssigneeId is not null)
        {
            var assignee = await _context.Users.FindAsync(dto.AssigneeId);
            if (assignee is null)
            {
                return BadRequest(new { message = "Invalid assignee." });
            }
        }

        if (dto.ParentTaskId is not null)
        {
            var parentError = await ValidateParentAsync(dto.ParentTaskId.Value, task.ProjectId, task.Id);
            if (parentError is not null)
            {
                return BadRequest(new { message = parentError });
            }
        }

        var previousAssignee = task.AssigneeId;
        task.Title = dto.Title;
        task.Description = dto.Description;
        task.Status = dto.Status;
        task.Priority = dto.Priority;
        task.Type = dto.Type;
        task.ParentTaskId = dto.ParentTaskId;
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
        var globalRole = GetCurrentUserRole();
        var task = await _context.Tasks
            .Include(t => t.Project)
            .FirstOrDefaultAsync(t => t.Id == id);
        if (task is null)
        {
            return NotFound();
        }

        if (!await _authz.CanWriteProjectAsync(task.ProjectId, userId, globalRole))
        {
            return StatusCode(403, new { message = "You do not have permission to move this task." });
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
        var globalRole = GetCurrentUserRole();
        if (!await _authz.CanWriteProjectAsync(task.ProjectId, userId, globalRole))
        {
            return StatusCode(403, new { message = "You do not have permission to delete this task." });
        }

        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();

        if (userId is not null)
        {
            await _activity.LogAsync(ActivityAction.TaskDeleted, $"Task '{task.Title}' was deleted", userId, task.ProjectId, task.Id);
        }
        return NoContent();
    }

    [HttpPost("bulk/status")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<ActionResult<BulkResultDto>> BulkUpdateStatus([FromBody] BulkStatusDto dto)
    {
        var userId = GetCurrentUserId();
        var globalRole = GetCurrentUserRole();
        if (userId is null)
        {
            return Unauthorized();
        }

        var result = new BulkResultDto();
        var tasks = await _context.Tasks.Where(t => dto.TaskIds.Contains(t.Id)).ToListAsync();

        foreach (var task in tasks)
        {
            if (!await _authz.CanWriteProjectAsync(task.ProjectId, userId, globalRole))
            {
                result.Failed++;
                result.Errors.Add($"Task '{task.Title}': no permission.");
                continue;
            }

            task.Status = dto.Status;
            result.Succeeded++;
        }

        await _context.SaveChangesAsync();

        if (result.Succeeded > 0 && userId is not null)
        {
            await _activity.LogAsync(
                ActivityAction.TaskBulkStatusChanged,
                $"Changed status of {result.Succeeded} task{(result.Succeeded == 1 ? "" : "s")} to {dto.Status}",
                userId);
        }

        return Ok(result);
    }

    [HttpPost("bulk/priority")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<ActionResult<BulkResultDto>> BulkUpdatePriority([FromBody] BulkPriorityDto dto)
    {
        var userId = GetCurrentUserId();
        var globalRole = GetCurrentUserRole();
        if (userId is null)
        {
            return Unauthorized();
        }

        var result = new BulkResultDto();
        var tasks = await _context.Tasks.Where(t => dto.TaskIds.Contains(t.Id)).ToListAsync();

        foreach (var task in tasks)
        {
            if (!await _authz.CanWriteProjectAsync(task.ProjectId, userId, globalRole))
            {
                result.Failed++;
                result.Errors.Add($"Task '{task.Title}': no permission.");
                continue;
            }

            task.Priority = dto.Priority;
            result.Succeeded++;
        }

        await _context.SaveChangesAsync();

        if (result.Succeeded > 0 && userId is not null)
        {
            await _activity.LogAsync(
                ActivityAction.TaskBulkPriorityChanged,
                $"Changed priority of {result.Succeeded} task{(result.Succeeded == 1 ? "" : "s")} to {dto.Priority}",
                userId);
        }

        return Ok(result);
    }

    [HttpPost("bulk/assignee")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<ActionResult<BulkResultDto>> BulkUpdateAssignee([FromBody] BulkAssigneeDto dto)
    {
        var userId = GetCurrentUserId();
        var globalRole = GetCurrentUserRole();
        if (userId is null)
        {
            return Unauthorized();
        }

        var result = new BulkResultDto();
        var tasks = await _context.Tasks.Where(t => dto.TaskIds.Contains(t.Id)).ToListAsync();

        foreach (var task in tasks)
        {
            if (!await _authz.CanWriteProjectAsync(task.ProjectId, userId, globalRole))
            {
                result.Failed++;
                result.Errors.Add($"Task '{task.Title}': no permission.");
                continue;
            }

            task.AssigneeId = dto.AssigneeId;
            result.Succeeded++;
        }

        await _context.SaveChangesAsync();

        if (result.Succeeded > 0 && userId is not null)
        {
            await _activity.LogAsync(
                ActivityAction.TaskBulkAssigneeChanged,
                $"Changed assignee of {result.Succeeded} task{(result.Succeeded == 1 ? "" : "s")}",
                userId);
        }

        return Ok(result);
    }

    [HttpPost("bulk/delete")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<ActionResult<BulkResultDto>> BulkDelete([FromBody] BulkTaskIdsDto dto)
    {
        var userId = GetCurrentUserId();
        var globalRole = GetCurrentUserRole();
        if (userId is null)
        {
            return Unauthorized();
        }

        var result = new BulkResultDto();
        var tasks = await _context.Tasks.Where(t => dto.TaskIds.Contains(t.Id)).ToListAsync();

        var authorizedTasks = new List<TaskItem>();

        foreach (var task in tasks)
        {
            if (!await _authz.CanWriteProjectAsync(task.ProjectId, userId, globalRole))
            {
                result.Failed++;
                result.Errors.Add($"Task '{task.Title}': no permission.");
                continue;
            }

            authorizedTasks.Add(task);
            result.Succeeded++;
        }

        _context.Tasks.RemoveRange(authorizedTasks);
        await _context.SaveChangesAsync();

        if (result.Succeeded > 0 && userId is not null)
        {
            await _activity.LogAsync(
                ActivityAction.TaskBulkDeleted,
                $"Deleted {result.Succeeded} task{(result.Succeeded == 1 ? "" : "s")}",
                userId);
        }

        return Ok(result);
    }

    private static TaskResponseDto ToDto(TaskItem t) => new()
    {
        Id = t.Id,
        Title = t.Title,
        Description = t.Description,
        Status = t.Status,
        Priority = t.Priority,
        Type = t.Type,
        ParentTaskId = t.ParentTaskId,
        DueDate = t.DueDate,
        ProjectId = t.ProjectId,
        SprintId = t.SprintId,
        AssigneeId = t.AssigneeId,
        AssigneeFullName = t.Assignee?.FullName,
        CreatedAt = t.CreatedAt
    };

    /// <summary>
    /// Validates a proposed parent task: must exist, belong to the same project,
    /// be of type Epic, and must not create a cycle (cannot be the task itself or
    /// one of its own descendants).
    /// </summary>
    private async Task<string?> ValidateParentAsync(Guid parentId, Guid projectId, Guid? childId)
    {
        if (parentId == childId)
        {
            return "A task cannot be its own parent.";
        }

        var parent = await _context.Tasks.FindAsync(parentId);
        if (parent is null)
        {
            return "Invalid parent task.";
        }

        if (parent.ProjectId != projectId)
        {
            return "Parent task must belong to the same project.";
        }

        if (parent.Type != TaskItemType.Epic)
        {
            return "Only tasks of type Epic can have child tasks.";
        }

        if (childId is not null)
        {
            // Walk up from the proposed parent; if we reach the child, it's a cycle.
            var ancestorId = parent.ParentTaskId;
            var guard = 0;
            while (ancestorId is not null && guard++ < 100)
            {
                if (ancestorId == childId)
                {
                    return "This parent would create a cycle.";
                }
                var ancestor = await _context.Tasks.FindAsync(ancestorId.Value);
                ancestorId = ancestor?.ParentTaskId;
            }
        }

        return null;
    }

    private string? GetCurrentUserId() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

    private string? GetCurrentUserRole() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

    private async Task<List<Guid>> GetAccessibleProjectIdsAsync(string userId, string? globalRole)
    {
        if (_authz.IsGlobalAdmin(globalRole))
        {
            return await _context.Projects
                .Select(p => p.Id)
                .ToListAsync();
        }

        return await _context.ProjectMembers
            .Where(m => m.UserId == userId)
            .Select(m => m.ProjectId)
            .ToListAsync();
    }
}
