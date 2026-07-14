using Luma.Server.Data;
using Luma.Server.DTOs.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Luma.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Member")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;

    public UsersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserSummaryDto>>> GetAll()
    {
        var users = await _context.Users
            .OrderBy(u => u.FullName)
            .Select(u => new UserSummaryDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                Role = u.Role
            })
            .ToListAsync();

        return Ok(users);
    }
}
