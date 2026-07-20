using Luma.Server.Data;
using Luma.Server.DTOs.TeamCalendars;
using Luma.Server.Models;
using Luma.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Luma.Server.Controllers;

[ApiController]
[Route("api/team-calendars/{calendarId:guid}/events")]
[Authorize]
public class TeamCalendarEventsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ActivityService _activity;

    public TeamCalendarEventsController(AppDbContext context, ActivityService activity)
    {
        _context = context;
        _activity = activity;
    }

    [HttpGet]
    public async Task<ActionResult<Luma.Server.DTOs.Common.PagedResult<TeamCalendarEventResponseDto>>> GetAll(Guid calendarId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var calendar = await _context.TeamCalendars.FindAsync(calendarId);
        if (calendar is null)
        {
            return NotFound();
        }

        var query = _context.TeamCalendarEvents
            .Where(e => e.CalendarId == calendarId)
            .Include(e => e.Project)
            .OrderByDescending(e => e.StartDate);

        var total = await query.CountAsync();

        var events = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new TeamCalendarEventResponseDto
            {
                Id = e.Id,
                CalendarId = e.CalendarId,
                CalendarName = calendar.Name,
                Title = e.Title,
                Description = e.Description,
                StartDate = e.StartDate,
                EndDate = e.EndDate,
                IsAllDay = e.IsAllDay,
                ProjectId = e.ProjectId,
                ProjectName = e.Project != null ? e.Project.Name : null,
                TaskId = e.TaskId,
                Attendees = e.Attendees,
                CreatedAt = e.CreatedAt,
                UpdatedAt = e.UpdatedAt
            })
            .ToListAsync();

        return Ok(new Luma.Server.DTOs.Common.PagedResult<TeamCalendarEventResponseDto>
        {
            Items = events,
            Total = total,
            Page = page,
            PageSize = pageSize
        });
    }

    [HttpGet("range")]
    public async Task<ActionResult<IEnumerable<TeamCalendarEventResponseDto>>> GetRange(Guid calendarId, [FromQuery] DateTime start, [FromQuery] DateTime end)
    {
        var calendar = await _context.TeamCalendars.FindAsync(calendarId);
        if (calendar is null)
        {
            return NotFound();
        }

        var events = await _context.TeamCalendarEvents
            .Where(e => e.CalendarId == calendarId && e.StartDate >= start && e.EndDate <= end)
            .Include(e => e.Project)
            .OrderBy(e => e.StartDate)
            .Select(e => new TeamCalendarEventResponseDto
            {
                Id = e.Id,
                CalendarId = e.CalendarId,
                CalendarName = calendar.Name,
                Title = e.Title,
                Description = e.Description,
                StartDate = e.StartDate,
                EndDate = e.EndDate,
                IsAllDay = e.IsAllDay,
                ProjectId = e.ProjectId,
                ProjectName = e.Project != null ? e.Project.Name : null,
                TaskId = e.TaskId,
                Attendees = e.Attendees,
                CreatedAt = e.CreatedAt,
                UpdatedAt = e.UpdatedAt
            })
            .ToListAsync();

        return Ok(events);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Member")]
    public async Task<ActionResult<TeamCalendarEventResponseDto>> Create(Guid calendarId, CreateTeamCalendarEventDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var calendar = await _context.TeamCalendars.FindAsync(calendarId);
        if (calendar is null)
        {
            return NotFound();
        }

        if (dto.ProjectId.HasValue)
        {
            var project = await _context.Projects.FindAsync(dto.ProjectId.Value);
            if (project is null)
            {
                return BadRequest(new { message = "Project not found." });
            }
        }

        var evt = new TeamCalendarEvent
        {
            CalendarId = calendarId,
            Title = dto.Title,
            Description = dto.Description,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            IsAllDay = dto.IsAllDay,
            ProjectId = dto.ProjectId,
            TaskId = dto.TaskId,
            Attendees = dto.Attendees
        };

        _context.TeamCalendarEvents.Add(evt);
        var userId = GetCurrentUserId();
        if (userId is not null)
        {
            await _activity.LogAsync(ActivityAction.ProjectUpdated, $"Event '{evt.Title}' created in calendar", userId);
        }
        await _context.SaveChangesAsync();

        var createdEvent = await _context.TeamCalendarEvents
            .Include(e => e.Project)
            .FirstAsync(e => e.Id == evt.Id);

        return CreatedAtAction(nameof(GetById), new { calendarId, id = evt.Id }, new TeamCalendarEventResponseDto
        {
            Id = createdEvent.Id,
            CalendarId = createdEvent.CalendarId,
            CalendarName = calendar.Name,
            Title = createdEvent.Title,
            Description = createdEvent.Description,
            StartDate = createdEvent.StartDate,
            EndDate = createdEvent.EndDate,
            IsAllDay = createdEvent.IsAllDay,
            ProjectId = createdEvent.ProjectId,
            ProjectName = createdEvent.Project?.Name,
            TaskId = createdEvent.TaskId,
            Attendees = createdEvent.Attendees,
            CreatedAt = createdEvent.CreatedAt,
            UpdatedAt = createdEvent.UpdatedAt
        });
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TeamCalendarEventResponseDto>> GetById(Guid calendarId, Guid id)
    {
        var calendar = await _context.TeamCalendars.FindAsync(calendarId);
        if (calendar is null)
        {
            return NotFound();
        }

        var evt = await _context.TeamCalendarEvents
            .Include(e => e.Project)
            .FirstOrDefaultAsync(e => e.Id == id && e.CalendarId == calendarId);

        if (evt is null)
        {
            return NotFound();
        }

        return Ok(new TeamCalendarEventResponseDto
        {
            Id = evt.Id,
            CalendarId = evt.CalendarId,
            CalendarName = calendar.Name,
            Title = evt.Title,
            Description = evt.Description,
            StartDate = evt.StartDate,
            EndDate = evt.EndDate,
            IsAllDay = evt.IsAllDay,
            ProjectId = evt.ProjectId,
            ProjectName = evt.Project?.Name,
            TaskId = evt.TaskId,
            Attendees = evt.Attendees,
            CreatedAt = evt.CreatedAt,
            UpdatedAt = evt.UpdatedAt
        });
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> Update(Guid calendarId, Guid id, UpdateTeamCalendarEventDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var calendar = await _context.TeamCalendars.FindAsync(calendarId);
        if (calendar is null)
        {
            return NotFound();
        }

        var evt = await _context.TeamCalendarEvents
            .FirstOrDefaultAsync(e => e.Id == id && e.CalendarId == calendarId);

        if (evt is null)
        {
            return NotFound();
        }

        if (dto.ProjectId.HasValue)
        {
            var project = await _context.Projects.FindAsync(dto.ProjectId.Value);
            if (project is null)
            {
                return BadRequest(new { message = "Project not found." });
            }
        }

        evt.Title = dto.Title;
        evt.Description = dto.Description;
        evt.StartDate = dto.StartDate;
        evt.EndDate = dto.EndDate;
        evt.IsAllDay = dto.IsAllDay;
        evt.ProjectId = dto.ProjectId;
        evt.TaskId = dto.TaskId;
        evt.Attendees = dto.Attendees;
        evt.UpdatedAt = DateTime.UtcNow;

        var userId = GetCurrentUserId();
        if (userId is not null)
        {
            await _activity.LogAsync(ActivityAction.ProjectUpdated, $"Event '{evt.Title}' updated", userId);
        }
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin,Member")]
    public async Task<IActionResult> Delete(Guid calendarId, Guid id)
    {
        var evt = await _context.TeamCalendarEvents
            .FirstOrDefaultAsync(e => e.Id == id && e.CalendarId == calendarId);

        if (evt is null)
        {
            return NotFound();
        }

        _context.TeamCalendarEvents.Remove(evt);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private string? GetCurrentUserId() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
}
