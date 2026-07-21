namespace Luma.Server.DTOs.Search;

public class SearchProjectResultDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int TaskCount { get; set; }
}

public class SearchTaskResultDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? AssigneeFullName { get; set; }
}

public class SearchResponseDto
{
    public string Query { get; set; } = string.Empty;
    public List<SearchProjectResultDto> Projects { get; set; } = new();
    public List<SearchTaskResultDto> Tasks { get; set; } = new();
}
