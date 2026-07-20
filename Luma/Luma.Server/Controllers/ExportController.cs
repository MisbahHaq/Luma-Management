using ClosedXML.Excel;
using Luma.Server.Data;
using Luma.Server.DTOs.Reports;
using Luma.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Luma.Server.Controllers;

[ApiController]
[Route("api/export")]
[Authorize]
public class ExportController : ControllerBase
{
    private readonly AppDbContext _context;

    public ExportController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("projects/{projectId}/excel")]
    public async Task<IActionResult> ExportProjectExcel(Guid projectId)
    {
        var project = await _context.Projects.FindAsync(projectId);
        if (project is null)
        {
            return NotFound();
        }

        var tasks = await _context.Tasks
            .Where(t => t.ProjectId == projectId)
            .Include(t => t.Assignee)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Tasks");

        worksheet.Cell(1, 1).Value = "Title";
        worksheet.Cell(1, 2).Value = "Status";
        worksheet.Cell(1, 3).Value = "Priority";
        worksheet.Cell(1, 4).Value = "Assignee";
        worksheet.Cell(1, 5).Value = "Due Date";
        worksheet.Cell(1, 6).Value = "Created At";

        for (var i = 0; i < tasks.Count; i++)
        {
            var task = tasks[i];
            worksheet.Cell(i + 2, 1).Value = task.Title;
            worksheet.Cell(i + 2, 2).Value = task.Status.ToString();
            worksheet.Cell(i + 2, 3).Value = task.Priority.ToString();
            worksheet.Cell(i + 2, 4).Value = task.Assignee?.FullName ?? "Unassigned";
            worksheet.Cell(i + 2, 5).Value = task.DueDate?.ToString("yyyy-MM-dd") ?? "";
            worksheet.Cell(i + 2, 6).Value = task.CreatedAt.ToString("yyyy-MM-dd");
        }

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;

        return File(
            stream.ToArray(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"{project.Name}_Tasks.xlsx");
    }

    [HttpGet("projects/{projectId}/pdf")]
    public async Task<IActionResult> ExportProjectPdf(Guid projectId)
    {
        var project = await _context.Projects.FindAsync(projectId);
        if (project is null)
        {
            return NotFound();
        }

        var tasks = await _context.Tasks
            .Where(t => t.ProjectId == projectId)
            .Include(t => t.Assignee)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        var completed = tasks.Count(t => t.Status == Luma.Server.Models.TaskStatus.Done);
        var inProgress = tasks.Count(t => t.Status == Luma.Server.Models.TaskStatus.InProgress);
        var todo = tasks.Count(t => t.Status == Luma.Server.Models.TaskStatus.ToDo);
        var completionRate = tasks.Count > 0 ? Math.Round((double)completed / tasks.Count * 100, 1) : 0;

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(40);
                page.Size(PageSizes.A4);
                page.Header().Text($"{project.Name} - Project Report").FontSize(18).Bold();

                page.Header().Text($"Generated on {DateTime.UtcNow:yyyy-MM-dd HH:mm}").FontSize(10).FontColor(Colors.Grey.Medium);

                page.Content().Column(col =>
                {
                    col.Item().Text("Project Summary").FontSize(16).Bold();
                    col.Item().Text($"Total Tasks: {tasks.Count}").FontSize(12);
                    col.Item().Text($"Completed: {completed}").FontSize(12);
                    col.Item().Text($"In Progress: {inProgress}").FontSize(12);
                    col.Item().Text($"To Do: {todo}").FontSize(12);
                    col.Item().Text($"Completion Rate: {completionRate}%").FontSize(12);
                    col.Item().Height(20);

                    col.Item().Text("Tasks").FontSize(16).Bold();

                    foreach (var task in tasks)
                    {
                        col.Item().PaddingTop(8).Column(taskCol =>
                        {
                            taskCol.Item().Text(task.Title).FontSize(12).Bold();
                            taskCol.Item().Text($"Status: {task.Status} | Priority: {task.Priority} | Assignee: {task.Assignee?.FullName ?? "Unassigned"}").FontSize(10);
                            if (!string.IsNullOrEmpty(task.Description))
                            {
                                taskCol.Item().Text(task.Description).FontSize(9).FontColor(Colors.Grey.Medium);
                            }
                        });
                    }
                });

                page.Footer().AlignCenter().Text("Luma Management").FontSize(9).FontColor(Colors.Grey.Medium);
            });
        });

        var pdfBytes = document.GeneratePdf();

        return File(pdfBytes, "application/pdf", $"{project.Name}_Report.pdf");
    }

    [HttpGet("projects/{projectId}/burndown/pdf")]
    public async Task<IActionResult> ExportBurndownPdf(Guid projectId)
    {
        var project = await _context.Projects.FindAsync(projectId);
        if (project is null)
        {
            return NotFound();
        }

        var sprint = await _context.Sprints
            .Where(s => s.ProjectId == projectId && s.Status == Luma.Server.Models.SprintStatus.Active)
            .OrderByDescending(s => s.StartDate)
            .FirstOrDefaultAsync();

        if (sprint is null)
        {
            return BadRequest(new { message = "No active sprint found." });
        }

        var sprintTasks = await _context.Tasks
            .Where(t => t.ProjectId == projectId && t.SprintId == sprint.Id)
            .ToListAsync();

        var totalTasks = sprintTasks.Count;
        var startDate = sprint.StartDate ?? DateTime.UtcNow;
        var endDate = sprint.EndDate ?? DateTime.UtcNow;
        var totalDays = (endDate - startDate).Days + 1;

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(40);
                page.Size(PageSizes.A4);
                page.Header().Text($"Burndown Chart - {project.Name} ({sprint.Name})").FontSize(18).Bold();

                page.Header().Text($"Generated on {DateTime.UtcNow:yyyy-MM-dd HH:mm}").FontSize(10).FontColor(Colors.Grey.Medium);

                page.Content().Column(col =>
                {
                    col.Item().Text("Burndown Data").FontSize(16).Bold();

                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                            columns.RelativeColumn();
                        });

                        table.Header(header =>
                        {
                            header.Cell().Element(CellStyle).Text("Date");
                            header.Cell().Element(CellStyle).Text("Remaining Tasks");
                            header.Cell().Element(CellStyle).Text("Ideal Remaining");
                        });

                        for (var day = 0; day < totalDays; day++)
                        {
                            var currentDate = startDate.AddDays(day);
                            var remaining = sprintTasks.Count(t => t.Status != Luma.Server.Models.TaskStatus.Done && t.CreatedAt <= currentDate);
                            var ideal = totalDays > 0 ? Math.Max(0, totalTasks - (totalTasks * day / totalDays)) : 0;

                            table.Cell().Element(CellStyle).Text(currentDate.ToString("yyyy-MM-dd"));
                            table.Cell().Element(CellStyle).Text(remaining.ToString());
                            table.Cell().Element(CellStyle).Text(((int)Math.Round((double)ideal)).ToString());
                        }
                    });
                });

                page.Footer().AlignCenter().Text("Luma Management").FontSize(9).FontColor(Colors.Grey.Medium);
            });
        });

        var pdfBytes = document.GeneratePdf();
        return File(pdfBytes, "application/pdf", $"{project.Name}_Burndown.pdf");
    }

    private static IContainer CellStyle(IContainer container) => container
        .BorderBottom(1)
        .BorderColor(Colors.Grey.Lighten2)
        .PaddingVertical(5)
        .PaddingHorizontal(10);
}
