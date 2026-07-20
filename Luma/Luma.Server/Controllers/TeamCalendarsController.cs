using Luma.Server.Data;
using Luma.Server.DTOs.TeamCalendars;
using Luma.Server.Models;
using Luma.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Luma.Server.Controllers;

[ApiController]
[Route("api/team-calendars")]
[Authorize]
public class TeamCalendarsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ActivityService _activity;

    public TeamCalendarsController(AppDbContext context, ActivityService activity)
    {
        _context = context;
        _activity = activity;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TeamCalendarResponseDto>>> GetAll()
    {
        var userId = GetCurrentUserId();
        var calendars = await _context.TeamCalendars
            .Include(c => c.CreatedByUser)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new TeamCalendarResponseDto
            {
                Id = c.Id,
                Name = c.Name,
                Color = c.Color,
                Description = c.Description,
                IsDefault = c.IsDefault,
                CreatedAt = c.CreatedAt,
                CreatedByUserId = c.CreatedByUserId,
                CreatedByUserFullName = c.CreatedByUser != null ? c.CreatedByUser.FullName : null,
                EventCount = c.Events.Count
            })
            .ToListAsync();

        return Ok(calendars);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TeamCalendarResponseDto>> Get(Guid id)
    {
        var calendar = await _context.TeamCalendars
            .Include(c => c.CreatedByUser)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (calendar is null)
        {
            return NotFound();
        }

        return Ok(new TeamCalendarResponseDto
        {
            Id = calendar.Id,
            Name = calendar.Name,
            Color = calendar.Color,
            Description = calendar.Description,
            IsDefault = calendar.IsDefault,
            CreatedAt = calendar.CreatedAt,
            CreatedByUserId = calendar.CreatedByUserId,
            CreatedByUserFullName = calendar.CreatedByUser?.FullName,
            EventCount = calendar.Events.Count
        });
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Member")]
    public async Task<ActionResult<TeamCalendarResponseDto>> Create(CreateTeamCalendarDto dto)
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

        var calendar = new TeamCalendar
        {
            Name = dto.Name,
            Color = dto.Color,
            Description = dto.Description,
            IsDefault = dto.IsDefault,
            CreatedByUserId = userId
        };

        _context.TeamCalendars.Add(calendar);
        if (userId is not null)
        {
            await _activity.LogAsync(ActivityAction.ProjectCreated, $"Team calendar '{calendar.Name}' was created", userId);
        }
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = calendar.Id }, new TeamCalendarResponseDto
        {
            Id = calendar.Id,
            Name = calendar.Name,
            Color = calendar.Color,
            Description = calendar.Description,
            IsDefault = calendar.IsDefault,
            CreatedAt = calendar.CreatedAt,
            CreatedByUserId = calendar.CreatedByUserId,
            EventCount = 0
        });
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> Update(Guid id, UpdateTeamCalendarDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var calendar = await _context.TeamCalendars.FindAsync(id);
        if (calendar is null)
        {
            return NotFound();
        }

        var calendarExists = await _context.TeamCalendars
            .AnyAsync(c => c.Name == dto.Name && c.Id != id);
        if (calendarExists)
        {
            return BadRequest(new { message = "Calendar with this name already exists." });
        }

        calendar.Name = dto.Name;
        calendar.Color = dto.Color;
        calendar.Description = dto.Description;

        var userId = GetCurrentUserId();
        if (userId is not null)
        {
            await _activity.LogAsync(ActivityAction.ProjectUpdated, $"Team calendar '{calendar.Name}' was updated", userId);
        }
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var calendar = await _context.TeamCalendars.FindAsync(id);
        if (calendar is null)
        {
            return NotFound();
        }

        _context.TeamCalendars.Remove(calendar);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private string? GetCurrentUserId() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
}
