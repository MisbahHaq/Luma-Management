using Luma.Server.Data;
using Luma.Server.Models;
using Luma.Server.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Luma.Server.Controllers;

[ApiController]
[Route("api/github")]
[AllowAnonymous]
public class GitHubOAuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly GitHubOptions _options;
    private readonly IJwtService _jwt;

    public GitHubOAuthController(AppDbContext context, UserManager<ApplicationUser> userManager, IOptions<GitHubOptions> options, IJwtService jwt)
    {
        _context = context;
        _userManager = userManager;
        _options = options.Value;
        _jwt = jwt;
    }

    [HttpGet("login")]
    public IActionResult Login([FromQuery] string? returnUrl = "/")
    {
        if (string.IsNullOrEmpty(_options.ClientId))
        {
            return BadRequest(new { message = "GitHub OAuth is not configured." });
        }

        var props = new AuthenticationProperties
        {
            RedirectUri = Url.Action("Callback", "GitHubOAuth", new { returnUrl }) ?? "/",
            Items =
            {
                ["scheme"] = "GitHub"
            }
        };

        return Challenge(props, "GitHub");
    }

    [HttpGet("callback")]
    public async Task<IActionResult> Callback([FromQuery] string? returnUrl = "/")
    {
        var result = await HttpContext.AuthenticateAsync("GitHub");
        if (!result.Succeeded || result.Principal is null)
        {
            return BadRequest(new { message = "GitHub authentication failed." });
        }

        var email = result.Principal.FindFirst("email")?.Value ?? string.Empty;
        var name = result.Principal.FindFirst("name")?.Value ?? string.Empty;
        var login = result.Principal.FindFirst("login")?.Value ?? string.Empty;

        if (string.IsNullOrEmpty(email))
        {
            return BadRequest(new { message = "GitHub did not provide an email. Ensure your GitHub account has a public email." });
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user is null)
        {
            user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                FullName = string.IsNullOrWhiteSpace(name) ? login : name,
                Role = UserRole.Member,
                EmailConfirmed = true
            };

            var createResult = await _userManager.CreateAsync(user);
            if (!createResult.Succeeded)
            {
                return BadRequest(new { message = "Failed to create account.", errors = createResult.Errors });
            }
        }
        else
        {
            if (string.IsNullOrWhiteSpace(user.FullName))
            {
                user.FullName = string.IsNullOrWhiteSpace(name) ? login : name;
                await _context.SaveChangesAsync();
            }
        }

        var token = _jwt.GenerateToken(user);
        return Ok(new
        {
            token,
            user = new
            {
                user.Id,
                user.Email,
                user.FullName,
                Role = user.Role.ToString()
            }
        });
    }
}
