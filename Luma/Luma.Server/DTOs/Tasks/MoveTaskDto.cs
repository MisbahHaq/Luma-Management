using TaskStatus = Luma.Server.Models.TaskStatus;

namespace Luma.Server.DTOs.Tasks;

public class MoveTaskDto
{
    public TaskStatus Status { get; set; }
}
