using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Luma.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddIssueKeys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "IssueNumber",
                table: "Tasks",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "IssueKeyPrefix",
                table: "Projects",
                type: "TEXT",
                maxLength: 10,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IssueNumber",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "IssueKeyPrefix",
                table: "Projects");
        }
    }
}
