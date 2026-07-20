using Luma.Server.Data;
using Luma.Server.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Luma.Server.Controllers;

[ApiController]
[Route("api/sso")]
[AllowAnonymous]
public class SsoController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly SsoOptions _options;
    private readonly IJwtService _jwt;

    public SsoController(AppDbContext context, IOptions<SsoOptions> options, IJwtService jwt)
    {
        _context = context;
        _options = options.Value;
        _jwt = jwt;
    }

    [HttpGet("login")]
    public IActionResult Login([FromQuery] string? returnUrl = "/")
    {
        if (string.IsNullOrEmpty(_options.Authority))
        {
            return BadRequest(new { message = "SSO is not configured." });
        }

        var props = new AuthenticationProperties
        {
            RedirectUri = returnUrl ?? "/",
            Items =
            {
                ["scheme"] = "OpenIdConnect"
            }
        };

        return Challenge(props, "OpenIdConnect");
    }

    [HttpGet("callback")]
    public async Task<IActionResult> Callback([FromQuery] string? returnUrl = "/")
    {
        var result = await HttpContext.AuthenticateAsync("OpenIdConnect");
        if (!result.Succeeded || result.Principal is null)
        {
            return BadRequest(new { message = "SSO authentication failed." });
        }

        var email = result.Principal.FindFirst("email")?.Value
                    ?? result.Principal.FindFirst("upn")?.Value
                    ?? string.Empty;

        var name = result.Principal.FindFirst("name")?.Value
                   ?? result.Principal.Identity?.Name
                   ?? string.Empty;

        if (string.IsNullOrEmpty(email))
        {
            return BadRequest(new { message = "SSO did not provide an email claim." });
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user is null)
        {
            return BadRequest(new { message = "No account found for this SSO identity. Contact your administrator." });
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
