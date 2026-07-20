using Luma.Server.Models;

namespace Luma.Server.DTOs.Projects;

public class AddMemberDto
{
    public string UserId { get; set; } = string.Empty;

    public ProjectRole Role { get; set; } = ProjectRole.Editor;
}
