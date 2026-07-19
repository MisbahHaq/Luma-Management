using Luma.Server.Data;
using Luma.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace Luma.Server.Services;

public class ActivityService
{
    private readonly AppDbContext _context;

    public ActivityService(AppDbContext context)
    {
        _context = context;
    }

    public async Task LogAsync(
        ActivityAction action,
        string description,
        string actorId,
        Guid? projectId = null,
        Guid? taskId = null,
        CancellationToken ct = default)
    {
        _context.ActivityLogs.Add(new ActivityLog
        {
            Action = action,
            Description = description,
            ActorId = actorId,
            ProjectId = projectId,
            TaskId = taskId
        });
        await _context.SaveChangesAsync(ct);
    }
}
