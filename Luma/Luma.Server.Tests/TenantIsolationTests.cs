using System;
using System.Collections.Generic;
using System.Linq;
using Luma.Server.Data;
using Luma.Server.Models;
using Luma.Server.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Luma.Server.Tests;

/// <summary>
/// Verifies that tenant-scoped queries never leak data across tenants, including when
/// a caller guesses another tenant's project/task ids. Uses EF Core SQLite in-memory so
/// the global query filters behave the same as the production provider.
/// </summary>
public class TenantIsolationTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly AppDbContext _context;
    private readonly TenantContext _tenantContext;
    private readonly DefaultHttpContext _httpContext = new();

    private static readonly Guid TenantA = Guid.NewGuid();
    private static readonly Guid TenantB = Guid.NewGuid();
    private static readonly Guid ProjectA = Guid.NewGuid();
    private static readonly Guid ProjectB = Guid.NewGuid();
    private static readonly Guid TaskA = Guid.NewGuid();
    private static readonly Guid TaskB = Guid.NewGuid();

    public TenantIsolationTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;

        // TenantContext reads the resolved tenant from HttpContext.Items.
        var accessor = new StubHttpContextAccessor(_httpContext);
        _tenantContext = new TenantContext(accessor);

        _context = new AppDbContext(options, _tenantContext);
        _context.Database.EnsureCreated();

        SeedData();
    }

    private void SetTenant(Guid? tenantId)
    {
        if (tenantId is null)
        {
            _httpContext.Items.Remove("TenantId");
        }
        else
        {
            _httpContext.Items["TenantId"] = tenantId.Value;
        }
        _context.ChangeTracker.Clear();
    }

    private void SeedData()
    {
        _context.Tenants.AddRange(
            new Tenant { Id = TenantA, Name = "Tenant A", Slug = "tenant-a" },
            new Tenant { Id = TenantB, Name = "Tenant B", Slug = "tenant-b" });

        _context.Projects.AddRange(
            new Project { Id = ProjectA, Name = "Project A", CreatedByUserId = "u", TenantId = TenantA },
            new Project { Id = ProjectB, Name = "Project B", CreatedByUserId = "u", TenantId = TenantB });

        _context.Tasks.AddRange(
            new TaskItem { Id = TaskA, Title = "Task A", ProjectId = ProjectA, Status = TaskStatus.ToDo, Priority = TaskPriority.Medium },
            new TaskItem { Id = TaskB, Title = "Task B", ProjectId = ProjectB, Status = TaskStatus.ToDo, Priority = TaskPriority.Medium });

        _context.TimeLogs.AddRange(
            new TimeLog { Id = Guid.NewGuid(), TaskId = TaskA, ProjectId = ProjectA, UserId = "u", Date = DateTime.UtcNow, Hours = 1 },
            new TimeLog { Id = Guid.NewGuid(), TaskId = TaskB, ProjectId = ProjectB, UserId = "u", Date = DateTime.UtcNow, Hours = 1 });

        _context.SaveChanges();
    }

    [Fact]
    public void TenantA_cannot_see_TenantB_projects()
    {
        SetTenant(TenantA);
        var projects = _context.Projects.ToList();
        Assert.Contains(projects, p => p.Id == ProjectA);
        Assert.DoesNotContain(projects, p => p.Id == ProjectB);
    }

    [Fact]
    public void TenantA_cannot_fetch_TenantB_task_by_id()
    {
        SetTenant(TenantA);
        var task = _context.Tasks.FirstOrDefault(t => t.Id == TaskB);
        Assert.Null(task); // global filter hides it -> behaves like NotFound
    }

    [Fact]
    public void TenantA_cannot_see_TenantB_tasks_via_project_query()
    {
        SetTenant(TenantA);
        var tasks = _context.Tasks.Where(t => t.ProjectId == ProjectB).ToList();
        Assert.Empty(tasks);
    }

    [Fact]
    public void TenantA_cannot_see_TenantB_timelogs()
    {
        SetTenant(TenantA);
        var logs = _context.TimeLogs.Where(l => l.ProjectId == ProjectB).ToList();
        Assert.Empty(logs);
    }

    [Fact]
    public void Cross_tenant_read_with_IgnoreQueryFilters_sees_both()
    {
        SetTenant(TenantA);
        var allProjects = _context.Projects.IgnoreQueryFilters().ToList();
        Assert.Contains(allProjects, p => p.Id == ProjectA);
        Assert.Contains(allProjects, p => p.Id == ProjectB);
    }

    [Fact]
    public void No_tenant_header_sees_everything_like_before()
    {
        SetTenant(null);
        Assert.Contains(_context.Projects.ToList(), p => p.Id == ProjectA);
        Assert.Contains(_context.Projects.ToList(), p => p.Id == ProjectB);
    }

    public void Dispose()
    {
        _context.Dispose();
        _connection.Dispose();
    }

    /// <summary>Test double for IHttpContextAccessor backed by a single HttpContext.</summary>
    private sealed class StubHttpContextAccessor : IHttpContextAccessor
    {
        public StubHttpContextAccessor(HttpContext context) => HttpContext = context;
        public HttpContext? HttpContext { get; set; }
    }
}
