using System.ComponentModel.DataAnnotations;

namespace Luma.Server.DTOs.Projects;

public class UpdateIssueKeyPrefixDto
{
    [Required, MaxLength(10)]
    public string Prefix { get; set; } = string.Empty;
}
