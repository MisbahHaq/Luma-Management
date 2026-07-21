namespace Luma.Server.Services;

public class GitHubOptions
{
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string CallbackPath { get; set; } = "/api/github/callback";
}
