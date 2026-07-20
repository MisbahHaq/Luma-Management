using System.ComponentModel.DataAnnotations;

namespace Luma.Server.Models;

public class TeamMemberCapacity
{
    public Guid Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;

    public ApplicationUser? User { get; set; }

    [Required]
    public Guid ProjectId { get; set; }

    public Project? Project { get; set; }

    [Required]
    public DateTime Date { get; set; }

    [Range(0, 24)]
    public double CapacityHours { get; set; } = 8;

    [Range(0, 24)]
    public double AllocatedHours { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
