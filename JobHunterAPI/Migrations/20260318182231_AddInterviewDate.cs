using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JobHunterAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddInterviewDate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "InterviewDate",
                table: "JobApplications",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "InterviewDate",
                table: "JobApplications");
        }
    }
}
