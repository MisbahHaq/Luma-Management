using System.ComponentModel.DataAnnotations;

namespace Luma.Server.DTOs.Labels;

public class LabelDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public Guid ProjectId { get; set; }
}

public class CreateLabelDto
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(7)]
    public string Color { get; set; } = string.Empty;
}

public class UpdateLabelDto
{
    [MaxLength(100)]
    public string? Name { get; set; }

    [MaxLength(7)]
    public string? Color { get; set; }
}
