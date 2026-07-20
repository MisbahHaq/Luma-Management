namespace Luma.Server.DTOs.Reports;

public class BurndownPointDto
{
    public DateTime Date { get; set; }
    public int RemainingTasks { get; set; }
    public int IdealRemaining { get; set; }
}

public class BurndownResponseDto
{
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public Guid SprintId { get; set; }
    public string SprintName { get; set; } = string.Empty;
    public DateTime SprintStart { get; set; }
    public DateTime SprintEnd { get; set; }
    public int TotalTasks { get; set; }
    public List<BurndownPointDto> DataPoints { get; set; } = new();
}

public class VelocityPointDto
{
    public Guid SprintId { get; set; }
    public string SprintName { get; set; } = string.Empty;
    public DateTime SprintStart { get; set; }
    public DateTime SprintEnd { get; set; }
    public int CompletedTasks { get; set; }
    public int StoryPoints { get; set; }
}

public class VelocityResponseDto
{
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public double AverageVelocity { get; set; }
    public List<VelocityPointDto> DataPoints { get; set; } = new();
}

public class ProjectHealthResponseDto
{
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public int TotalTasks { get; set; }
    public int CompletedTasks { get; set; }
    public int InProgressTasks { get; set; }
    public int TodoTasks { get; set; }
    public double CompletionPercentage { get; set; }
    public int OverdueTasks { get; set; }
    public double AverageCompletionTimeDays { get; set; }
    public int TotalTimeLoggedHours { get; set; }
    public string HealthStatus { get; set; } = "Good";
    public List<TaskStatusDistributionDto> StatusDistribution { get; set; } = new();
    public List<TaskPriorityDistributionDto> PriorityDistribution { get; set; } = new();
    public List<AssigneeWorkloadDto> AssigneeWorkload { get; set; } = new();
}

public class TaskStatusDistributionDto
{
    public string Status { get; set; } = string.Empty;
    public int Count { get; set; }
    public double Percentage { get; set; }
}

public class TaskPriorityDistributionDto
{
    public string Priority { get; set; } = string.Empty;
    public int Count { get; set; }
    public double Percentage { get; set; }
}

public class AssigneeWorkloadDto
{
    public string AssigneeId { get; set; } = string.Empty;
    public string AssigneeName { get; set; } = string.Empty;
    public int TaskCount { get; set; }
    public double TotalHoursLogged { get; set; }
}

public class DashboardSummaryResponseDto
{
    public int TotalProjects { get; set; }
    public int TotalTasks { get; set; }
    public int CompletedTasks { get; set; }
    public int InProgressTasks { get; set; }
    public int OverdueTasks { get; set; }
    public double OverallCompletionRate { get; set; }
    public List<ProjectHealthResponseDto> Projects { get; set; } = new();
}
