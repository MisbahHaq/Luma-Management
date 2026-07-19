using Luma.Server.Data;
using Luma.Server.DTOs.Notifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Luma.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly AppDbContext _context;

    public NotificationsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<NotificationResponseDto>>> GetMine()
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var items = await _context.Notifications
            .Where(n => n.RecipientId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .Select(n => new NotificationResponseDto
            {
                Id = n.Id,
                Type = n.Type.ToString(),
                Message = n.Message,
                Link = n.Link,
                CreatedAt = n.CreatedAt,
                IsRead = n.IsRead,
                ProjectId = n.ProjectId,
                TaskId = n.TaskId
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult<int>> GetUnreadCount()
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var count = await _context.Notifications
            .CountAsync(n => n.RecipientId == userId && !n.IsRead);
        return Ok(count);
    }

    [HttpPost("{id}/read")]
    public async Task<IActionResult> MarkRead(Guid id)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == id && n.RecipientId == userId);
        if (notification is null)
        {
            return NotFound();
        }

        notification.IsRead = true;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var unread = await _context.Notifications
            .Where(n => n.RecipientId == userId && !n.IsRead)
            .ToListAsync();

        foreach (var n in unread)
        {
            n.IsRead = true;
        }
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private string? GetCurrentUserId() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
}
