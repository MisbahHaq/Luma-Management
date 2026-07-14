using Microsoft.AspNetCore.Identity;

namespace Luma.Server.Models;

public class ApplicationUser : IdentityUser
{
    public string? FullName { get; set; }

    public UserRole Role { get; set; } = UserRole.Member;
}
