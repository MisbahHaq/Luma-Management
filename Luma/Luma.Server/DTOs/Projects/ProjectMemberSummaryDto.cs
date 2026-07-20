using Luma.Server.Models;

namespace Luma.Server.DTOs.Projects;

public class ProjectMemberSummaryDto
{
    public string Id { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public UserRole GlobalRole { get; set; }
    public ProjectRole ProjectRole { get; set; }
}
