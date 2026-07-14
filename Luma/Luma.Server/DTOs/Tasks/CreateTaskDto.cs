using TaskStatus = Luma.Server.Models.TaskStatus;
using TaskPriority = Luma.Server.Models.TaskPriority;
using System.ComponentModel.DataAnnotations;

namespace Luma.Server.DTOs.Tasks;

public class CreateTaskDto
{
    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(4000)]
    public string? Description { get; set; }

    public TaskStatus Status { get; set; } = TaskStatus.ToDo;

    public TaskPriority Priority { get; set; } = TaskPriority.Medium;

    public DateTime? DueDate { get; set; }

    [Required]
    public Guid ProjectId { get; set; }

    public string? AssigneeId { get; set; }
}
