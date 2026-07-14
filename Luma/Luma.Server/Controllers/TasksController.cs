using Luma.Server.Data;
using Luma.Server.DTOs.Tasks;
using Luma.Server.Models;
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

    public TasksController(AppDbContext context)
    {
        _context = context;
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

        var task = await _context.Tasks.FindAsync(id);
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

        task.Title = dto.Title;
        task.Description = dto.Description;
        task.Status = dto.Status;
        task.Priority = dto.Priority;
        task.DueDate = dto.DueDate;
        task.AssigneeId = dto.AssigneeId;

        await _context.SaveChangesAsync();
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

        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();
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
        AssigneeId = t.AssigneeId,
        AssigneeFullName = t.Assignee?.FullName,
        CreatedAt = t.CreatedAt
    };
}
