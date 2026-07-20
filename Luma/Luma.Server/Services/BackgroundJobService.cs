using System.Threading.Channels;
using Luma.Server.Data;
using Luma.Server.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Luma.Server.Services;

public class BackgroundJobService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<BackgroundJobService> _logger;
    private readonly Channel<BackgroundJob> _queue;
    private const int MaxConcurrency = 4;

    public BackgroundJobService(IServiceProvider services, ILogger<BackgroundJobService> logger)
    {
        _services = services;
        _logger = logger;

        var options = new BoundedChannelOptions(1000)
        {
            FullMode = BoundedChannelFullMode.Wait,
            SingleWriter = false,
            SingleReader = false
        };

        _queue = Channel.CreateBounded<BackgroundJob>(options);
    }

    public async Task EnqueueAsync(BackgroundJob job, CancellationToken cancellationToken = default)
    {
        await _queue.Writer.WriteAsync(job, cancellationToken);
        _logger.LogInformation("Enqueued job {JobId} of type {JobType}", job.Id, job.Type);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Background job service started.");

        var workers = Enumerable.Range(0, MaxConcurrency)
            .Select(_ => ProcessQueueAsync(stoppingToken))
            .ToArray();

        await Task.WhenAll(workers);
    }

    private async Task ProcessQueueAsync(CancellationToken cancellationToken)
    {
        await foreach (var job in _queue.Reader.ReadAllAsync(cancellationToken))
        {
            await ProcessJobAsync(job, cancellationToken);
        }
    }

    private async Task ProcessJobAsync(BackgroundJob job, CancellationToken cancellationToken)
    {
        using var scope = _services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var dbJob = await db.BackgroundJobs.FirstOrDefaultAsync(j => j.Id == job.Id, cancellationToken);
        if (dbJob is null) return;

        dbJob.Status = JobStatus.Processing;
        dbJob.StartedAt = DateTime.UtcNow;
        dbJob.LockedUntil = DateTime.UtcNow.AddMinutes(5);
        await db.SaveChangesAsync(cancellationToken);

        try
        {
            _logger.LogInformation("Processing job {JobId} of type {JobType}", job.Id, job.Type);
            await OnProcessAsync(dbJob, cancellationToken);

            dbJob.Status = JobStatus.Completed;
            dbJob.CompletedAt = DateTime.UtcNow;
            dbJob.Error = null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Job {JobId} failed on attempt {Attempt}", job.Id, dbJob.Attempts + 1);

            dbJob.Attempts++;
            dbJob.Error = ex.Message;

            if (dbJob.Attempts >= dbJob.MaxAttempts)
            {
                dbJob.Status = JobStatus.DeadLettered;
                dbJob.CompletedAt = DateTime.UtcNow;
                _logger.LogWarning("Job {JobId} moved to dead-letter queue", job.Id);
            }
            else
            {
                dbJob.Status = JobStatus.Failed;
                dbJob.NextAttemptAt = DateTime.UtcNow.AddMinutes(Math.Pow(2, dbJob.Attempts));
            }
        }
        finally
        {
            dbJob.LockedUntil = null;
            await db.SaveChangesAsync(cancellationToken);
        }
    }

    private async Task OnProcessAsync(BackgroundJob job, CancellationToken cancellationToken)
    {
        switch (job.Type)
        {
            case "SendEmail":
                await Task.Delay(100, cancellationToken);
                break;
            case "GenerateReport":
                await Task.Delay(200, cancellationToken);
                break;
            case "SyncExternal":
                await Task.Delay(300, cancellationToken);
                break;
            default:
                await Task.Delay(100, cancellationToken);
                break;
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _queue.Writer.Complete();
        await base.StopAsync(cancellationToken);
    }
}
