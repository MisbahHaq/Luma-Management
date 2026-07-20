using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Luma.Server.Middleware;

public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RateLimitingMiddleware> _logger;
    private static readonly Dictionary<string, (int Count, DateTime WindowStart)> _requests = new();
    private const int Limit = 100;
    private static readonly TimeSpan Window = TimeSpan.FromMinutes(1);
    private static readonly object _lock = new();

    public RateLimitingMiddleware(RequestDelegate next, ILogger<RateLimitingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
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
                if (now - entry.WindowStart > Window)
                {
                    _requests[key] = (1, now);
                    exceeded = false;
                }
                else if (entry.Count >= Limit)
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
