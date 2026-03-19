# 🚀 Job Hunter Pro

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![.NET](https://img.shields.io/badge/.NET-5C2D91?style=for-the-badge&logo=.net&logoColor=white)
![MicrosoftSQLServer](https://img.shields.io/badge/Microsoft%20SQL%20Server-CC2927?style=for-the-badge&logo=microsoft%20sql%20server&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

A modern, full-stack Kanban board and analytics dashboard designed to optimize the job hunting process. Built with a decoupled architecture using **React** for a responsive, glassmorphism UI and an **ASP.NET Core Web API** powered by **SQL Server** and **Entity Framework Core**.

## ✨ Key Features

* **📊 Interactive Analytics Dashboard:** Real-time calculation of pipeline metrics, interview conversion rates, and a dynamic "Win Rate" progress bar using derived state.
* **🖱️ Drag-and-Drop Kanban Board:** Seamlessly transition job applications across 5 pipeline stages (Wishlist, Applied, Interviewing, Offer, Rejected) with optimized mobile/desktop layouts.
* **⚡ JD Skill Matcher (ATS Parser):** A built-in text parsing engine that analyzes Job Descriptions in milliseconds, highlighting matched skills from a personalized technical database.
* **⏰ Smart Alerts & Countdowns:** Automatically detects upcoming interviews, displays a global alert banner, and attaches dynamic urgency badges (e.g., "🔥 In 12 hours!") to specific cards.
* **🎨 Modern UI/UX:** Features a sleek, minimalist design with glassmorphism effects, dynamic color-coded priority labels, and smooth state-driven animations.

## 🛠️ Tech Stack

### Frontend (Client)
* **Framework:** React 18 (Vite)
* **Styling:** Tailwind CSS (Mobile-First, Grid/Flexbox Layouts, Glassmorphism)
* **State Management:** React Hooks (`useState`, `useEffect`), Derived State Architecture
* **HTTP Client:** Axios

### Backend (Server & Database)
* **Framework:** ASP.NET Core 8.0 Web API
* **Language:** C#
* **Database:** Microsoft SQL Server (running in Docker container)
* **ORM:** Entity Framework (EF) Core with Code-First Migrations
* **Architecture:** RESTful API Design, CORS Configuration

## 🚀 Getting Started

To run this full-stack application locally on your machine:

### 1. Database Setup (Docker)
Ensure Docker Desktop is running, then pull and start the SQL Server image. The application uses EF Core to automatically apply migrations.
```bash
# Update the database to the latest schema
cd JobHunterAPI
dotnet ef database update
```
### 2. Start the Backend API
```bash
cd JobHunterAPI
dotnet run
```
The API will typically run on http://localhost:5244

### 3. Start the Frontend Application
```bash
cd JobHunterUI
npm install
npm run dev
```
The UI will be available at http://localhost:5174

## 🧠 Technical Highlights
Decoupled Architecture: Clean separation of concerns between the React client and the C# server.

Conditional Rendering: Advanced React patterns to hide/show complex components (like Date Pickers and Modals) based on the specific status of a database entity.

Client-Side Filtering: Millisecond-level search and priority filtering without redundant API calls.
