using Microsoft.Extensions.Options;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace Luma.Server.Services;

public class SendGridOptions
{
    public string ApiKey { get; set; } = string.Empty;
    public string FromEmail { get; set; } = "noreply@luma.com";
    public string FromName { get; set; } = "Luma";
}

public class SendGridEmailService : IEmailService
{
    private readonly ISendGridClient _client;
    private readonly string _fromEmail;
    private readonly string _fromName;

    public SendGridEmailService(IOptions<SendGridOptions> options)
    {
        var o = options.Value;
        _client = new SendGridClient(o.ApiKey);
        _fromEmail = o.FromEmail;
        _fromName = o.FromName;
    }

    public async Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken ct = default)
    {
        var from = new EmailAddress(_fromEmail, _fromName);
        var to = new EmailAddress(toEmail);
        var msg = MailHelper.CreateSingleEmail(from, to, subject, null, htmlBody);
        await _client.SendEmailAsync(msg, ct);
    }
}
