using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace Luma.Server.Services;

public class SmtpOptions
{
    public string Host { get; set; } = "localhost";
    public int Port { get; set; } = 587;
    public bool UseSsl { get; set; } = false;
    public string? UserName { get; set; }
    public string? Password { get; set; }
    public string FromEmail { get; set; } = "noreply@luma.com";
    public string FromName { get; set; } = "Luma";
}

public class SmtpEmailService : IEmailService
{
    private readonly SmtpOptions _options;

    public SmtpEmailService(IOptions<SmtpOptions> options)
    {
        _options = options.Value;
    }

    public async Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken ct = default)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_options.FromName, _options.FromEmail));
        message.To.Add(new MailboxAddress("", toEmail));
        message.Subject = subject;

        var builder = new BodyBuilder { HtmlBody = htmlBody };
        message.Body = builder.ToMessageBody();

        using var client = new SmtpClient();
        var secure = _options.UseSsl ? SecureSocketOptions.Auto : SecureSocketOptions.None;
        await client.ConnectAsync(_options.Host, _options.Port, secure, ct);
        if (!string.IsNullOrEmpty(_options.UserName))
        {
            await client.AuthenticateAsync(_options.UserName, _options.Password, ct);
        }
        await client.SendAsync(message, ct);
        await client.DisconnectAsync(true, ct);
    }
}
