namespace Luma.Server.Services;

public class SsoOptions
{
    public string Authority { get; set; } = string.Empty;
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string CallbackPath { get; set; } = "/api/sso/callback";
    public string[] Scopes { get; set; } = Array.Empty<string>();
}
