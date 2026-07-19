namespace Luma.Server.DTOs.Activity;

public class ActivityLogResponseDto
{
    public Guid Id { get; set; }
    public string Action { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Guid? ProjectId { get; set; }
    public Guid? TaskId { get; set; }
    public string ActorId { get; set; } = string.Empty;
    public string? ActorFullName { get; set; }
    public DateTime CreatedAt { get; set; }
}
