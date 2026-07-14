using Luma.Server.Models;
using System.ComponentModel.DataAnnotations;

namespace Luma.Server.DTOs.Auth;

public class RegisterDto
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, DataType(DataType.Password), MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? FullName { get; set; }

    public UserRole Role { get; set; } = UserRole.Member;
}
