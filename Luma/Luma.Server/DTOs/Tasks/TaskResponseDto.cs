using TaskStatus = Luma.Server.Models.TaskStatus;
using TaskPriority = Luma.Server.Models.TaskPriority;
using TaskItemType = Luma.Server.Models.TaskItemType;

namespace Luma.Server.DTOs.Tasks;

public class TaskResponseDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TaskStatus Status { get; set; }
    public TaskPriority Priority { get; set; }
    public TaskItemType Type { get; set; }
    public Guid? ParentTaskId { get; set; }
    public DateTime? DueDate { get; set; }
    public Guid ProjectId { get; set; }
    public Guid? SprintId { get; set; }
    public string? AssigneeId { get; set; }
    public string? AssigneeFullName { get; set; }
    public DateTime CreatedAt { get; set; }
}
