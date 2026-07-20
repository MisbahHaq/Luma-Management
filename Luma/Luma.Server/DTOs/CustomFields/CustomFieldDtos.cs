using System.ComponentModel.DataAnnotations;

namespace Luma.Server.DTOs.CustomFields;

public class CreateProjectCustomFieldDto
{
    [Required]
    public Guid ProjectId { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string FieldType { get; set; } = "Text";

    public bool IsRequired { get; set; } = false;

    public string? Options { get; set; }

    public int SortOrder { get; set; } = 0;
}

public class UpdateProjectCustomFieldDto
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string FieldType { get; set; } = "Text";

    public bool IsRequired { get; set; } = false;

    public string? Options { get; set; }

    public int SortOrder { get; set; } = 0;

    public bool IsActive { get; set; } = true;
}

public class ProjectCustomFieldResponseDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string FieldType { get; set; } = "Text";
    public bool IsRequired { get; set; }
    public string? Options { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateProjectCustomFieldValueDto
{
    [Required]
    public Guid CustomFieldId { get; set; }

    [Required]
    public Guid TaskId { get; set; }

    public string? Value { get; set; }
}

public class ProjectCustomFieldValueResponseDto
{
    public Guid Id { get; set; }
    public Guid CustomFieldId { get; set; }
    public string CustomFieldName { get; set; } = string.Empty;
    public string CustomFieldType { get; set; } = "Text";
    public Guid TaskId { get; set; }
    public string? Value { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
