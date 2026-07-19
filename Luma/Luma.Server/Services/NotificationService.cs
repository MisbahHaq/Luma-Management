using Luma.Server.Data;
using Luma.Server.Hubs;
using Luma.Server.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Luma.Server.Services;

public class NotificationService
{
    private readonly AppDbContext _context;
    private readonly IEmailService _email;
    private readonly IHubContext<NotificationHub> _hub;

    public NotificationService(
        AppDbContext context,
        IEmailService email,
        IHubContext<NotificationHub> hub)
    {
        _context = context;
        _email = email;
        _hub = hub;
    }

    public async Task NotifyAsync(
        NotificationType type,
        string message,
        string recipientId,
        Guid? projectId = null,
        Guid? taskId = null,
        string? link = null,
        bool sendEmail = false,
        CancellationToken ct = default)
    {
        var notification = new Notification
        {
            Type = type,
            Message = message,
            RecipientId = recipientId,
            ProjectId = projectId,
            TaskId = taskId,
            Link = link
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync(ct);

        var payload = new NotificationDto
        {
            Id = notification.Id,
            Type = notification.Type.ToString(),
            Message = notification.Message,
            Link = notification.Link,
            CreatedAt = notification.CreatedAt,
            IsRead = notification.IsRead,
            ProjectId = notification.ProjectId,
            TaskId = notification.TaskId
        };

        await _hub.Clients.User(recipientId).SendAsync("ReceiveNotification", payload, ct);

        if (sendEmail)
        {
            var user = await _context.Users.FindAsync(new object[] { recipientId }, ct);
            if (user?.Email is not null)
            {
                await _email.SendAsync(user.Email, "Luma notification", $"<p>{message}</p>", ct);
                notification.EmailSent = true;
                await _context.SaveChangesAsync(ct);
            }
        }
    }

    public async Task NotifyProjectAsync(
        NotificationType type,
        string message,
        Guid projectId,
        Guid? excludeUserId = null,
        Guid? taskId = null,
        string? link = null,
        bool sendEmail = false,
        CancellationToken ct = default)
    {
        var excludeId = excludeUserId?.ToString() ?? string.Empty;
        var memberIds = await _context.ProjectMembers
            .Where(m => m.ProjectId == projectId && m.UserId != excludeId)
            .Select(m => m.UserId)
            .ToListAsync(ct);

        foreach (var userId in memberIds)
        {
            await NotifyAsync(type, message, userId, projectId, taskId, link, sendEmail, ct);
        }
    }
}

public class NotificationDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? Link { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsRead { get; set; }
    public Guid? ProjectId { get; set; }
    public Guid? TaskId { get; set; }
}
