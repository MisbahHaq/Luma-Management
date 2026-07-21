using System.ComponentModel.DataAnnotations;
using Luma.Server.Models;

namespace Luma.Server.DTOs.Tasks;

public class BulkTaskIdsDto
{
    [Required]
    public List<Guid> TaskIds { get; set; } = new();
}

public class BulkStatusDto : BulkTaskIdsDto
{
    [Required]
    public Models.TaskStatus Status { get; set; }
}

public class BulkPriorityDto : BulkTaskIdsDto
{
    [Required]
    public Models.TaskPriority Priority { get; set; }
}

public class BulkAssigneeDto : BulkTaskIdsDto
{
    public string? AssigneeId { get; set; }
}

public class BulkResultDto
{
    public int Succeeded { get; set; }
    public int Failed { get; set; }
    public List<string> Errors { get; set; } = new();
}
