using System.ComponentModel.DataAnnotations;

namespace Luma.Server.DTOs.TeamCalendars;

public class CreateTeamCalendarDto
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(7)]
    public string? Color { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    public bool IsDefault { get; set; } = false;
}

public class UpdateTeamCalendarDto
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(7)]
    public string? Color { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }
}

public class TeamCalendarResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Color { get; set; }
    public string? Description { get; set; }
    public bool IsDefault { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedByUserId { get; set; } = string.Empty;
    public string? CreatedByUserFullName { get; set; }
    public int EventCount { get; set; }
}

public class CreateTeamCalendarEventDto
{
    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    public bool IsAllDay { get; set; } = true;

    public Guid? ProjectId { get; set; }

    public Guid? TaskId { get; set; }

    public string? Attendees { get; set; }
}

public class UpdateTeamCalendarEventDto
{
    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    public bool IsAllDay { get; set; } = true;

    public Guid? ProjectId { get; set; }

    public Guid? TaskId { get; set; }

    public string? Attendees { get; set; }
}

public class TeamCalendarEventResponseDto
{
    public Guid Id { get; set; }
    public Guid CalendarId { get; set; }
    public string CalendarName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsAllDay { get; set; }
    public Guid? ProjectId { get; set; }
    public string? ProjectName { get; set; }
    public Guid? TaskId { get; set; }
    public string? TaskTitle { get; set; }
    public string? Attendees { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
