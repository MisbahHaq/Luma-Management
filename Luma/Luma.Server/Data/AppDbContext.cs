using Luma.Server.Models;
using Luma.Server.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Luma.Server.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser, IdentityRole, string>
{
    private readonly TenantContext? _tenantContext;

    public AppDbContext(DbContextOptions<AppDbContext> options, TenantContext? tenantContext = null)
        : base(options)
    {
        _tenantContext = tenantContext;
    }

    public DbSet<Project> Projects => Set<Project>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<Attachment> Attachments => Set<Attachment>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<ProjectMember> ProjectMembers => Set<ProjectMember>();
    public DbSet<Sprint> Sprints => Set<Sprint>();
    public DbSet<TaskDependency> TaskDependencies => Set<TaskDependency>();
    public DbSet<TimeLog> TimeLogs => Set<TimeLog>();
    public DbSet<TeamMemberCapacity> TeamMemberCapacities => Set<TeamMemberCapacity>();
    public DbSet<TeamCalendar> TeamCalendars => Set<TeamCalendar>();
    public DbSet<TeamCalendarEvent> TeamCalendarEvents => Set<TeamCalendarEvent>();
    public DbSet<ProjectCustomField> ProjectCustomFields => Set<ProjectCustomField>();
    public DbSet<ProjectCustomFieldValue> ProjectCustomFieldValues => Set<ProjectCustomFieldValue>();
    public DbSet<ProjectTemplate> ProjectTemplates => Set<ProjectTemplate>();
    public DbSet<ProjectTemplateTask> ProjectTemplateTasks => Set<ProjectTemplateTask>();
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<ApiKey> ApiKeys => Set<ApiKey>();
    public DbSet<WebhookSubscription> WebhookSubscriptions => Set<WebhookSubscription>();
    public DbSet<WebhookDelivery> WebhookDeliveries => Set<WebhookDelivery>();
    public DbSet<BackgroundJob> BackgroundJobs => Set<BackgroundJob>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<ApplicationUser>(entity =>
        {
            entity.Property(u => u.Role)
                .HasConversion<string>();
        });

        builder.Entity<Project>(entity =>
        {
            entity.HasKey(p => p.Id);

            entity.HasOne(p => p.CreatedByUser)
                .WithMany()
                .HasForeignKey(p => p.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(p => p.Tasks)
                .WithOne(t => t.Project)
                .HasForeignKey(t => t.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<TaskItem>(entity =>
        {
            entity.HasKey(t => t.Id);

            entity.HasOne(t => t.Assignee)
                .WithMany()
                .HasForeignKey(t => t.AssigneeId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasMany(t => t.Children)
                .WithOne(t => t.ParentTask)
                .HasForeignKey(t => t.ParentTaskId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(t => t.Comments)
                .WithOne(c => c.Task)
                .HasForeignKey(c => c.TaskId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Comment>(entity =>
        {
            entity.HasKey(c => c.Id);

            entity.HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(c => c.DeletedBy)
                .WithMany()
                .HasForeignKey(c => c.DeletedById)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<Attachment>(entity =>
        {
            entity.HasKey(a => a.Id);

            entity.HasOne(a => a.Task)
                .WithMany(t => t.Attachments)
                .HasForeignKey(a => a.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(a => a.UploadedBy)
                .WithMany()
                .HasForeignKey(a => a.UploadedById)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<ProjectMember>(entity =>
        {
            entity.HasKey(m => m.Id);

            entity.HasOne(m => m.Project)
                .WithMany(p => p.Members)
                .HasForeignKey(m => m.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(m => m.User)
                .WithMany()
                .HasForeignKey(m => m.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(m => new { m.ProjectId, m.UserId }).IsUnique();
        });

        builder.Entity<ActivityLog>(entity =>
        {
            entity.HasKey(a => a.Id);

            entity.HasOne(a => a.Project)
                .WithMany()
                .HasForeignKey(a => a.ProjectId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(a => a.Task)
                .WithMany()
                .HasForeignKey(a => a.TaskId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(a => a.Actor)
                .WithMany()
                .HasForeignKey(a => a.ActorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Notification>(entity =>
        {
            entity.HasKey(n => n.Id);

            entity.HasOne(n => n.Recipient)
                .WithMany()
                .HasForeignKey(n => n.RecipientId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(n => new { n.RecipientId, n.IsRead });
        });

        builder.Entity<Sprint>(entity =>
        {
            entity.HasKey(s => s.Id);

            entity.HasOne(s => s.Project)
                .WithMany()
                .HasForeignKey(s => s.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(s => s.CreatedByUser)
                .WithMany()
                .HasForeignKey(s => s.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(s => s.Tasks)
                .WithOne(t => t.Sprint)
                .HasForeignKey(t => t.SprintId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<TaskDependency>(entity =>
        {
            entity.HasKey(d => d.Id);

            entity.HasOne(d => d.Task)
                .WithMany()
                .HasForeignKey(d => d.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(d => d.DependsOnTask)
                .WithMany()
                .HasForeignKey(d => d.DependsOnTaskId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(d => d.Project)
                .WithMany()
                .HasForeignKey(d => d.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(d => new { d.TaskId, d.DependsOnTaskId }).IsUnique();
        });

        builder.Entity<TimeLog>(entity =>
        {
            entity.HasKey(l => l.Id);

            entity.HasOne(l => l.Task)
                .WithMany()
                .HasForeignKey(l => l.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(l => l.Project)
                .WithMany()
                .HasForeignKey(l => l.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(l => l.User)
                .WithMany()
                .HasForeignKey(l => l.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(l => new { l.UserId, l.Date });
        });

        builder.Entity<TeamMemberCapacity>(entity =>
        {
            entity.HasKey(c => c.Id);

            entity.HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(c => c.Project)
                .WithMany()
                .HasForeignKey(c => c.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(c => new { c.UserId, c.ProjectId, c.Date }).IsUnique();
        });

        builder.Entity<TeamCalendar>(entity =>
        {
            entity.HasKey(c => c.Id);

            entity.HasOne(c => c.CreatedByUser)
                .WithMany()
                .HasForeignKey(c => c.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(c => c.Events)
                .WithOne(e => e.Calendar)
                .HasForeignKey(e => e.CalendarId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<TeamCalendarEvent>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.HasOne(e => e.Calendar)
                .WithMany(c => c.Events)
                .HasForeignKey(e => e.CalendarId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Project)
                .WithMany()
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(e => new { e.CalendarId, e.StartDate, e.EndDate });
        });

        builder.Entity<ProjectCustomField>(entity =>
        {
            entity.HasKey(f => f.Id);

            entity.HasOne(f => f.Project)
                .WithMany()
                .HasForeignKey(f => f.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(f => new { f.ProjectId, f.Name }).IsUnique();
        });

        builder.Entity<ProjectCustomFieldValue>(entity =>
        {
            entity.HasKey(v => v.Id);

            entity.HasOne(v => v.CustomField)
                .WithMany()
                .HasForeignKey(v => v.CustomFieldId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(v => v.Task)
                .WithMany()
                .HasForeignKey(v => v.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(v => new { v.CustomFieldId, v.TaskId }).IsUnique();
        });

        builder.Entity<ProjectTemplate>(entity =>
        {
            entity.HasKey(t => t.Id);

            entity.HasOne(t => t.CreatedByUser)
                .WithMany()
                .HasForeignKey(t => t.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(t => t.Tasks)
                .WithOne(tt => tt.Template)
                .HasForeignKey(tt => tt.TemplateId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<ProjectTemplateTask>(entity =>
        {
            entity.HasKey(tt => tt.Id);

            entity.HasOne(tt => tt.Template)
                .WithMany(t => t.Tasks)
                .HasForeignKey(tt => tt.TemplateId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(tt => tt.ParentTemplateTask)
                .WithMany(tt => tt.Children)
                .HasForeignKey(tt => tt.ParentTemplateTaskId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Tenant>(entity =>
        {
            entity.HasKey(t => t.Id);
            entity.HasIndex(t => t.Slug).IsUnique();

            entity.HasOne(t => t.CreatedByUser)
                .WithMany()
                .HasForeignKey(t => t.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(t => t.Projects)
                .WithOne(p => p.Tenant)
                .HasForeignKey(p => p.TenantId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<Project>(entity =>
        {
            entity.HasKey(p => p.Id);

            entity.HasOne(p => p.CreatedByUser)
                .WithMany()
                .HasForeignKey(p => p.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(p => p.Tenant)
                .WithMany(t => t.Projects)
                .HasForeignKey(p => p.TenantId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasMany(p => p.Tasks)
                .WithOne(t => t.Project)
                .HasForeignKey(t => t.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<ApiKey>(entity =>
        {
            entity.HasKey(k => k.Id);

            entity.HasOne(k => k.Tenant)
                .WithMany()
                .HasForeignKey(k => k.TenantId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(k => k.CreatedByUser)
                .WithMany()
                .HasForeignKey(k => k.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(k => new { k.TenantId, k.KeyPrefix }).IsUnique();
        });

        builder.Entity<WebhookSubscription>(entity =>
        {
            entity.HasKey(w => w.Id);

            entity.HasOne(w => w.Tenant)
                .WithMany()
                .HasForeignKey(w => w.TenantId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(w => w.Project)
                .WithMany()
                .HasForeignKey(w => w.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(w => w.CreatedByUser)
                .WithMany()
                .HasForeignKey(w => w.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(w => w.Deliveries)
                .WithOne(d => d.Subscription)
                .HasForeignKey(d => d.SubscriptionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<WebhookDelivery>(entity =>
        {
            entity.HasKey(d => d.Id);

            entity.HasOne(d => d.Subscription)
                .WithMany(w => w.Deliveries)
                .HasForeignKey(d => d.SubscriptionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(d => new { d.Status, d.NextAttemptAt });
        });

        builder.Entity<BackgroundJob>(entity =>
        {
            entity.HasKey(j => j.Id);

            entity.HasIndex(j => new { j.Status, j.NextAttemptAt });
            entity.HasIndex(j => new { j.Type, j.Status });
        });

        builder.Entity<PasswordResetToken>(entity =>
        {
            entity.HasKey(t => t.Id);

            entity.HasIndex(t => new { t.Token, t.UsedAt });
        });

        // =====================================================================
        // TENANT ISOLATION — global query filters
        // Every tenant-aware entity is transparently scoped to the resolved tenant
        // (see TenantResolutionMiddleware -> TenantContext). Entities reached via a
        // parent Project are scoped through the Project's TenantId. When no tenant is
        // resolved (null), Project still shows null-tenant rows; direct-tenant entities
        // show all (matching prior behavior, since there was no tenant header).
        // Intentionally cross-tenant reads call IgnoreQueryFilters() and are flagged
        // with a "CROSS-TENANT" comment at each call site.
        // =====================================================================
        var tenantId = _tenantContext?.CurrentTenantId;

        builder.Entity<Project>(entity =>
        {
            // Null-tenant projects (e.g. platform-owned) remain visible to all.
            if (tenantId is not null)
            {
                entity.HasQueryFilter(p => p.TenantId == tenantId || p.TenantId == null);
            }
        });

        builder.Entity<ApiKey>(entity =>
        {
            if (tenantId is not null)
            {
                entity.HasQueryFilter(k => k.TenantId == tenantId);
            }
        });

        builder.Entity<WebhookSubscription>(entity =>
        {
            if (tenantId is not null)
            {
                entity.HasQueryFilter(w => w.TenantId == tenantId);
            }
        });

        builder.Entity<BackgroundJob>(entity =>
        {
            if (tenantId is not null)
            {
                entity.HasQueryFilter(j => j.TenantId == tenantId || j.TenantId == null);
            }
        });

        // Entities scoped via parent Project (TenantId lives on Project).
        builder.Entity<TaskItem>(entity =>
        {
            if (tenantId is not null)
            {
                entity.HasQueryFilter(t => t.Project != null && (t.Project.TenantId == tenantId || t.Project.TenantId == null));
            }
        });

        builder.Entity<Sprint>(entity =>
        {
            if (tenantId is not null)
            {
                entity.HasQueryFilter(s => s.Project != null && (s.Project.TenantId == tenantId || s.Project.TenantId == null));
            }
        });

        builder.Entity<TimeLog>(entity =>
        {
            if (tenantId is not null)
            {
                entity.HasQueryFilter(l => l.Project != null && (l.Project.TenantId == tenantId || l.Project.TenantId == null));
            }
        });

        builder.Entity<Comment>(entity =>
        {
            if (tenantId is not null)
            {
                entity.HasQueryFilter(c => c.Task != null && c.Task.Project != null &&
                    (c.Task.Project.TenantId == tenantId || c.Task.Project.TenantId == null));
            }
        });

        builder.Entity<Attachment>(entity =>
        {
            if (tenantId is not null)
            {
                entity.HasQueryFilter(a => a.Task != null && a.Task.Project != null &&
                    (a.Task.Project.TenantId == tenantId || a.Task.Project.TenantId == null));
            }
        });

        builder.Entity<ProjectCustomField>(entity =>
        {
            if (tenantId is not null)
            {
                entity.HasQueryFilter(f => f.Project != null && (f.Project.TenantId == tenantId || f.Project.TenantId == null));
            }
        });

        builder.Entity<ProjectCustomFieldValue>(entity =>
        {
            if (tenantId is not null)
            {
                entity.HasQueryFilter(v => v.CustomField != null && v.CustomField.Project != null &&
                    (v.CustomField.Project.TenantId == tenantId || v.CustomField.Project.TenantId == null));
            }
        });

        builder.Entity<TaskDependency>(entity =>
        {
            if (tenantId is not null)
            {
                entity.HasQueryFilter(d => d.Project != null && (d.Project.TenantId == tenantId || d.Project.TenantId == null));
            }
        });

        builder.Entity<TeamMemberCapacity>(entity =>
        {
            if (tenantId is not null)
            {
                entity.HasQueryFilter(c => c.Project != null && (c.Project.TenantId == tenantId || c.Project.TenantId == null));
            }
        });

        // NOTE: ProjectTemplate and TeamCalendar are intentionally NOT tenant-scoped:
        // templates are public/owner-scoped and calendars are user-scoped per the model.
        // Adding a TenantId to those is a separate schema change (flagged in the audit).
        // Tenant (the tenant directory itself) is never filtered.
    }
}
