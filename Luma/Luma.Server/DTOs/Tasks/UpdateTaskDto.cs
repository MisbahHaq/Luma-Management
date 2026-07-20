using TaskStatus = Luma.Server.Models.TaskStatus;
using TaskPriority = Luma.Server.Models.TaskPriority;
using TaskItemType = Luma.Server.Models.TaskItemType;
using System.ComponentModel.DataAnnotations;

namespace Luma.Server.DTOs.Tasks;

public class UpdateTaskDto
{
    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(4000)]
    public string? Description { get; set; }

    public TaskStatus Status { get; set; }

    public TaskPriority Priority { get; set; }

    public TaskItemType Type { get; set; } = TaskItemType.Task;

    public Guid? ParentTaskId { get; set; }

    public DateTime? DueDate { get; set; }

    public string? AssigneeId { get; set; }
}
