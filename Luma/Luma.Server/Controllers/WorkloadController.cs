using Luma.Server.Data;
using Luma.Server.DTOs.Workload;
using Luma.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Luma.Server.Controllers;

[ApiController]
[Route("api/workload")]
[Authorize]
public class WorkloadController : ControllerBase
{
    private readonly AppDbContext _context;

    public WorkloadController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("capacity")]
    public async Task<ActionResult<IEnumerable<TeamMemberCapacityResponseDto>>> GetCapacity(
        [FromQuery] Guid? projectId,
        [FromQuery] string? userId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        var start = from?.Date ?? DateTime.UtcNow.Date.AddDays(-30);
        var end = to?.Date ?? DateTime.UtcNow.Date.AddDays(30);

        var query = _context.TeamMemberCapacities
            .Include(c => c.Project)
            .Include(c => c.User)
            .Where(c => c.Date >= start && c.Date <= end);

        if (projectId.HasValue)
        {
            query = query.Where(c => c.ProjectId == projectId.Value);
        }

        if (!string.IsNullOrWhiteSpace(userId))
        {
            query = query.Where(c => c.UserId == userId);
        }

        var capacities = await query
            .OrderBy(c => c.Date)
            .Select(c => new TeamMemberCapacityResponseDto
            {
                Id = c.Id,
                ProjectId = c.ProjectId,
                ProjectName = c.Project != null ? c.Project.Name : string.Empty,
                UserId = c.UserId,
                UserFullName = c.User != null ? c.User.FullName : string.Empty,
                Date = c.Date,
                CapacityHours = c.CapacityHours,
                AllocatedHours = c.AllocatedHours,
                UtilizationPercentage = c.CapacityHours > 0 ? Math.Round((c.AllocatedHours / c.CapacityHours) * 100, 1) : 0,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            })
            .ToListAsync();

        return Ok(capacities);
    }

    [HttpGet("utilization")]
    public async Task<ActionResult<IEnumerable<ResourceUtilizationResponseDto>>> GetUtilization([FromQuery] Guid? projectId)
    {
        var query = _context.ProjectMembers
            .Include(m => m.User)
            .Include(m => m.Project)
            .AsQueryable();

        if (projectId.HasValue)
        {
            query = query.Where(m => m.ProjectId == projectId.Value);
        }

        var members = await query.ToListAsync();
        var userIds = members.Select(m => m.UserId).Distinct().ToList();

        var taskAssignments = await _context.Tasks
            .Where(t => userIds.Contains(t.AssigneeId ?? string.Empty) && t.Status != Luma.Server.Models.TaskStatus.Done)
            .GroupBy(t => t.AssigneeId)
            .Select(g => new
            {
                UserId = g.Key,
                TaskCount = g.Count(),
                ActiveProjects = g.Select(t => t.ProjectId).Distinct().Count()
            })
            .ToListAsync();

        var result = members.Select(m => new ResourceUtilizationResponseDto
        {
            UserId = m.UserId,
            UserFullName = m.User?.FullName ?? "Unknown",
            UserEmail = m.User?.Email ?? string.Empty,
            TotalCapacityHours = 40,
            TotalAllocatedHours = 0,
            UtilizationPercentage = 0,
            ActiveProjectCount = 0,
            TaskCount = 0
        }).ToList();

        foreach (var item in result)
        {
            var assignment = taskAssignments.FirstOrDefault(a => a.UserId == item.UserId);
            if (assignment != null)
            {
                item.TaskCount = assignment.TaskCount;
                item.ActiveProjectCount = assignment.ActiveProjects;
                item.TotalAllocatedHours = assignment.TaskCount * 2;
                item.UtilizationPercentage = item.TotalCapacityHours > 0
                    ? Math.Round((item.TotalAllocatedHours / item.TotalCapacityHours) * 100, 1)
                    : 0;
            }
        }

        return Ok(result);
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<WorkloadDashboardResponseDto>> GetDashboard([FromQuery] Guid? projectId)
    {
        var utilization = await GetUtilization(projectId);
        var start = DateTime.UtcNow.Date.AddDays(-14);
        var end = DateTime.UtcNow.Date.AddDays(14);
        var capacity = await GetCapacity(projectId, userId: null, from: start, to: end);

        return Ok(new WorkloadDashboardResponseDto
        {
            Resources = ((IEnumerable<ResourceUtilizationResponseDto>)utilization.Value!).ToList(),
            Timeline = ((IEnumerable<TeamMemberCapacityResponseDto>)capacity.Value!).ToList()
        });
    }

    [HttpPost("capacity")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<ActionResult<TeamMemberCapacityResponseDto>> SetCapacity(CreateTeamMemberCapacityDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var project = await _context.Projects.FindAsync(dto.ProjectId);
        if (project is null)
        {
            return NotFound();
        }

        var user = await _context.Users.FindAsync(dto.UserId);
        if (user is null)
        {
            return BadRequest(new { message = "User not found." });
        }

        var existing = await _context.TeamMemberCapacities
            .FirstOrDefaultAsync(c => c.ProjectId == dto.ProjectId && c.UserId == dto.UserId && c.Date == dto.Date);

        if (existing is not null)
        {
            existing.CapacityHours = dto.CapacityHours;
            existing.AllocatedHours = dto.AllocatedHours;
            existing.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new TeamMemberCapacityResponseDto
            {
                Id = existing.Id,
                ProjectId = existing.ProjectId,
                ProjectName = project.Name,
                UserId = existing.UserId,
                UserFullName = user.FullName ?? string.Empty,
                Date = existing.Date,
                CapacityHours = existing.CapacityHours,
                AllocatedHours = existing.AllocatedHours,
                UtilizationPercentage = existing.CapacityHours > 0 ? Math.Round((existing.AllocatedHours / existing.CapacityHours) * 100, 1) : 0,
                CreatedAt = existing.CreatedAt,
                UpdatedAt = existing.UpdatedAt
            });
        }

        var capacity = new TeamMemberCapacity
        {
            ProjectId = dto.ProjectId,
            UserId = dto.UserId,
            Date = dto.Date,
            CapacityHours = dto.CapacityHours,
            AllocatedHours = dto.AllocatedHours
        };

        _context.TeamMemberCapacities.Add(capacity);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetCapacity), new { projectId = dto.ProjectId }, new TeamMemberCapacityResponseDto
        {
            Id = capacity.Id,
            ProjectId = capacity.ProjectId,
            ProjectName = project.Name,
            UserId = capacity.UserId,
            UserFullName = user.FullName ?? string.Empty,
            Date = capacity.Date,
            CapacityHours = capacity.CapacityHours,
            AllocatedHours = capacity.AllocatedHours,
            UtilizationPercentage = capacity.CapacityHours > 0 ? Math.Round((capacity.AllocatedHours / capacity.CapacityHours) * 100, 1) : 0,
            CreatedAt = capacity.CreatedAt,
            UpdatedAt = capacity.UpdatedAt
        });
    }
}
