using Microsoft.EntityFrameworkCore;
using JobHunterAPI.Models;

namespace JobHunterAPI.Data
{
    // The main class that coordinates Entity Framework functionality for a given data model
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // Represents the JobApplications table in the database
        public DbSet<JobApplication> JobApplications { get; set; }
    }
}
