using Luma.Server.Data;
using Luma.Server.DTOs.Auth;
using Luma.Server.Models;
using Luma.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Luma.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IJwtService _jwtService;
    private readonly AppDbContext _context;
    private readonly IEmailService _email;
    private readonly IConfiguration _configuration;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        IJwtService jwtService,
        AppDbContext context,
        IEmailService email,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _jwtService = jwtService;
        _context = context;
        _email = email;
        _configuration = configuration;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var user = new ApplicationUser
        {
            UserName = dto.Email,
            Email = dto.Email,
            FullName = dto.FullName,
            Role = dto.Role
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
        {
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        }

        await _userManager.AddToRoleAsync(user, dto.Role.ToString());

        return Ok(BuildResponse(user));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user is null || !await _userManager.CheckPasswordAsync(user, dto.Password))
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        return Ok(BuildResponse(user));
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user is not null)
        {
            var token = Guid.NewGuid().ToString("N");
            var expiresAt = DateTime.UtcNow.AddHours(1);

            _context.PasswordResetTokens.Add(new PasswordResetToken
            {
                Email = user.Email ?? string.Empty,
                Token = token,
                ExpiresAt = expiresAt
            });

            await _context.SaveChangesAsync();

            var frontendUrl = _configuration["Frontend:BaseUrl"] ?? "http://localhost:5173";
            var resetLink = $"{frontendUrl}/reset-password?token={token}";

            var htmlBody = $@"
                <p>Click <a href=""{resetLink}"">here</a> to reset your password.</p>
                <p>This link expires in 1 hour.</p>
                <p>If you didn't request this, you can ignore this email.</p>";

            await _email.SendAsync(user.Email ?? string.Empty, "Reset your Luma password", htmlBody);
        }

        return Ok(new { message = "If an account exists, a reset link has been sent." });
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword(ResetPasswordDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var resetToken = await _context.PasswordResetTokens
            .Where(t => t.Token == dto.Token && t.UsedAt == null)
            .OrderByDescending(t => t.CreatedAt)
            .FirstOrDefaultAsync();

        if (resetToken is null || resetToken.ExpiresAt < DateTime.UtcNow)
        {
            return BadRequest(new { message = "Invalid or expired reset token." });
        }

        var user = await _userManager.FindByEmailAsync(resetToken.Email);
        if (user is null)
        {
            return BadRequest(new { message = "Invalid or expired reset token." });
        }

        var result = await _userManager.ResetPasswordAsync(user, await _userManager.GeneratePasswordResetTokenAsync(user), dto.NewPassword);
        if (!result.Succeeded)
        {
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
        }

        resetToken.UsedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Password reset successfully." });
    }

    private AuthResponseDto BuildResponse(ApplicationUser user) => new()
    {
        Token = _jwtService.GenerateToken(user),
        User = new UserDto
        {
            Id = user.Id,
            Email = user.Email ?? string.Empty,
            FullName = user.FullName,
            Role = user.Role
        }
    };
}
