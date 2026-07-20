using Luma.Server.Data;
using Luma.Server.DTOs.BackgroundJobs;
using Luma.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Luma.Server.Controllers;

[ApiController]
[Route("api/jobs")]
[Authorize]
public class BackgroundJobsController : ControllerBase
{
    private readonly AppDbContext _context;

    public BackgroundJobsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<BackgroundJobResponseDto>>> GetAll([FromQuery] Guid? tenantId, [FromQuery] JobStatus? status)
    {
        var query = _context.BackgroundJobs.AsQueryable();

        if (tenantId.HasValue)
        {
            query = query.Where(j => j.TenantId == tenantId.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(j => j.Status == status.Value);
        }

        var jobs = await query
            .OrderByDescending(j => j.CreatedAt)
            .Select(j => new BackgroundJobResponseDto
            {
                Id = j.Id,
                TenantId = j.TenantId,
                Type = j.Type,
                Status = j.Status,
                Priority = j.Priority,
                Attempts = j.Attempts,
                MaxAttempts = j.MaxAttempts,
                NextAttemptAt = j.NextAttemptAt,
                CreatedAt = j.CreatedAt,
                StartedAt = j.StartedAt,
                CompletedAt = j.CompletedAt,
                Error = j.Error,
                ParentJobId = j.ParentJobId
            })
            .ToListAsync();

        return Ok(jobs);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<BackgroundJobResponseDto>> Get(Guid id)
    {
        var job = await _context.BackgroundJobs.FindAsync(id);
        if (job is null)
        {
            return NotFound();
        }

        return Ok(new BackgroundJobResponseDto
        {
            Id = job.Id,
            TenantId = job.TenantId,
            Type = job.Type,
            Status = job.Status,
            Priority = job.Priority,
            Attempts = job.Attempts,
            MaxAttempts = job.MaxAttempts,
            NextAttemptAt = job.NextAttemptAt,
            CreatedAt = job.CreatedAt,
            StartedAt = job.StartedAt,
            CompletedAt = job.CompletedAt,
            Error = job.Error,
            ParentJobId = job.ParentJobId
        });
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Member")]
    public async Task<ActionResult<BackgroundJobResponseDto>> Create(CreateBackgroundJobDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var job = new BackgroundJob
        {
            TenantId = dto.TenantId,
            Type = dto.Type,
            Payload = dto.Payload,
            Priority = dto.Priority,
            MaxAttempts = dto.MaxAttempts,
            NextAttemptAt = DateTime.UtcNow,
            ParentJobId = dto.ParentJobId
        };

        _context.BackgroundJobs.Add(job);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = job.Id }, new BackgroundJobResponseDto
        {
            Id = job.Id,
            TenantId = job.TenantId,
            Type = job.Type,
            Status = job.Status,
            Priority = job.Priority,
            Attempts = job.Attempts,
            MaxAttempts = job.MaxAttempts,
            NextAttemptAt = job.NextAttemptAt,
            CreatedAt = job.CreatedAt,
            ParentJobId = job.ParentJobId
        });
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var job = await _context.BackgroundJobs.FindAsync(id);
        if (job is null)
        {
            return NotFound();
        }

        _context.BackgroundJobs.Remove(job);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
