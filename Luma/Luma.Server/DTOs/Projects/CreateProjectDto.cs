using System.ComponentModel.DataAnnotations;

namespace Luma.Server.DTOs.Projects;

public class CreateProjectDto
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }
}
