using Luma.Server.Data;
using Luma.Server.DTOs.Comments;
using Luma.Server.Models;
using Luma.Server.Services;
using Microsoft.AspNetCore.Authorization;
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
    public async Task<ActionResult<IEnumerable<CommentResponseDto>>> GetByTask(Guid taskId)
    {
        var comments = await _context.Comments
            .Where(c => c.TaskId == taskId)
            .Include(c => c.User)
            .OrderBy(c => c.CreatedAt)
            .Select(c => new CommentResponseDto
            {
                Id = c.Id,
                TaskId = c.TaskId,
                UserId = c.UserId,
                UserFullName = c.User != null ? (c.User.FullName ?? c.User.UserName!) : "Unknown",
                Text = c.Text,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync();

        return Ok(comments);
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

        return CreatedAtAction(nameof(GetByTask), new { taskId = comment.TaskId }, new CommentResponseDto
        {
            Id = created.Id,
            TaskId = created.TaskId,
            UserId = created.UserId,
            UserFullName = created.User != null ? (created.User.FullName ?? created.User.UserName!) : "Unknown",
            Text = created.Text,
            CreatedAt = created.CreatedAt
        });
    }
}
