using Luma.Server.Data;
using Luma.Server.DTOs.Tenants;
using Luma.Server.Models;
using Luma.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Luma.Server.Controllers;

[ApiController]
[Route("api/tenants")]
[Authorize(Roles = "Admin")]
public class TenantsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ActivityService _activity;

    public TenantsController(AppDbContext context, ActivityService activity)
    {
        _context = context;
        _activity = activity;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TenantResponseDto>>> GetAll()
    {
        var tenants = await _context.Tenants
            .Include(t => t.CreatedByUser)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new TenantResponseDto
            {
                Id = t.Id,
                Name = t.Name,
                Slug = t.Slug,
                IsActive = t.IsActive,
                CreatedAt = t.CreatedAt,
                CreatedByUserId = t.CreatedByUserId,
                CreatedByUserFullName = t.CreatedByUser != null ? t.CreatedByUser.FullName : null
            })
            .ToListAsync();

        return Ok(tenants);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TenantResponseDto>> Get(Guid id)
    {
        var tenant = await _context.Tenants
            .Include(t => t.CreatedByUser)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (tenant is null)
        {
            return NotFound();
        }

        return Ok(new TenantResponseDto
        {
            Id = tenant.Id,
            Name = tenant.Name,
            Slug = tenant.Slug,
            IsActive = tenant.IsActive,
            CreatedAt = tenant.CreatedAt,
            CreatedByUserId = tenant.CreatedByUserId,
            CreatedByUserFullName = tenant.CreatedByUser?.FullName
        });
    }

    [HttpPost]
    public async Task<ActionResult<TenantResponseDto>> Create(CreateTenantDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var existing = await _context.Tenants.AnyAsync(t => t.Slug == dto.Slug);
        if (existing)
        {
            return BadRequest(new { message = "Tenant slug already exists." });
        }

        var tenant = new Tenant
        {
            Name = dto.Name,
            Slug = dto.Slug,
            CreatedByUserId = userId
        };

        _context.Tenants.Add(tenant);
        await _context.SaveChangesAsync();

        await _activity.LogAsync(ActivityAction.ProjectCreated, $"Tenant '{tenant.Name}' was created", userId);

        return CreatedAtAction(nameof(Get), new { id = tenant.Id }, new TenantResponseDto
        {
            Id = tenant.Id,
            Name = tenant.Name,
            Slug = tenant.Slug,
            IsActive = tenant.IsActive,
            CreatedAt = tenant.CreatedAt,
            CreatedByUserId = tenant.CreatedByUserId
        });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateTenantDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var tenant = await _context.Tenants.FindAsync(id);
        if (tenant is null)
        {
            return NotFound();
        }

        var slugExists = await _context.Tenants.AnyAsync(t => t.Slug == dto.Slug && t.Id != id);
        if (slugExists)
        {
            return BadRequest(new { message = "Tenant slug already exists." });
        }

        tenant.Name = dto.Name;
        tenant.Slug = dto.Slug;
        tenant.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var tenant = await _context.Tenants.FindAsync(id);
        if (tenant is null)
        {
            return NotFound();
        }

        _context.Tenants.Remove(tenant);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private string? GetCurrentUserId() =>
        User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
}
