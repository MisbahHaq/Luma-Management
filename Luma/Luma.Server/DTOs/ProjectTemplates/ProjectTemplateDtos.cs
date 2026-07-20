using Luma.Server.Models;
using System.ComponentModel.DataAnnotations;

namespace Luma.Server.DTOs.ProjectTemplates;

public class CreateProjectTemplateDto
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [MaxLength(500)]
    public string? Icon { get; set; }

    [MaxLength(100)]
    public string? Category { get; set; }

    public bool IsPublic { get; set; } = false;

    public List<CreateProjectTemplateTaskDto> Tasks { get; set; } = new();
}

public class UpdateProjectTemplateDto
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [MaxLength(500)]
    public string? Icon { get; set; }

    [MaxLength(100)]
    public string? Category { get; set; }

    public bool IsPublic { get; set; } = false;

    public List<CreateProjectTemplateTaskDto> Tasks { get; set; } = new();
}

public class CreateProjectTemplateTaskDto
{
    public Guid Id { get; set; }

    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(4000)]
    public string? Description { get; set; }

    public TaskPriority Priority { get; set; } = TaskPriority.Medium;

    public int SortOrder { get; set; } = 0;

    public Guid? ParentTemplateTaskId { get; set; }
}

public class ProjectTemplateResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public string? Category { get; set; }
    public bool IsPublic { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedByUserId { get; set; } = string.Empty;
    public string? CreatedByUserFullName { get; set; }
    public List<ProjectTemplateTaskResponseDto> Tasks { get; set; } = new();
}

public class ProjectTemplateTaskResponseDto
{
    public Guid Id { get; set; }
    public Guid TemplateId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TaskPriority Priority { get; set; }
    public int SortOrder { get; set; }
    public Guid? ParentTemplateTaskId { get; set; }
}

public class CreateProjectFromTemplateDto
{
    [Required]
    public Guid TemplateId { get; set; }

    [Required, MaxLength(200)]
    public string ProjectName { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? ProjectDescription { get; set; }
}
