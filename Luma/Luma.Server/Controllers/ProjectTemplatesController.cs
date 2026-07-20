using Luma.Server.Data;
using Luma.Server.DTOs.ProjectTemplates;
using Luma.Server.DTOs.Projects;
using Luma.Server.Models;
using Luma.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Luma.Server.Controllers;

[ApiController]
[Route("api/project-templates")]
[Authorize]
public class ProjectTemplatesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ActivityService _activity;

    public ProjectTemplatesController(AppDbContext context, ActivityService activity)
    {
        _context = context;
        _activity = activity;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProjectTemplateResponseDto>>> GetAll([FromQuery] string? category)
    {
        var query = _context.ProjectTemplates
            .Include(t => t.CreatedByUser)
            .Include(t => t.Tasks)
            .Where(t => t.IsPublic || t.CreatedByUserId == GetCurrentUserId())
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(t => t.Category == category);
        }

        var templates = await query
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new ProjectTemplateResponseDto
            {
                Id = t.Id,
                Name = t.Name,
                Description = t.Description,
                Icon = t.Icon,
                Category = t.Category,
                IsPublic = t.IsPublic,
                CreatedAt = t.CreatedAt,
                CreatedByUserId = t.CreatedByUserId,
                CreatedByUserFullName = t.CreatedByUser != null ? t.CreatedByUser.FullName : null,
                Tasks = t.Tasks
                    .Where(tt => tt.ParentTemplateTaskId == null)
                    .OrderBy(tt => tt.SortOrder)
                    .Select(tt => new ProjectTemplateTaskResponseDto
                    {
                        Id = tt.Id,
                        TemplateId = tt.TemplateId,
                        Title = tt.Title,
                        Description = tt.Description,
                        Priority = tt.Priority,
                        SortOrder = tt.SortOrder,
                        ParentTemplateTaskId = tt.ParentTemplateTaskId
                    })
                    .ToList()
            })
            .ToListAsync();

        return Ok(templates);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProjectTemplateResponseDto>> Get(Guid id)
    {
        var template = await _context.ProjectTemplates
            .Include(t => t.CreatedByUser)
            .Include(t => t.Tasks)
            .FirstOrDefaultAsync(t => t.Id == id && (t.IsPublic || t.CreatedByUserId == GetCurrentUserId()));

        if (template is null)
        {
            return NotFound();
        }

        var dto = new ProjectTemplateResponseDto
        {
            Id = template.Id,
            Name = template.Name,
            Description = template.Description,
            Icon = template.Icon,
            Category = template.Category,
            IsPublic = template.IsPublic,
            CreatedAt = template.CreatedAt,
            CreatedByUserId = template.CreatedByUserId,
            CreatedByUserFullName = template.CreatedByUser?.FullName,
            Tasks = template.Tasks
                .OrderBy(tt => tt.SortOrder)
                .Select(tt => new ProjectTemplateTaskResponseDto
                {
                    Id = tt.Id,
                    TemplateId = tt.TemplateId,
                    Title = tt.Title,
                    Description = tt.Description,
                    Priority = tt.Priority,
                    SortOrder = tt.SortOrder,
                    ParentTemplateTaskId = tt.ParentTemplateTaskId
                })
                .ToList()
        };

        return Ok(dto);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Member")]
    public async Task<ActionResult<ProjectTemplateResponseDto>> Create(CreateProjectTemplateDto dto)
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

        var template = new ProjectTemplate
        {
            Name = dto.Name,
            Description = dto.Description,
            Icon = dto.Icon,
            Category = dto.Category,
            IsPublic = dto.IsPublic,
            CreatedByUserId = userId
        };

        foreach (var taskDto in dto.Tasks.OrderBy(t => t.SortOrder))
        {
            var templateTask = new ProjectTemplateTask
            {
                Template = template,
                Title = taskDto.Title,
                Description = taskDto.Description,
                Priority = taskDto.Priority,
                SortOrder = taskDto.SortOrder,
                ParentTemplateTaskId = taskDto.ParentTemplateTaskId
            };
            template.Tasks.Add(templateTask);
        }

        _context.ProjectTemplates.Add(template);
        if (userId is not null)
        {
            await _activity.LogAsync(ActivityAction.ProjectCreated, $"Project template '{template.Name}' was created", userId);
        }
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = template.Id }, ToDto(template));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> Update(Guid id, UpdateProjectTemplateDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var template = await _context.ProjectTemplates
            .Include(t => t.Tasks)
            .FirstOrDefaultAsync(t => t.Id == id && t.CreatedByUserId == GetCurrentUserId());

        if (template is null)
        {
            return NotFound();
        }

        template.Name = dto.Name;
        template.Description = dto.Description;
        template.Icon = dto.Icon;
        template.Category = dto.Category;
        template.IsPublic = dto.IsPublic;

        var existingTaskIds = new HashSet<Guid>(template.Tasks.Select(tt => tt.Id));
        var incomingTaskIds = new HashSet<Guid>(dto.Tasks.Where(t => t.Id != default).Select(t => t.Id));

        foreach (var existing in template.Tasks.ToList())
        {
            if (!incomingTaskIds.Contains(existing.Id))
            {
                template.Tasks.Remove(existing);
            }
        }

        foreach (var taskDto in dto.Tasks)
        {
            if (taskDto.Id != default)
            {
                var existingTask = template.Tasks.FirstOrDefault(tt => tt.Id == taskDto.Id);
                if (existingTask is not null)
                {
                    existingTask.Title = taskDto.Title;
                    existingTask.Description = taskDto.Description;
                    existingTask.Priority = taskDto.Priority;
                    existingTask.SortOrder = taskDto.SortOrder;
                }
            }
            else
            {
                template.Tasks.Add(new ProjectTemplateTask
                {
                    Title = taskDto.Title,
                    Description = taskDto.Description,
                    Priority = taskDto.Priority,
                    SortOrder = taskDto.SortOrder,
                    ParentTemplateTaskId = taskDto.ParentTemplateTaskId
                });
            }
        }

        var userId = GetCurrentUserId();
        if (userId is not null)
        {
            await _activity.LogAsync(ActivityAction.ProjectUpdated, $"Project template '{template.Name}' was updated", userId);
        }
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var template = await _context.ProjectTemplates
            .FirstOrDefaultAsync(t => t.Id == id && t.CreatedByUserId == GetCurrentUserId());

        if (template is null)
        {
            return NotFound();
        }

        _context.ProjectTemplates.Remove(template);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("create-project")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<ActionResult<ProjectResponseDto>> CreateProjectFromTemplate(CreateProjectFromTemplateDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var template = await _context.ProjectTemplates
            .Include(t => t.Tasks)
            .FirstOrDefaultAsync(t => t.Id == dto.TemplateId && (t.IsPublic || t.CreatedByUserId == GetCurrentUserId()));

        if (template is null)
        {
            return NotFound();
        }

        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var project = new Project
        {
            Name = dto.ProjectName,
            Description = dto.ProjectDescription,
            CreatedByUserId = userId
        };

        _context.Projects.Add(project);
        _context.ProjectMembers.Add(new ProjectMember { Project = project, UserId = userId });
        await _context.SaveChangesAsync();

        var now = DateTime.UtcNow;
        foreach (var templateTask in template.Tasks.Where(tt => tt.ParentTemplateTaskId == null).OrderBy(tt => tt.SortOrder))
        {
            var task = new TaskItem
            {
                Title = templateTask.Title,
                Description = templateTask.Description,
                Priority = templateTask.Priority,
                Status = Luma.Server.Models.TaskStatus.ToDo,
                ProjectId = project.Id,
                CreatedAt = now
            };
            _context.Tasks.Add(task);
        }

        await _context.SaveChangesAsync();
        if (userId is not null)
        {
            await _activity.LogAsync(ActivityAction.ProjectCreated, $"Project '{project.Name}' created from template '{template.Name}'", userId, project.Id);
        }

        var created = await _context.Projects
            .Include(p => p.CreatedByUser)
            .FirstAsync(p => p.Id == project.Id);

        return CreatedAtAction(nameof(ProjectsController.Get), "Projects", new { id = project.Id }, new Luma.Server.DTOs.Projects.ProjectResponseDto
        {
            Id = created.Id,
            Name = created.Name,
            Description = created.Description,
            CreatedAt = created.CreatedAt,
            CreatedByUserId = created.CreatedByUserId,
            CreatedByUserFullName = created.CreatedByUser?.FullName
        });
    }

    private static ProjectTemplateResponseDto ToDto(ProjectTemplate t) => new()
    {
        Id = t.Id,
        Name = t.Name,
        Description = t.Description,
        Icon = t.Icon,
        Category = t.Category,
        IsPublic = t.IsPublic,
        CreatedAt = t.CreatedAt,
        CreatedByUserId = t.CreatedByUserId,
        CreatedByUserFullName = t.CreatedByUser?.FullName,
        Tasks = t.Tasks
            .OrderBy(tt => tt.SortOrder)
            .Select(tt => new ProjectTemplateTaskResponseDto
            {
                Id = tt.Id,
                TemplateId = tt.TemplateId,
                Title = tt.Title,
                Description = tt.Description,
                Priority = tt.Priority,
                SortOrder = tt.SortOrder,
                ParentTemplateTaskId = tt.ParentTemplateTaskId
            })
            .ToList()
    };

    private string? GetCurrentUserId() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
}
