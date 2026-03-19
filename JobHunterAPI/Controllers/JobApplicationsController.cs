using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using JobHunterAPI.Data;
using JobHunterAPI.Models;

namespace JobHunterAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class JobApplicationsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public JobApplicationsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/JobApplications
        // Fetches all job application cards to populate the Kanban board columns
        [HttpGet]
        public async Task<ActionResult<IEnumerable<JobApplication>>> GetJobApplications()
        {
            return await _context.JobApplications.ToListAsync();
        }

        // POST: api/JobApplications
        // Creates a new job application card (defaults to 'Wishlist' column)
        [HttpPost]
        public async Task<ActionResult<JobApplication>> PostJobApplication(JobApplication jobApplication)
        {
            jobApplication.CreatedAt = DateTime.UtcNow;
            jobApplication.UpdatedAt = DateTime.UtcNow;

            _context.JobApplications.Add(jobApplication);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetJobApplications), new { id = jobApplication.Id }, jobApplication);
        }

        // PUT: api/JobApplications/{id}
        // Updates the entire job application card (used for saving Interview Date, Notes, etc.)
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateJob(int id, [FromBody] JobApplication updatedJob)
        {
            var job = await _context.JobApplications.FindAsync(id);
            if (job == null)
            {
                return NotFound();
            }

            // Only update the allowed fields
            // Only update the allowed fields
            job.CompanyName = updatedJob.CompanyName;
            job.JobTitle = updatedJob.JobTitle;
            job.InterviewDate = updatedJob.InterviewDate;
            job.Priority = updatedJob.Priority; 
            job.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // PUT: api/JobApplications/{id}/status
        // Crucial for Kanban: Updates the card's status when dragged and dropped between columns
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] ApplicationStatus newStatus)
        {
            var job = await _context.JobApplications.FindAsync(id);
            if (job == null)
            {
                return NotFound();
            }

            job.Status = newStatus;
            job.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/JobApplications/{id}
        // Deletes a job application card from the board
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteJobApplication(int id)
        {
            var jobApplication = await _context.JobApplications.FindAsync(id);
            if (jobApplication == null)
            {
                return NotFound();
            }

            _context.JobApplications.Remove(jobApplication);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}