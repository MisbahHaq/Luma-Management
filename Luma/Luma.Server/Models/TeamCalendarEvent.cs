using System.ComponentModel.DataAnnotations;

namespace Luma.Server.Models;

public class TeamCalendarEvent
{
    public Guid Id { get; set; }

    [Required]
    public Guid CalendarId { get; set; }

    public TeamCalendar? Calendar { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    public bool IsAllDay { get; set; } = true;

    public Guid? ProjectId { get; set; }

    public Project? Project { get; set; }

    public Guid? TaskId { get; set; }

    public string? Attendees { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
