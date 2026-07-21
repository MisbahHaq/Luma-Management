using System.ComponentModel.DataAnnotations;
using Luma.Server.Models;

namespace Luma.Server.DTOs.Workspaces;

public class CreateWorkspaceDto
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Slug { get; set; }
}

public class UpdateWorkspaceDto
{
    [MaxLength(200)]
    public string? Name { get; set; }
}

public class AddWorkspaceMemberDto
{
    [Required]
    public string UserId { get; set; } = string.Empty;

    [Required]
    public WorkspaceRole Role { get; set; } = WorkspaceRole.Member;
}

public class WorkspaceResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public Guid TenantId { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedByUserId { get; set; } = string.Empty;
    public string? CreatedByUserFullName { get; set; }
    public int MemberCount { get; set; }
    public int ProjectCount { get; set; }
}

public class WorkspaceMemberSummaryDto
{
    public string UserId { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public Models.WorkspaceRole Role { get; set; }
    public DateTime AddedAt { get; set; }
}
