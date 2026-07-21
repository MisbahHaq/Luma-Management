using Luma.Server.Data;
using Luma.Server.DTOs.Search;
using Luma.Server.Models;
using Luma.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Luma.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SearchController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ProjectAuthorizationService _authz;

    public SearchController(AppDbContext context, ProjectAuthorizationService authz)
    {
        _context = context;
        _authz = authz;
    }

    [HttpGet]
    public async Task<ActionResult<SearchResponseDto>> Search(
        [FromQuery] string q,
        [FromQuery] Guid? projectId,
        [FromQuery] string? type)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var globalRole = GetCurrentUserRole();
        var query = (q ?? string.Empty).Trim();

        if (query.Length == 0 && !projectId.HasValue)
        {
            return Ok(new SearchResponseDto { Query = query });
        }

        var pattern = $"%{query}%";

        var accessibleProjectIds = await GetAccessibleProjectIdsAsync(userId, globalRole);

        var response = new SearchResponseDto { Query = query };

        var searchProjects = string.IsNullOrEmpty(type) || type == "project";
        var searchTasks = string.IsNullOrEmpty(type) || type == "task";

        if (searchProjects)
        {
            var projectQuery = _context.Projects
                .Where(p => accessibleProjectIds.Contains(p.Id))
                .Where(p => EF.Functions.Like(p.Name, pattern) || EF.Functions.Like(p.Description, pattern))
                .OrderByDescending(p => p.CreatedAt)
                .Take(20)
                .Select(p => new SearchProjectResultDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    TaskCount = p.Tasks.Count
                });

            response.Projects = await projectQuery.ToListAsync();
        }

        if (searchTasks)
        {
            var taskQuery = _context.Tasks
                .Where(t => accessibleProjectIds.Contains(t.ProjectId))
                .Where(t => EF.Functions.Like(t.Title, pattern) || EF.Functions.Like(t.Description, pattern))
                .OrderByDescending(t => t.CreatedAt)
                .Take(20)
                .Select(t => new SearchTaskResultDto
                {
                    Id = t.Id,
                    Title = t.Title,
                    Description = t.Description,
                    ProjectId = t.ProjectId,
                    ProjectName = t.Project != null ? t.Project.Name : string.Empty,
                    Status = t.Status.ToString(),
                    AssigneeFullName = t.Assignee != null ? t.Assignee.FullName : null,
                    IssueKey = (t.Project != null ? t.Project.IssueKeyPrefix : "ISS") + "-" + t.IssueNumber
                });

            response.Tasks = await taskQuery.ToListAsync();
        }

        return Ok(response);
    }

    private async Task<List<Guid>> GetAccessibleProjectIdsAsync(string userId, string? globalRole)
    {
        if (_authz.IsGlobalAdmin(globalRole))
        {
            return await _context.Projects
                .Select(p => p.Id)
                .ToListAsync();
        }

        return await _context.ProjectMembers
            .Where(m => m.UserId == userId)
            .Select(m => m.ProjectId)
            .ToListAsync();
    }

    private string? GetCurrentUserId() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

    private string? GetCurrentUserRole() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
}
