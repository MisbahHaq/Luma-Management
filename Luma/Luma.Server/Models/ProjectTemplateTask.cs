using System.ComponentModel.DataAnnotations;

namespace Luma.Server.Models;

public class ProjectTemplateTask
{
    public Guid Id { get; set; }

    [Required]
    public Guid TemplateId { get; set; }

    public ProjectTemplate? Template { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(4000)]
    public string? Description { get; set; }

    public TaskPriority Priority { get; set; } = TaskPriority.Medium;

    public int SortOrder { get; set; } = 0;

    public Guid? ParentTemplateTaskId { get; set; }

    public ProjectTemplateTask? ParentTemplateTask { get; set; }

    public ICollection<ProjectTemplateTask> Children { get; set; } = new List<ProjectTemplateTask>();
}
