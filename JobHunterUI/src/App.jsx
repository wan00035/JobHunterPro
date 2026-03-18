import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Ensure this matches your backend port (e.g., 5244)
const API_URL = 'http://localhost:5244/api/JobApplications';

const COLUMNS = {
  0: { title: "Wishlist 📝", color: "bg-gray-100", border: "border-gray-300" },
  1: { title: "Applied 📤", color: "bg-blue-50", border: "border-blue-300" },
  2: { title: "Interviewing 🗣️", color: "bg-yellow-50", border: "border-yellow-300" },
  3: { title: "Offer 🏆", color: "bg-green-50", border: "border-green-300" },
  4: { title: "Rejected 💔", color: "bg-red-50", border: "border-red-300" }
};

export default function App() {
  const [jobs, setJobs] = useState([]);
  const [newCompany, setNewCompany] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newStatus, setNewStatus] = useState(0); 

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    try {
      const response = await axios.get(API_URL);
      setJobs(response.data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  const handleAddJob = async (e) => {
    e.preventDefault();
    if (!newCompany || !newTitle) return;
    const newJob = { companyName: newCompany, jobTitle: newTitle, status: newStatus };
    try {
      const response = await axios.post(API_URL, newJob);
      setJobs([...jobs, response.data]);
      setNewCompany('');
      setNewTitle('');
      setNewStatus(0); 
    } catch (error) {
      console.error("Error adding job:", error);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job application?")) return;
    try {
      await axios.delete(`${API_URL}/${jobId}`);
      setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
    } catch (error) {
      console.error("Error deleting job:", error);
    }
  };

  const handleUpdateDate = async (job, newDateString) => {
    const updatedJob = { ...job, interviewDate: newDateString ? newDateString : null };
    setJobs(prevJobs => prevJobs.map(j => j.id === job.id ? updatedJob : j));
    try {
      await axios.put(`${API_URL}/${job.id}`, updatedJob);
    } catch (error) {
      console.error("Error updating date:", error);
      fetchJobs();
    }
  };

  const handleMoveJob = async (jobId, newStatusInt) => {
    setJobs(prevJobs => prevJobs.map(job => job.id === jobId ? { ...job, status: newStatusInt } : job));
    try {
      await axios.put(`${API_URL}/${jobId}/status`, newStatusInt, { headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
      console.error("Error moving status:", error);
      fetchJobs();
    }
  };

  const handleDragStart = (e, jobId) => { e.dataTransfer.setData("jobId", jobId); };
  const handleDragOver = (e) => { e.preventDefault(); };
  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    const jobId = parseInt(e.dataTransfer.getData("jobId"));
    handleMoveJob(jobId, newStatus);
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    return dateString.slice(0, 16); 
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans flex flex-col">
      <header className="flex-shrink-0">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-6 tracking-tight">
          🚀 Job Hunter Pro
        </h1>

        <form onSubmit={handleAddJob} className="mb-10 flex flex-col lg:flex-row gap-3 md:gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200 w-full lg:w-fit">
          <input type="text" placeholder="Company" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} className="w-full lg:w-56 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
          <input type="text" placeholder="Role" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full lg:w-56 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
          
          <div className="flex gap-2">
            <select 
              value={newStatus} 
              onChange={(e) => setNewStatus(parseInt(e.target.value))}
              className="flex-1 lg:w-auto border border-gray-300 rounded-lg px-4 py-2 bg-white outline-none"
            >
              {Object.entries(COLUMNS).map(([key, config]) => (
                <option key={key} value={key}>➕ {config.title.split(' ')[0]}</option>
              ))}
            </select>
            <button type="submit" className="flex-1 lg:w-auto bg-blue-600 text-white font-bold px-8 py-2 rounded-lg hover:bg-blue-700 transition active:scale-95">
              Add
            </button>
          </div>
        </form>
      </header>

      {/* 💡 核心网格布局修改：
          grid-cols-1: 手机 1 列
          md:grid-cols-2: 平板/小电脑 2 列
          xl:grid-cols-3: 大屏幕 3 列 (你要求的)
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-10">
        {Object.entries(COLUMNS).map(([statusKey, columnConfig]) => {
          const statusInt = parseInt(statusKey);
          const columnJobs = jobs.filter(job => job.status === statusInt);

          return (
            <div 
              key={statusInt} 
              onDragOver={handleDragOver} 
              onDrop={(e) => handleDrop(e, statusInt)} 
              className={`rounded-2xl p-5 border-2 ${columnConfig.color} ${columnConfig.border} flex flex-col h-fit min-h-[200px] transition-all`}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-700">{columnConfig.title}</h2>
                <span className="bg-white px-3 py-1 rounded-full text-xs font-black shadow-sm text-gray-500 border border-gray-100">
                  {columnJobs.length}
                </span>
              </div>

              <div className="space-y-4">
                {columnJobs.map(job => (
                  <div 
                    key={job.id} 
                    draggable 
                    onDragStart={(e) => handleDragStart(e, job.id)} 
                    className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-black text-gray-900 text-lg leading-tight">{job.companyName}</h3>
                        <p className="text-sm font-medium text-blue-500 mt-1 uppercase tracking-wider">{job.jobTitle}</p>
                      </div>
                      <button onClick={() => handleDeleteJob(job.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1 -mr-2">
                        <span className="text-xl">×</span>
                      </button>
                    </div>

                    <div className="mt-5 pt-4 border-t border-gray-50">
                      <label className="text-[10px] text-gray-400 font-black mb-2 block uppercase tracking-[0.1em]">
                        Interview Schedule
                      </label>
                      <input 
                        type="datetime-local" 
                        value={formatDateForInput(job.interviewDate)}
                        onChange={(e) => handleUpdateDate(job, e.target.value)}
                        className="text-xs border border-gray-100 rounded-xl p-2.5 w-full text-gray-600 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between xl:hidden">
                       <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Move:</label>
                       <select 
                        value={job.status}
                        onChange={(e) => handleMoveJob(job.id, parseInt(e.target.value))}
                        className="text-[10px] border-none bg-transparent font-bold text-blue-400 focus:ring-0 cursor-pointer"
                      >
                         {Object.entries(COLUMNS).map(([k, c]) => (
                           <option key={k} value={k}>{c.title.split(' ')[0]}</option>
                         ))}
                      </select>
                    </div>
                  </div>
                ))}
                {columnJobs.length === 0 && (
                  <div className="py-8 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center">
                    <p className="text-gray-300 text-sm font-medium italic">No applications here</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}