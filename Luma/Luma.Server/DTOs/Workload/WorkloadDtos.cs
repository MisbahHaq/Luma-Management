using System.ComponentModel.DataAnnotations;

namespace Luma.Server.DTOs.Workload;

public class CreateTeamMemberCapacityDto
{
    [Required]
    public Guid ProjectId { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;

    [Required]
    public DateTime Date { get; set; }

    [Range(0, 24)]
    public double CapacityHours { get; set; } = 8;

    [Range(0, 24)]
    public double AllocatedHours { get; set; }
}

public class UpdateTeamMemberCapacityDto
{
    [Range(0, 24)]
    public double CapacityHours { get; set; }

    [Range(0, 24)]
    public double AllocatedHours { get; set; }
}

public class TeamMemberCapacityResponseDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string UserFullName { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public double CapacityHours { get; set; }
    public double AllocatedHours { get; set; }
    public double UtilizationPercentage { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class ResourceUtilizationResponseDto
{
    public string UserId { get; set; } = string.Empty;
    public string UserFullName { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public double TotalCapacityHours { get; set; }
    public double TotalAllocatedHours { get; set; }
    public double UtilizationPercentage { get; set; }
    public int ActiveProjectCount { get; set; }
    public int TaskCount { get; set; }
}

public class WorkloadDashboardResponseDto
{
    public List<ResourceUtilizationResponseDto> Resources { get; set; } = new();
    public List<TeamMemberCapacityResponseDto> Timeline { get; set; } = new();
}
