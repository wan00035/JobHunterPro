using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JobHunterAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddPriorityField : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Priority",
                table: "JobApplications",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Priority",
                table: "JobApplications");
        }
    }
}
