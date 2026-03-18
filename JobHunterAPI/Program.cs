using JobHunterAPI.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 1. Add controllers for routing
builder.Services.AddControllers();
// Allow React frontend (running on port 5173 by default in Vite) to access the API
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactUI", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174") // <-- 加上 5174
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
// 2. Add OpenAPI documentation (Standard in .NET 9)
builder.Services.AddOpenApi();

// 3. Register the database context with the DI container
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// 4. Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    // Enable OpenAPI endpoint in development mode
    app.MapOpenApi();
}

app.UseHttpsRedirection();
// Enable CORS middleware
app.UseCors("AllowReactUI");

app.UseAuthorization();

app.MapControllers();

app.Run();