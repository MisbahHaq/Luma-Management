using Luma.Server.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Luma.Server.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser, IdentityRole, string>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
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
    }
}
