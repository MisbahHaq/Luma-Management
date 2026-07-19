using Luma.Server.Data;
using Luma.Server.DTOs.Attachments;
using Luma.Server.Models;
using Luma.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Luma.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AttachmentsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IFileStorageService _storage;
    private readonly ActivityService _activity;
    private readonly NotificationService _notifications;

    public AttachmentsController(
        AppDbContext context,
        IFileStorageService storage,
        ActivityService activity,
        NotificationService notifications)
    {
        _context = context;
        _storage = storage;
        _activity = activity;
        _notifications = notifications;
    }

    [HttpGet("task/{taskId}")]
    public async Task<ActionResult<IEnumerable<AttachmentResponseDto>>> GetByTask(Guid taskId)
    {
        var items = await _context.Attachments
            .Where(a => a.TaskId == taskId)
            .Include(a => a.UploadedBy)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new AttachmentResponseDto
            {
                Id = a.Id,
                FileName = a.FileName,
                ContentType = a.ContentType,
                SizeBytes = a.SizeBytes,
                TaskId = a.TaskId,
                UploadedById = a.UploadedById,
                UploadedByFullName = a.UploadedBy != null ? a.UploadedBy.FullName : null,
                CreatedAt = a.CreatedAt
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost("task/{taskId}")]
    [Authorize(Roles = "Admin,Member")]
    [RequestSizeLimit(25 * 1024 * 1024)]
    public async Task<ActionResult<AttachmentResponseDto>> Upload(Guid taskId, IFormFile file)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var task = await _context.Tasks
            .Include(t => t.Project)
            .FirstOrDefaultAsync(t => t.Id == taskId);
        if (task is null)
        {
            return BadRequest(new { message = "Invalid task." });
        }

        if (file is null || file.Length == 0)
        {
            return BadRequest(new { message = "No file provided." });
        }

        await using var stream = file.OpenReadStream();
        var objectKey = await _storage.UploadAsync(file.FileName, file.ContentType, stream);

        var attachment = new Attachment
        {
            FileName = file.FileName,
            ContentType = file.ContentType,
            SizeBytes = file.Length,
            ObjectKey = objectKey,
            TaskId = taskId,
            UploadedById = userId
        };

        _context.Attachments.Add(attachment);
        await _context.SaveChangesAsync();

        await _activity.LogAsync(ActivityAction.AttachmentAdded, $"Attachment '{file.FileName}' added to '{task.Title}'", userId, task.ProjectId, task.Id);
        await _notifications.NotifyProjectAsync(
            NotificationType.AttachmentAdded,
            $"New attachment on task '{task.Title}'",
            task.ProjectId,
            excludeUserId: Guid.Parse(userId),
            taskId: task.Id,
            link: $"/projects/{task.ProjectId}");

        var created = await _context.Attachments
            .Include(a => a.UploadedBy)
            .FirstAsync(a => a.Id == attachment.Id);

        return CreatedAtAction(nameof(GetByTask), new { taskId }, ToDto(created));
    }

    [HttpGet("{id}/download")]
    public async Task<IActionResult> Download(Guid id)
    {
        var attachment = await _context.Attachments.FindAsync(id);
        if (attachment is null)
        {
            return NotFound();
        }

        var (content, contentType, fileName) = await _storage.DownloadAsync(attachment.ObjectKey);
        return File(content, contentType, fileName);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var attachment = await _context.Attachments.FindAsync(id);
        if (attachment is null)
        {
            return NotFound();
        }

        await _storage.DeleteAsync(attachment.ObjectKey);
        _context.Attachments.Remove(attachment);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private static AttachmentResponseDto ToDto(Attachment a) => new()
    {
        Id = a.Id,
        FileName = a.FileName,
        ContentType = a.ContentType,
        SizeBytes = a.SizeBytes,
        TaskId = a.TaskId,
        UploadedById = a.UploadedById,
        UploadedByFullName = a.UploadedBy?.FullName,
        CreatedAt = a.CreatedAt
    };

    private string? GetCurrentUserId() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
}
