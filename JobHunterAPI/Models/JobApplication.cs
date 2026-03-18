using System.ComponentModel.DataAnnotations;

namespace JobHunterAPI.Models
{
    
    public class JobApplication
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string CompanyName { get; set; } = string.Empty; 

        [Required]
        [MaxLength(100)]
        public string JobTitle { get; set; } = string.Empty; 
        public string? Location { get; set; } 

       
        [Required]
        public ApplicationStatus Status { get; set; } = ApplicationStatus.Wishlist; 

        public DateTime? AppliedDate { get; set; } 

        public string? JobPostingUrl { get; set; } 

        public string? Notes { get; set; } 
        
        public DateTime? InterviewDate { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow; 
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow; 
    }


    public enum ApplicationStatus
    {
        Wishlist,    
        Applied,     
        Interviewing,
        Offer,       
        Rejected     
    }
}