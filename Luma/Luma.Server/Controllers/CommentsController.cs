using Luma.Server.Data;
using Luma.Server.DTOs.Comments;
using Luma.Server.Models;
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

    public CommentsController(AppDbContext context)
    {
        _context = context;
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

        var task = await _context.Tasks.FindAsync(dto.TaskId);
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
