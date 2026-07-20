using Luma.Server.Data;
using Luma.Server.DTOs.Reports;
using Luma.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Luma.Server.Controllers;

[ApiController]
[Route("api/public/projects")]
[AllowAnonymous]
public class PublicPortalController : ControllerBase
{
    private readonly AppDbContext _context;

    public PublicPortalController(AppDbContext context)
    {
        _context = context;
    }

    private bool ValidateToken(Guid projectId)
    {
        var token = Request.Headers["X-Public-Token"].ToString();
        if (string.IsNullOrEmpty(token))
        {
            token = Request.Query["token"].ToString();
        }

        if (string.IsNullOrEmpty(token))
        {
            return false;
        }

        var project = _context.Projects.FirstOrDefault(p => p.Id == projectId);
        return project != null && project.PublicAccessToken == token;
    }

    [HttpGet("{projectId}")]
    public async Task<IActionResult> GetProject(Guid projectId)
    {
        if (!ValidateToken(projectId))
        {
            return Unauthorized();
        }

        var project = await _context.Projects
            .Include(p => p.CreatedByUser)
            .FirstOrDefaultAsync(p => p.Id == projectId);

        if (project is null)
        {
            return NotFound();
        }

        return Ok(new
        {
            project.Id,
            project.Name,
            project.Description,
            CreatedBy = project.CreatedByUser?.FullName,
            project.CreatedAt
        });
    }

    [HttpGet("{projectId}/tasks")]
    public async Task<IActionResult> GetTasks(Guid projectId)
    {
        if (!ValidateToken(projectId))
        {
            return Unauthorized();
        }

        var tasks = await _context.Tasks
            .Where(t => t.ProjectId == projectId)
            .Include(t => t.Assignee)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new
            {
                t.Id,
                t.Title,
                t.Description,
                Status = t.Status.ToString(),
                Priority = t.Priority.ToString(),
                t.DueDate,
                Assignee = t.Assignee != null ? t.Assignee.FullName : null,
                t.CreatedAt
            })
            .ToListAsync();

        return Ok(tasks);
    }

    [HttpGet("{projectId}/members")]
    public async Task<IActionResult> GetMembers(Guid projectId)
    {
        if (!ValidateToken(projectId))
        {
            return Unauthorized();
        }

        var members = await _context.ProjectMembers
            .Where(m => m.ProjectId == projectId)
            .Include(m => m.User)
            .OrderBy(m => m.User!.FullName)
            .Select(m => new
            {
                m.User!.FullName,
                m.User!.Email
            })
            .ToListAsync();

        return Ok(members);
    }

    [HttpGet("{projectId}/health")]
    public async Task<IActionResult> GetHealth(Guid projectId)
    {
        if (!ValidateToken(projectId))
        {
            return Unauthorized();
        }

        var project = await _context.Projects.FindAsync(projectId);
        if (project is null)
        {
            return NotFound();
        }

        var tasks = await _context.Tasks
            .Where(t => t.ProjectId == projectId)
            .ToListAsync();

        var timeLogs = await _context.TimeLogs
            .Where(l => l.ProjectId == projectId)
            .ToListAsync();

        var now = DateTime.UtcNow;
        var total = tasks.Count;
        var completed = tasks.Count(t => t.Status == Luma.Server.Models.TaskStatus.Done);
        var inProgress = tasks.Count(t => t.Status == Luma.Server.Models.TaskStatus.InProgress);
        var todo = tasks.Count(t => t.Status == Luma.Server.Models.TaskStatus.ToDo);
        var overdue = tasks.Count(t => t.DueDate.HasValue && t.DueDate.Value < now && t.Status != Luma.Server.Models.TaskStatus.Done);
        var completionRate = total > 0 ? Math.Round((double)completed / total * 100, 1) : 0;

        return Ok(new ProjectHealthResponseDto
        {
            ProjectId = projectId,
            ProjectName = project.Name,
            TotalTasks = total,
            CompletedTasks = completed,
            InProgressTasks = inProgress,
            TodoTasks = todo,
            CompletionPercentage = completionRate,
            OverdueTasks = overdue,
            TotalTimeLoggedHours = (int)timeLogs.Sum(l => l.Hours),
            HealthStatus = completionRate >= 70 ? "Good" : completionRate >= 40 ? "At Risk" : "Critical"
        });
    }
}
