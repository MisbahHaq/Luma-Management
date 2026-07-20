using Luma.Server.Data;
using Luma.Server.Hubs;
using Luma.Server.Middleware;
using Luma.Server.Models;
using Luma.Server.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace Luma.Server
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
            builder.Services.AddDbContext<AppDbContext>(options =>
                options.UseSqlite(connectionString));

            builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
                .AddEntityFrameworkStores<AppDbContext>()
                .AddDefaultTokenProviders();

            builder.Services.Configure<IdentityOptions>(options =>
            {
                options.Password.RequireDigit = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireUppercase = true;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequiredLength = 6;
                options.User.RequireUniqueEmail = true;
            });

            var jwt = builder.Configuration.GetSection("Jwt");
            var key = Encoding.UTF8.GetBytes(jwt["Key"]!);

            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwt["Issuer"],
                    ValidAudience = jwt["Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    RoleClaimType = System.Security.Claims.ClaimTypes.Role
                };
            })
            .AddOpenIdConnect("OpenIdConnect", options =>
            {
                options.Authority = builder.Configuration["Sso:Authority"];
                options.ClientId = builder.Configuration["Sso:ClientId"];
                options.ClientSecret = builder.Configuration["Sso:ClientSecret"];
                options.CallbackPath = builder.Configuration["Sso:CallbackPath"] ?? "/api/sso/callback";
                options.ResponseType = "code";
                options.SaveTokens = true;
                options.GetClaimsFromUserInfoEndpoint = true;
                options.Scope.Clear();
                foreach (var scope in builder.Configuration.GetSection("Sso:Scopes").Get<string[]>() ?? Array.Empty<string>())
                {
                    options.Scope.Add(scope);
                }
                options.ClaimActions.MapJsonKey("email", "email");
                options.ClaimActions.MapJsonKey("name", "name");
            });

            builder.Services.AddAuthorization();

            builder.Services.Configure<SsoOptions>(builder.Configuration.GetSection("Sso"));
            builder.Services.AddScoped<IJwtService, JwtService>();
            builder.Services.AddScoped<ActivityService>();
            builder.Services.AddScoped<NotificationService>();
            builder.Services.AddScoped<WebhookDispatcherService>();
            builder.Services.AddHttpClient();

            builder.Services.AddHostedService<BackgroundJobService>();

            ConfigureStorage(builder);
            ConfigureEmail(builder);

            builder.Services.AddSignalR();

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowSpa", policy =>
                {
                    policy.WithOrigins("https://localhost:52613")
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials();
                });
            });

            builder.Services.AddControllers()
                .AddJsonOptions(options =>
                    options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter()));

            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            var app = builder.Build();

            using (var scope = app.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                db.Database.Migrate();
                SeedData.InitializeAsync(scope.ServiceProvider).GetAwaiter().GetResult();
            }

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();
            app.UseCors("AllowSpa");

            app.UseMiddleware<RateLimitingMiddleware>();
            app.UseMiddleware<ApiKeyAuthenticationMiddleware>();
            app.UseMiddleware<TenantResolutionMiddleware>();

            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();
            app.MapHub<NotificationHub>("/hubs/notifications");
            app.MapFallbackToFile("/index.html");

            app.Run();
        }

        private static void ConfigureStorage(WebApplicationBuilder builder)
        {
            var storageProvider = builder.Configuration["Storage:Provider"]?.ToLowerInvariant() ?? "local";
            if (storageProvider == "minio" || storageProvider == "s3")
            {
                builder.Services.Configure<MinioStorageOptions>(builder.Configuration.GetSection("Storage:Minio"));
                builder.Services.AddSingleton<IFileStorageService, MinioStorageService>();
            }
            else
            {
                builder.Services.Configure<LocalStorageOptions>(builder.Configuration.GetSection("Storage:Local"));
                builder.Services.AddSingleton<IFileStorageService, LocalFileStorageService>();
            }
        }

        private static void ConfigureEmail(WebApplicationBuilder builder)
        {
            var provider = builder.Configuration["Email:Provider"]?.ToLowerInvariant() ?? "none";
            if (provider == "sendgrid")
            {
                builder.Services.Configure<SendGridOptions>(builder.Configuration.GetSection("Email:SendGrid"));
                builder.Services.AddSingleton<IEmailService, SendGridEmailService>();
            }
            else if (provider == "smtp")
            {
                builder.Services.Configure<SmtpOptions>(builder.Configuration.GetSection("Email:Smtp"));
                builder.Services.AddSingleton<IEmailService, SmtpEmailService>();
            }
            else
            {
                builder.Services.AddSingleton<IEmailService, NullEmailService>();
            }
        }
    }
}
