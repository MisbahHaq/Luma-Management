using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Luma.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddCommentSoftDelete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Comments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedById",
                table: "Comments",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Comments",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_Comments_DeletedById",
                table: "Comments",
                column: "DeletedById");

            migrationBuilder.AddForeignKey(
                name: "FK_Comments_AspNetUsers_DeletedById",
                table: "Comments",
                column: "DeletedById",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Comments_AspNetUsers_DeletedById",
                table: "Comments");

            migrationBuilder.DropIndex(
                name: "IX_Comments_DeletedById",
                table: "Comments");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Comments");

            migrationBuilder.DropColumn(
                name: "DeletedById",
                table: "Comments");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Comments");
        }
    }
}
