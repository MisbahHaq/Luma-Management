using Luma.Server.Data;
using Luma.Server.DTOs.Reports;
using Luma.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Luma.Server.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReportsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardSummaryResponseDto>> GetDashboard()
    {
        var projects = await _context.Projects.ToListAsync();
        var projectIds = projects.Select(p => p.Id).ToList();

        var tasks = await _context.Tasks
            .Where(t => projectIds.Contains(t.ProjectId))
            .ToListAsync();

        var timeLogs = await _context.TimeLogs
            .Where(l => projectIds.Contains(l.ProjectId))
            .ToListAsync();

        var now = DateTime.UtcNow;

        var projectHealths = projects.Select(p =>
        {
            var projectTasks = tasks.Where(t => t.ProjectId == p.Id).ToList();
            var projectLogs = timeLogs.Where(l => l.ProjectId == p.Id).ToList();
            var completed = projectTasks.Count(t => t.Status == Luma.Server.Models.TaskStatus.Done);
            var inProgress = projectTasks.Count(t => t.Status == Luma.Server.Models.TaskStatus.InProgress);
            var todo = projectTasks.Count(t => t.Status == Luma.Server.Models.TaskStatus.ToDo);
            var total = projectTasks.Count;
            var overdue = projectTasks.Count(t => t.DueDate.HasValue && t.DueDate.Value < now && t.Status != Luma.Server.Models.TaskStatus.Done);
            var completionRate = total > 0 ? Math.Round((double)completed / total * 100, 1) : 0;

            return new ProjectHealthResponseDto
            {
                ProjectId = p.Id,
                ProjectName = p.Name,
                TotalTasks = total,
                CompletedTasks = completed,
                InProgressTasks = inProgress,
                TodoTasks = todo,
                CompletionPercentage = completionRate,
                OverdueTasks = overdue,
                TotalTimeLoggedHours = (int)projectLogs.Sum(l => l.Hours),
                HealthStatus = completionRate >= 70 ? "Good" : completionRate >= 40 ? "At Risk" : "Critical",
                StatusDistribution = new List<TaskStatusDistributionDto>
                {
                    new TaskStatusDistributionDto { Status = "To Do", Count = todo, Percentage = total > 0 ? Math.Round((double)todo / total * 100, 1) : 0 },
                    new TaskStatusDistributionDto { Status = "In Progress", Count = inProgress, Percentage = total > 0 ? Math.Round((double)inProgress / total * 100, 1) : 0 },
                    new TaskStatusDistributionDto { Status = "Done", Count = completed, Percentage = total > 0 ? Math.Round((double)completed / total * 100, 1) : 0 }
                },
                PriorityDistribution = Enum.GetValues(typeof(TaskPriority))
                    .Cast<TaskPriority>()
                    .Select(pri => new TaskPriorityDistributionDto
                    {
                        Priority = pri.ToString(),
                        Count = projectTasks.Count(t => t.Priority == pri),
                        Percentage = total > 0 ? Math.Round((double)projectTasks.Count(t => t.Priority == pri) / total * 100, 1) : 0
                    })
                    .ToList(),
                AssigneeWorkload = projectTasks
                    .Where(t => !string.IsNullOrEmpty(t.AssigneeId))
                    .GroupBy(t => t.AssigneeId)
                    .Select(g => new AssigneeWorkloadDto
                    {
                        AssigneeId = g.Key!,
                        AssigneeName = g.FirstOrDefault()?.Assignee?.FullName ?? "Unassigned",
                        TaskCount = g.Count(),
                        TotalHoursLogged = projectLogs.Where(l => l.UserId == g.Key).Sum(l => l.Hours)
                    })
                    .ToList()
            };
        }).ToList();

        var totalTasks = tasks.Count;
        var completedTasks = tasks.Count(t => t.Status == Luma.Server.Models.TaskStatus.Done);
        var inProgressTasks = tasks.Count(t => t.Status == Luma.Server.Models.TaskStatus.InProgress);
        var overdueTasks = tasks.Count(t => t.DueDate.HasValue && t.DueDate.Value < now && t.Status != Luma.Server.Models.TaskStatus.Done);
        var overallCompletionRate = totalTasks > 0 ? Math.Round((double)completedTasks / totalTasks * 100, 1) : 0;

        return Ok(new DashboardSummaryResponseDto
        {
            TotalProjects = projects.Count,
            TotalTasks = totalTasks,
            CompletedTasks = completedTasks,
            InProgressTasks = inProgressTasks,
            OverdueTasks = overdueTasks,
            OverallCompletionRate = overallCompletionRate,
            Projects = projectHealths
        });
    }

    [HttpGet("projects/{projectId}/burndown")]
    public async Task<ActionResult<BurndownResponseDto>> GetBurndown(Guid projectId)
    {
        var project = await _context.Projects.FindAsync(projectId);
        if (project is null)
        {
            return NotFound();
        }

        var sprint = await _context.Sprints
            .Where(s => s.ProjectId == projectId && s.Status == Luma.Server.Models.SprintStatus.Active)
            .OrderByDescending(s => s.StartDate)
            .FirstOrDefaultAsync();

        if (sprint is null || !sprint.StartDate.HasValue || !sprint.EndDate.HasValue)
        {
            return Ok(new BurndownResponseDto
            {
                ProjectId = projectId,
                ProjectName = project.Name,
                SprintId = Guid.Empty,
                SprintName = "No active sprint",
                SprintStart = DateTime.UtcNow,
                SprintEnd = DateTime.UtcNow,
                TotalTasks = 0,
                DataPoints = new List<BurndownPointDto>()
            });
        }

        var sprintTasks = await _context.Tasks
            .Where(t => t.ProjectId == projectId && t.SprintId == sprint.Id)
            .ToListAsync();

        var totalTasks = sprintTasks.Count;
        var startDate = sprint.StartDate.Value.Date;
        var endDate = sprint.EndDate.Value.Date;
        var totalDays = (endDate - startDate).Days + 1;

        var dataPoints = new List<BurndownPointDto>();
        for (var day = 0; day < totalDays; day++)
        {
            var currentDate = startDate.AddDays(day);
            var remaining = sprintTasks.Count(t => t.Status != Luma.Server.Models.TaskStatus.Done && t.CreatedAt <= currentDate);
            var ideal = totalDays > 0 ? Math.Max(0, totalTasks - (totalTasks * day / totalDays)) : 0;

            dataPoints.Add(new BurndownPointDto
            {
                Date = currentDate,
                RemainingTasks = remaining,
                IdealRemaining = (int)Math.Round((double)ideal)
            });
        }

        return Ok(new BurndownResponseDto
        {
            ProjectId = projectId,
            ProjectName = project.Name,
            SprintId = sprint.Id,
            SprintName = sprint.Name,
            SprintStart = startDate,
            SprintEnd = endDate,
            TotalTasks = totalTasks,
            DataPoints = dataPoints
        });
    }

    [HttpGet("projects/{projectId}/velocity")]
    public async Task<ActionResult<VelocityResponseDto>> GetVelocity(Guid projectId)
    {
        var project = await _context.Projects.FindAsync(projectId);
        if (project is null)
        {
            return NotFound();
        }

        var completedSprints = await _context.Sprints
            .Where(s => s.ProjectId == projectId && s.Status == Luma.Server.Models.SprintStatus.Completed)
            .OrderBy(s => s.StartDate)
            .ToListAsync();

        var dataPoints = new List<VelocityPointDto>();
        foreach (var sprint in completedSprints)
        {
            var completedTasks = await _context.Tasks
                .CountAsync(t => t.ProjectId == projectId && t.SprintId == sprint.Id && t.Status == Luma.Server.Models.TaskStatus.Done);

            dataPoints.Add(new VelocityPointDto
            {
                SprintId = sprint.Id,
                SprintName = sprint.Name,
                SprintStart = sprint.StartDate ?? DateTime.UtcNow,
                SprintEnd = sprint.EndDate ?? DateTime.UtcNow,
                CompletedTasks = completedTasks,
                StoryPoints = completedTasks
            });
        }

        var avgVelocity = dataPoints.Count > 0 ? Math.Round((double)dataPoints.Average(d => d.CompletedTasks), 1) : 0;

        return Ok(new VelocityResponseDto
        {
            ProjectId = projectId,
            ProjectName = project.Name,
            AverageVelocity = avgVelocity,
            DataPoints = dataPoints
        });
    }

    [HttpGet("projects/{projectId}/health")]
    public async Task<ActionResult<ProjectHealthResponseDto>> GetProjectHealth(Guid projectId)
    {
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
            HealthStatus = completionRate >= 70 ? "Good" : completionRate >= 40 ? "At Risk" : "Critical",
            StatusDistribution = new List<TaskStatusDistributionDto>
            {
                new TaskStatusDistributionDto { Status = "To Do", Count = todo, Percentage = total > 0 ? Math.Round((double)todo / total * 100, 1) : 0 },
                new TaskStatusDistributionDto { Status = "In Progress", Count = inProgress, Percentage = total > 0 ? Math.Round((double)inProgress / total * 100, 1) : 0 },
                new TaskStatusDistributionDto { Status = "Done", Count = completed, Percentage = total > 0 ? Math.Round((double)completed / total * 100, 1) : 0 }
            },
            PriorityDistribution = Enum.GetValues(typeof(TaskPriority))
                .Cast<TaskPriority>()
                .Select(pri => new TaskPriorityDistributionDto
                {
                    Priority = pri.ToString(),
                    Count = tasks.Count(t => t.Priority == pri),
                    Percentage = total > 0 ? Math.Round((double)tasks.Count(t => t.Priority == pri) / total * 100, 1) : 0
                })
                .ToList(),
            AssigneeWorkload = tasks
                .Where(t => !string.IsNullOrEmpty(t.AssigneeId))
                .GroupBy(t => t.AssigneeId)
                .Select(g => new AssigneeWorkloadDto
                {
                    AssigneeId = g.Key!,
                    AssigneeName = g.FirstOrDefault()?.Assignee?.FullName ?? "Unassigned",
                    TaskCount = g.Count(),
                    TotalHoursLogged = timeLogs.Where(l => l.UserId == g.Key).Sum(l => l.Hours)
                })
                .ToList()
        });
    }
}
