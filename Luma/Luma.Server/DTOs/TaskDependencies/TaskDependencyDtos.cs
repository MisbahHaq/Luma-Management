using Luma.Server.Models;
using System.ComponentModel.DataAnnotations;

namespace Luma.Server.DTOs.TaskDependencies;

public class CreateTaskDependencyDto
{
    [Required]
    public Guid TaskId { get; set; }

    [Required]
    public Guid DependsOnTaskId { get; set; }

    public DependencyType Type { get; set; } = DependencyType.BlockedBy;
}

public class TaskDependencyResponseDto
{
    public Guid Id { get; set; }
    public Guid TaskId { get; set; }
    public string TaskTitle { get; set; } = string.Empty;
    public Guid DependsOnTaskId { get; set; }
    public string DependsOnTaskTitle { get; set; } = string.Empty;
    public DependencyType Type { get; set; }
    public Guid ProjectId { get; set; }
}
