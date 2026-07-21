using Luma.Server.Data;
using Luma.Server.DTOs.Comments;
using Luma.Server.Models;
using Luma.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Luma.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CommentsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ActivityService _activity;
    private readonly NotificationService _notifications;

    public CommentsController(
        AppDbContext context,
        ActivityService activity,
        NotificationService notifications)
    {
        _context = context;
        _activity = activity;
        _notifications = notifications;
    }

    [HttpGet("task/{taskId}")]
    public async Task<ActionResult<Luma.Server.DTOs.Common.PagedResult<CommentResponseDto>>> GetByTask(Guid taskId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var currentUserRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        var isAdmin = string.Equals(currentUserRole, nameof(UserRole.Admin), StringComparison.OrdinalIgnoreCase);

        var query = _context.Comments
            .Where(c => c.TaskId == taskId)
            .Include(c => c.User)
            .OrderBy(c => c.CreatedAt);

        var total = await query.CountAsync();

        var comments = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var result = comments.Select(c => ToDto(c, currentUserId ?? string.Empty, isAdmin)).ToList();

        return Ok(new Luma.Server.DTOs.Common.PagedResult<CommentResponseDto>
        {
            Items = result,
            Total = total,
            Page = page,
            PageSize = pageSize
        });
    }

    [HttpPost]
    public async Task<ActionResult<CommentResponseDto>> Create(CreateCommentDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
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

        var comment = new Comment
        {
            TaskId = dto.TaskId,
            UserId = userId,
            Text = dto.Text
        };

        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();

        await _activity.LogAsync(ActivityAction.CommentAdded, $"Comment added to '{task.Title}'", userId, task.ProjectId, task.Id);

        if (task.AssigneeId is not null && task.AssigneeId != userId)
        {
            await _notifications.NotifyAsync(
                NotificationType.CommentAdded,
                $"New comment on task '{task.Title}' in '{task.Project!.Name}'",
                task.AssigneeId,
                task.ProjectId,
                task.Id,
                $"/projects/{task.ProjectId}",
                sendEmail: true);
        }

        var created = await _context.Comments
            .Include(c => c.User)
            .FirstAsync(c => c.Id == comment.Id);

        return CreatedAtAction(nameof(GetByTask), new { taskId = comment.TaskId }, ToDto(created, userId ?? string.Empty, false));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, CommentUpdateDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId is null)
        {
            return Unauthorized();
        }

        var currentUserRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        var isAdmin = string.Equals(currentUserRole, nameof(UserRole.Admin), StringComparison.OrdinalIgnoreCase);

        var comment = await _context.Comments
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (comment is null || comment.IsDeleted)
        {
            return NotFound();
        }

        if (!isAdmin && comment.UserId != userId)
        {
            return StatusCode(403, new { message = "You can only edit your own comments." });
        }

        comment.Text = dto.Text;
        await _context.SaveChangesAsync();

        var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == comment.TaskId);
        await _activity.LogAsync(ActivityAction.CommentUpdated, $"Comment updated on '{task?.Title}'", userId, task?.ProjectId, task?.Id);

        return Ok(ToDto(comment, userId, isAdmin));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId is null)
        {
            return Unauthorized();
        }

        var currentUserRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        var isAdmin = string.Equals(currentUserRole, nameof(UserRole.Admin), StringComparison.OrdinalIgnoreCase);

        var comment = await _context.Comments
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (comment is null || comment.IsDeleted)
        {
            return NotFound();
        }

        if (!isAdmin && comment.UserId != userId)
        {
            return StatusCode(403, new { message = "You can only delete your own comments." });
        }

        comment.IsDeleted = true;
        comment.DeletedAt = DateTime.UtcNow;
        comment.DeletedById = userId;
        await _context.SaveChangesAsync();

        var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == comment.TaskId);
        await _activity.LogAsync(ActivityAction.CommentRemoved, $"Comment removed from '{task?.Title}'", userId, task?.ProjectId, task?.Id);

        return NoContent();
    }

    private static CommentResponseDto ToDto(Comment c, string currentUserId, bool isAdmin)
    {
        return new CommentResponseDto
        {
            Id = c.Id,
            TaskId = c.TaskId,
            UserId = c.UserId,
            UserFullName = c.User != null ? (c.User.FullName ?? c.User.UserName!) : "Unknown",
            Text = c.Text,
            CreatedAt = c.CreatedAt,
            IsDeleted = c.IsDeleted,
            CanEdit = isAdmin || c.UserId == currentUserId,
            CanDelete = isAdmin || c.UserId == currentUserId
        };
    }
}