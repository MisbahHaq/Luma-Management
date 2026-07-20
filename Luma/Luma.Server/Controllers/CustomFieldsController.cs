using Luma.Server.Data;
using Luma.Server.DTOs.CustomFields;
using Luma.Server.Models;
using Luma.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Luma.Server.Controllers;

[ApiController]
[Route("api/projects/{projectId:guid}/custom-fields")]
[Authorize]
public class CustomFieldsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ActivityService _activity;

    public CustomFieldsController(AppDbContext context, ActivityService activity)
    {
        _context = context;
        _activity = activity;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProjectCustomFieldResponseDto>>> GetAll(Guid projectId)
    {
        var project = await _context.Projects.FindAsync(projectId);
        if (project is null)
        {
            return NotFound();
        }

        var fields = await _context.ProjectCustomFields
            .Where(f => f.ProjectId == projectId)
            .OrderBy(f => f.SortOrder)
            .Select(f => new ProjectCustomFieldResponseDto
            {
                Id = f.Id,
                ProjectId = f.ProjectId,
                Name = f.Name,
                FieldType = f.FieldType,
                IsRequired = f.IsRequired,
                Options = f.Options,
                SortOrder = f.SortOrder,
                IsActive = f.IsActive,
                CreatedAt = f.CreatedAt,
                UpdatedAt = f.UpdatedAt
            })
            .ToListAsync();

        return Ok(fields);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Member")]
    public async Task<ActionResult<ProjectCustomFieldResponseDto>> Create(Guid projectId, CreateProjectCustomFieldDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (dto.ProjectId != projectId)
        {
            return BadRequest(new { message = "ProjectId mismatch." });
        }

        var project = await _context.Projects.FindAsync(projectId);
        if (project is null)
        {
            return NotFound();
        }

        var exists = await _context.ProjectCustomFields
            .AnyAsync(f => f.ProjectId == projectId && f.Name == dto.Name);
        if (exists)
        {
            return BadRequest(new { message = "Custom field with this name already exists." });
        }

        var field = new ProjectCustomField
        {
            ProjectId = projectId,
            Name = dto.Name,
            FieldType = dto.FieldType,
            IsRequired = dto.IsRequired,
            Options = dto.Options,
            SortOrder = dto.SortOrder
        };

        _context.ProjectCustomFields.Add(field);
        var userId = GetCurrentUserId();
        if (userId is not null)
        {
            await _activity.LogAsync(ActivityAction.ProjectUpdated, $"Custom field '{field.Name}' created in '{project.Name}'", userId, projectId);
        }
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { projectId, id = field.Id }, ToDto(field));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProjectCustomFieldResponseDto>> GetById(Guid projectId, Guid id)
    {
        var field = await _context.ProjectCustomFields
            .FirstOrDefaultAsync(f => f.Id == id && f.ProjectId == projectId);

        if (field is null)
        {
            return NotFound();
        }

        return Ok(ToDto(field));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> Update(Guid projectId, Guid id, UpdateProjectCustomFieldDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var field = await _context.ProjectCustomFields
            .FirstOrDefaultAsync(f => f.Id == id && f.ProjectId == projectId);

        if (field is null)
        {
            return NotFound();
        }

        var exists = await _context.ProjectCustomFields
            .AnyAsync(f => f.ProjectId == projectId && f.Name == dto.Name && f.Id != id);
        if (exists)
        {
            return BadRequest(new { message = "Another custom field with this name already exists." });
        }

        field.Name = dto.Name;
        field.FieldType = dto.FieldType;
        field.IsRequired = dto.IsRequired;
        field.Options = dto.Options;
        field.SortOrder = dto.SortOrder;
        field.IsActive = dto.IsActive;
        field.UpdatedAt = DateTime.UtcNow;

        var userId = GetCurrentUserId();
        if (userId is not null)
        {
            await _activity.LogAsync(ActivityAction.ProjectUpdated, $"Custom field '{field.Name}' updated in project", userId, projectId);
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid projectId, Guid id)
    {
        var field = await _context.ProjectCustomFields
            .FirstOrDefaultAsync(f => f.Id == id && f.ProjectId == projectId);

        if (field is null)
        {
            return NotFound();
        }

        _context.ProjectCustomFields.Remove(field);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private static ProjectCustomFieldResponseDto ToDto(ProjectCustomField f) => new()
    {
        Id = f.Id,
        ProjectId = f.ProjectId,
        Name = f.Name,
        FieldType = f.FieldType,
        IsRequired = f.IsRequired,
        Options = f.Options,
        SortOrder = f.SortOrder,
        IsActive = f.IsActive,
        CreatedAt = f.CreatedAt,
        UpdatedAt = f.UpdatedAt
    };

    private string? GetCurrentUserId() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
}
