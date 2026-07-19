namespace Luma.Server.Services;

public interface IEmailService
{
    Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken ct = default);
}

public class NullEmailService : IEmailService
{
    public Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken ct = default) =>
        Task.CompletedTask;
}
