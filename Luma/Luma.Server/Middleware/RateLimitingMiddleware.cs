using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Luma.Server.Middleware;

public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RateLimitingMiddleware> _logger;
    private static readonly Dictionary<string, (int Count, DateTime WindowStart)> _requests = new();
    private readonly int _limit;
    private readonly TimeSpan _window;
    private static readonly object _lock = new();

    public RateLimitingMiddleware(RequestDelegate next, ILogger<RateLimitingMiddleware> logger, IConfiguration configuration)
    {
        _next = next;
        _logger = logger;
        _limit = configuration.GetValue<int>("RateLimiting:Limit", 1000);
        _window = TimeSpan.FromMinutes(configuration.GetValue<int>("RateLimiting:WindowMinutes", 1));
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var key = GetClientKey(context);
        var now = DateTime.UtcNow;
        bool exceeded;

        lock (_lock)
        {
            if (_requests.TryGetValue(key, out var entry))
            {
                if (now - entry.WindowStart > _window)
                {
                    _requests[key] = (1, now);
                    exceeded = false;
                }
                else if (entry.Count >= _limit)
                {
                    exceeded = true;
                }
                else
                {
                    _requests[key] = (entry.Count + 1, entry.WindowStart);
                    exceeded = false;
                }
            }
            else
            {
                _requests[key] = (1, now);
                exceeded = false;
            }
        }

        if (exceeded)
        {
            context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
            context.Response.Headers["Retry-After"] = "60";
            context.Response.ContentType = "application/json";
            var body = System.Text.Json.JsonSerializer.Serialize(new { message = "Too many requests. Please try again later." });
            await context.Response.WriteAsync(body);
            return;
        }

        await _next(context);
    }

    private static string GetClientKey(HttpContext context)
    {
        if (context.Request.Headers.TryGetValue("X-Api-Key", out var apiKey) && !string.IsNullOrEmpty(apiKey))
        {
            return $"apikey:{apiKey}";
        }

        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return $"ip:{ip}";
    }
}
