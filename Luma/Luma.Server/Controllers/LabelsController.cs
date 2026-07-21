using Luma.Server.Data;
using Luma.Server.DTOs.Labels;
using Luma.Server.Models;
using Luma.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Luma.Server.Controllers;

[ApiController]
[Route("api/projects/{projectId}/[controller]")]
[Authorize]
public class LabelsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ActivityService _activity;

    public LabelsController(AppDbContext context, ActivityService activity)
    {
        _context = context;
        _activity = activity;
    }

    [HttpGet]
    public async Task<ActionResult<List<LabelDto>>> Get(Guid projectId)
    {
        var labels = await _context.Labels
            .Where(l => l.ProjectId == projectId)
            .OrderBy(l => l.Name)
            .Select(l => new LabelDto
            {
                Id = l.Id,
                Name = l.Name,
                Color = l.Color,
                ProjectId = l.ProjectId
            })
            .ToListAsync();

        return Ok(labels);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Member")]
    public async Task<ActionResult<LabelDto>> Create(Guid projectId, CreateLabelDto dto)
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

        var project = await _context.Projects.FindAsync(projectId);
        if (project is null)
        {
            return NotFound();
        }

        var label = new Label
        {
            Name = dto.Name,
            Color = dto.Color,
            ProjectId = projectId
        };

        _context.Labels.Add(label);
        await _context.SaveChangesAsync();

        await _activity.LogAsync(ActivityAction.LabelCreated, $"Label '{label.Name}' created in project '{project.Name}'", userId, projectId);

        return CreatedAtAction(nameof(Get), new { projectId }, new LabelDto
        {
            Id = label.Id,
            Name = label.Name,
            Color = label.Color,
            ProjectId = label.ProjectId
        });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> Update(Guid projectId, Guid id, UpdateLabelDto dto)
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

        var label = await _context.Labels.FindAsync(id);
        if (label is null || label.ProjectId != projectId)
        {
            return NotFound();
        }

        if (dto.Name is not null)
        {
            label.Name = dto.Name;
        }

        if (dto.Color is not null)
        {
            label.Color = dto.Color;
        }

        await _context.SaveChangesAsync();

        var project = await _context.Projects.FindAsync(projectId);
        await _activity.LogAsync(ActivityAction.LabelUpdated, $"Label '{label.Name}' updated in project '{project?.Name}'", userId, projectId);

        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> Delete(Guid projectId, Guid id)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var label = await _context.Labels.FindAsync(id);
        if (label is null || label.ProjectId != projectId)
        {
            return NotFound();
        }

        var inUse = await _context.TaskLabels.AnyAsync(tl => tl.LabelId == id);
        if (inUse)
        {
            return BadRequest(new { message = "Cannot delete a label that is in use. Remove it from all tasks first." });
        }

        _context.Labels.Remove(label);
        await _context.SaveChangesAsync();

        var project = await _context.Projects.FindAsync(projectId);
        await _activity.LogAsync(ActivityAction.LabelRemoved, $"Label '{label.Name}' removed from project '{project?.Name}'", userId, projectId);

        return NoContent();
    }

    private string? GetCurrentUserId() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
}

[ApiController]
[Route("api/tasks/{taskId}/[controller]")]
[Authorize]
public class TaskLabelsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ActivityService _activity;

    public TaskLabelsController(AppDbContext context, ActivityService activity)
    {
        _context = context;
        _activity = activity;
    }

    [HttpGet]
    public async Task<ActionResult<List<LabelDto>>> Get(Guid taskId)
    {
        var labels = await _context.TaskLabels
            .Where(tl => tl.TaskId == taskId)
            .Include(tl => tl.Label)
            .Select(tl => new LabelDto
            {
                Id = tl.Label!.Id,
                Name = tl.Label.Name,
                Color = tl.Label.Color,
                ProjectId = tl.Label.ProjectId
            })
            .ToListAsync();

        return Ok(labels);
    }

    [HttpPost("{labelId}")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> Attach(Guid taskId, Guid labelId)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var task = await _context.Tasks.FindAsync(taskId);
        var label = await _context.Labels.FindAsync(labelId);
        if (task is null || label is null)
        {
            return NotFound();
        }

        var existing = await _context.TaskLabels
            .FirstOrDefaultAsync(tl => tl.TaskId == taskId && tl.LabelId == labelId);
        if (existing is not null)
        {
            return NoContent();
        }

        _context.TaskLabels.Add(new TaskLabel
        {
            TaskId = taskId,
            LabelId = labelId
        });

        await _context.SaveChangesAsync();

        await _activity.LogAsync(ActivityAction.TaskLabelAdded, $"Label '{label.Name}' added to task '{task.Title}'", userId, task.ProjectId, taskId);

        return NoContent();
    }

    [HttpDelete("{labelId}")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> Detach(Guid taskId, Guid labelId)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var taskLabel = await _context.TaskLabels
            .FirstOrDefaultAsync(tl => tl.TaskId == taskId && tl.LabelId == labelId);
        if (taskLabel is null)
        {
            return NotFound();
        }

        var label = await _context.Labels.FindAsync(labelId);
        var task = await _context.Tasks.FindAsync(taskId);

        _context.TaskLabels.Remove(taskLabel);
        await _context.SaveChangesAsync();

        await _activity.LogAsync(ActivityAction.TaskLabelRemoved, $"Label '{label?.Name}' removed from task '{task?.Title}'", userId, task?.ProjectId, taskId);

        return NoContent();
    }

    private string? GetCurrentUserId() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
}
