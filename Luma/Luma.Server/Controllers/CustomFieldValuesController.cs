using Luma.Server.Data;
using Luma.Server.DTOs.CustomFields;
using Luma.Server.Models;
using Luma.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Luma.Server.Controllers;

[ApiController]
[Route("api/projects/{projectId:guid}/custom-fields/{customFieldId:guid}/values")]
[Authorize]
public class CustomFieldValuesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ActivityService _activity;

    public CustomFieldValuesController(AppDbContext context, ActivityService activity)
    {
        _context = context;
        _activity = activity;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProjectCustomFieldValueResponseDto>>> GetAll(Guid projectId, Guid customFieldId)
    {
        var field = await _context.ProjectCustomFields
            .FirstOrDefaultAsync(f => f.Id == customFieldId && f.ProjectId == projectId);
        if (field is null)
        {
            return NotFound();
        }

        var values = await _context.ProjectCustomFieldValues
            .Where(v => v.CustomFieldId == customFieldId)
            .Include(v => v.Task)
            .Select(v => new ProjectCustomFieldValueResponseDto
            {
                Id = v.Id,
                CustomFieldId = v.CustomFieldId,
                CustomFieldName = field.Name,
                CustomFieldType = field.FieldType,
                TaskId = v.TaskId,
                Value = v.Value,
                CreatedAt = v.CreatedAt,
                UpdatedAt = v.UpdatedAt
            })
            .ToListAsync();

        return Ok(values);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Member")]
    public async Task<ActionResult<ProjectCustomFieldValueResponseDto>> Create(Guid projectId, Guid customFieldId, CreateProjectCustomFieldValueDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (dto.CustomFieldId != customFieldId)
        {
            return BadRequest(new { message = "CustomFieldId mismatch." });
        }

        var field = await _context.ProjectCustomFields
            .FirstOrDefaultAsync(f => f.Id == customFieldId && f.ProjectId == projectId);
        if (field is null)
        {
            return NotFound(new { message = "Custom field not found." });
        }

        var task = await _context.Tasks.FindAsync(dto.TaskId);
        if (task is null)
        {
            return BadRequest(new { message = "Task not found." });
        }

        if (task.ProjectId != projectId)
        {
            return BadRequest(new { message = "Task does not belong to this project." });
        }

        var existing = await _context.ProjectCustomFieldValues
            .FirstOrDefaultAsync(v => v.CustomFieldId == customFieldId && v.TaskId == dto.TaskId);

        if (existing is not null)
        {
            existing.Value = dto.Value;
            existing.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(new ProjectCustomFieldValueResponseDto
            {
                Id = existing.Id,
                CustomFieldId = existing.CustomFieldId,
                CustomFieldName = field.Name,
                CustomFieldType = field.FieldType,
                TaskId = existing.TaskId,
                Value = existing.Value,
                CreatedAt = existing.CreatedAt,
                UpdatedAt = existing.UpdatedAt
            });
        }

        var value = new ProjectCustomFieldValue
        {
            CustomFieldId = customFieldId,
            TaskId = dto.TaskId,
            Value = dto.Value
        };

        _context.ProjectCustomFieldValues.Add(value);
        var userId = GetCurrentUserId();
        if (userId is not null)
        {
            await _activity.LogAsync(ActivityAction.TaskUpdated, $"Custom field value updated for task", userId, projectId);
        }
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { projectId, customFieldId, id = value.Id }, new ProjectCustomFieldValueResponseDto
        {
            Id = value.Id,
            CustomFieldId = value.CustomFieldId,
            CustomFieldName = field.Name,
            CustomFieldType = field.FieldType,
            TaskId = value.TaskId,
            Value = value.Value,
            CreatedAt = value.CreatedAt,
            UpdatedAt = value.UpdatedAt
        });
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProjectCustomFieldValueResponseDto>> GetById(Guid projectId, Guid customFieldId, Guid id)
    {
        var field = await _context.ProjectCustomFields
            .FirstOrDefaultAsync(f => f.Id == customFieldId && f.ProjectId == projectId);
        if (field is null)
        {
            return NotFound();
        }

        var value = await _context.ProjectCustomFieldValues
            .FirstOrDefaultAsync(v => v.Id == id && v.CustomFieldId == customFieldId);
        if (value is null)
        {
            return NotFound();
        }

        return Ok(new ProjectCustomFieldValueResponseDto
        {
            Id = value.Id,
            CustomFieldId = value.CustomFieldId,
            CustomFieldName = field.Name,
            CustomFieldType = field.FieldType,
            TaskId = value.TaskId,
            Value = value.Value,
            CreatedAt = value.CreatedAt,
            UpdatedAt = value.UpdatedAt
        });
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> Delete(Guid projectId, Guid customFieldId, Guid id)
    {
        var value = await _context.ProjectCustomFieldValues
            .FirstOrDefaultAsync(v => v.Id == id && v.CustomFieldId == customFieldId);
        if (value is null)
        {
            return NotFound();
        }

        _context.ProjectCustomFieldValues.Remove(value);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private string? GetCurrentUserId() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
}
