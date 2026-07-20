using Luma.Server.Data;
using Luma.Server.DTOs.TimeLogs;
using Luma.Server.Models;
using Luma.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Luma.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TimeLogsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ActivityService _activity;
    private readonly NotificationService _notifications;

    public TimeLogsController(
        AppDbContext context,
        ActivityService activity,
        NotificationService notifications)
    {
        _context = context;
        _activity = activity;
        _notifications = notifications;
    }

    [HttpGet("task/{taskId}")]
    public async Task<ActionResult<Luma.Server.DTOs.Common.PagedResult<TimeLogResponseDto>>> GetByTask(Guid taskId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var query = _context.TimeLogs
            .Where(l => l.TaskId == taskId)
            .Include(l => l.User)
            .OrderByDescending(l => l.Date);

        var total = await query.CountAsync();

        var logs = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => ToDto(l))
            .ToListAsync();

        return Ok(new Luma.Server.DTOs.Common.PagedResult<TimeLogResponseDto>
        {
            Items = logs,
            Total = total,
            Page = page,
            PageSize = pageSize
        });
    }

    [HttpGet("project/{projectId}")]
    public async Task<ActionResult<Luma.Server.DTOs.Common.PagedResult<TimeLogResponseDto>>> GetByProject(Guid projectId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var query = _context.TimeLogs
            .Where(l => l.ProjectId == projectId)
            .Include(l => l.User)
            .Include(l => l.Task)
            .OrderByDescending(l => l.Date);

        var total = await query.CountAsync();

        var logs = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => ToDto(l))
            .ToListAsync();

        return Ok(new Luma.Server.DTOs.Common.PagedResult<TimeLogResponseDto>
        {
            Items = logs,
            Total = total,
            Page = page,
            PageSize = pageSize
        });
    }

    [HttpGet("user/{userId}")]
    public async Task<ActionResult<Luma.Server.DTOs.Common.PagedResult<TimeLogResponseDto>>> GetByUser(string userId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var current = GetCurrentUserId();
        if (current != userId && !IsAdminOrMember())
        {
            return Forbid();
        }

        var query = _context.TimeLogs
            .Where(l => l.UserId == userId)
            .Include(l => l.Task)
            .OrderByDescending(l => l.Date);

        var total = await query.CountAsync();

        var logs = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => ToDto(l))
            .ToListAsync();

        return Ok(new Luma.Server.DTOs.Common.PagedResult<TimeLogResponseDto>
        {
            Items = logs,
            Total = total,
            Page = page,
            PageSize = pageSize
        });
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Member")]
    public async Task<ActionResult<TimeLogResponseDto>> Create(CreateTimeLogDto dto)
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

        var task = await _context.Tasks
            .Include(t => t.Project)
            .FirstOrDefaultAsync(t => t.Id == dto.TaskId);
        if (task is null)
        {
            return BadRequest(new { message = "Invalid task." });
        }

        var log = new TimeLog
        {
            TaskId = dto.TaskId,
            ProjectId = task.ProjectId,
            UserId = userId,
            Hours = dto.Hours,
            Date = (dto.Date ?? DateTime.UtcNow).Date,
            Note = dto.Note
        };

        _context.TimeLogs.Add(log);
        await _context.SaveChangesAsync();

        await _activity.LogAsync(
            ActivityAction.TimeLogged,
            $"{log.Hours:0.##}h logged on '{task.Title}'",
            userId,
            task.ProjectId,
            task.Id);

        if (task.AssigneeId is not null && task.AssigneeId != userId)
        {
            await _notifications.NotifyAsync(
                NotificationType.TimeLogged,
                $"{log.Hours:0.##}h logged on '{task.Title}' in '{task.Project!.Name}'",
                task.AssigneeId,
                task.ProjectId,
                task.Id,
                $"/projects/{task.ProjectId}",
                sendEmail: false);
        }

        var created = await _context.TimeLogs
            .Include(l => l.User)
            .Include(l => l.Task)
            .FirstAsync(l => l.Id == log.Id);

        return CreatedAtAction(nameof(GetByTask), new { taskId = log.TaskId }, ToDto(created));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var log = await _context.TimeLogs.FindAsync(id);
        if (log is null)
        {
            return NotFound();
        }

        _context.TimeLogs.Remove(log);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private static TimeLogResponseDto ToDto(TimeLog l) => new()
    {
        Id = l.Id,
        TaskId = l.TaskId,
        TaskTitle = l.Task?.Title ?? string.Empty,
        ProjectId = l.ProjectId,
        UserId = l.UserId,
        UserFullName = l.User?.FullName,
        Date = l.Date,
        Hours = l.Hours,
        Note = l.Note,
        CreatedAt = l.CreatedAt
    };

    private string? GetCurrentUserId() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

    private bool IsAdminOrMember()
    {
        return User.IsInRole("Admin") || User.IsInRole("Member");
    }
}
