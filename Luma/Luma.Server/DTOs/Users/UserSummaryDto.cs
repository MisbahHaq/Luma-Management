using Luma.Server.Models;

namespace Luma.Server.DTOs.Users;

public class UserSummaryDto
{
    public string Id { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public UserRole Role { get; set; }
}
