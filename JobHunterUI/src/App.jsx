import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Ensure this matches your backend port (5244)
const API_URL = 'http://localhost:5244/api/JobApplications';

const COLUMNS = {
  0: { title: "Wishlist 📝", color: "bg-gray-100", border: "border-gray-300" },
  1: { title: "Applied 📤", color: "bg-blue-50", border: "border-blue-300" },
  2: { title: "Interviewing 🗣️", color: "bg-yellow-50", border: "border-yellow-300" },
  3: { title: "Offer 🏆", color: "bg-green-50", border: "border-green-300" },
  4: { title: "Rejected 💔", color: "bg-red-50", border: "border-red-300" }
};

const PRIORITIES = {
  0: { label: "Low", color: "border-l-green-400", badge: "bg-green-100 text-green-700" },
  1: { label: "Medium", color: "border-l-yellow-400", badge: "bg-yellow-100 text-yellow-700" },
  2: { label: "High", color: "border-l-red-500", badge: "bg-red-100 text-red-700" }
};

export default function App() {
  const [jobs, setJobs] = useState([]);
  
  const [newCompany, setNewCompany] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newStatus, setNewStatus] = useState(0); 
  const [newPriority, setNewPriority] = useState(1);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all'); 

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
    
    const newJob = { companyName: newCompany, jobTitle: newTitle, status: newStatus, priority: newPriority };
    try {
      const response = await axios.post(API_URL, newJob);
      setJobs([...jobs, response.data]);
      setNewCompany('');
      setNewTitle('');
      setNewStatus(0); 
      setNewPriority(1); 
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

  const handleUpdateField = async (job, fieldName, newValue) => {
    const updatedJob = { ...job, [fieldName]: newValue };
    setJobs(prevJobs => prevJobs.map(j => j.id === job.id ? updatedJob : j));
    try {
      await axios.put(`${API_URL}/${job.id}`, updatedJob);
    } catch (error) {
      console.error(`Error updating ${fieldName}:`, error);
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

  const getInterviewStatus = (dateString) => {
    if (!dateString) return null;
    const interviewDate = new Date(dateString);
    const now = new Date();
    const diffMs = interviewDate - now;
    
    if (diffMs < 0) return { text: "Completed", isUrgent: false, color: "bg-gray-100 text-gray-500" };

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 24) {
      return { text: `🔥 In ${diffHours} hours!`, isUrgent: true, color: "bg-red-500 text-white animate-pulse" };
    } else if (diffDays <= 7) {
      return { text: `⏳ In ${diffDays} days`, isUrgent: true, color: "bg-yellow-100 text-yellow-800" };
    }
    return { text: `In ${diffDays} days`, isUrgent: false, color: "bg-blue-50 text-blue-600" };
  };

  // 💡 修复 1：警报横幅现在只抓取 status === 2 (Interviewing) 的岗位
  const upcomingInterviews = jobs
    .filter(job => job.status === 2 && job.interviewDate && new Date(job.interviewDate) > new Date())
    .sort((a, b) => new Date(a.interviewDate) - new Date(b.interviewDate))
    .slice(0, 2); 

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          job.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'all' || job.priority === parseInt(filterPriority);
    return matchesSearch && matchesPriority;
  });

  const totalApplications = jobs.length;
  const interviewingCount = jobs.filter(j => j.status === 2).length;
  const offerCount = jobs.filter(j => j.status === 3).length;
  const successRate = totalApplications > 0 ? ((offerCount / totalApplications) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans flex flex-col">
      <header className="flex-shrink-0">
        <div className="flex justify-between items-end mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 tracking-tight">
            🚀 Job Hunter Pro
          </h1>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Total Pipeline</span>
            <span className="text-3xl font-black text-blue-600">{totalApplications}</span>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Interviews</span>
            <span className="text-3xl font-black text-yellow-500">{interviewingCount}</span>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Offers</span>
            <span className="text-3xl font-black text-green-500">{offerCount}</span>
          </div>
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-5 rounded-xl shadow-sm flex flex-col">
            <span className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-1">Win Rate</span>
            <span className="text-3xl font-black text-white">{successRate}%</span>
            <div className="w-full bg-gray-700 h-1.5 mt-3 rounded-full overflow-hidden">
              <div className="bg-green-400 h-full transition-all duration-1000 ease-out" style={{ width: `${successRate}%` }}></div>
            </div>
          </div>
        </div>

        {upcomingInterviews.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-orange-400 p-4 rounded-r-xl shadow-sm flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⏰</span>
              <h3 className="font-bold text-orange-800">Upcoming Action Required:</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {upcomingInterviews.map(job => (
                <div key={`alert-${job.id}`} className="bg-white px-3 py-1.5 rounded-lg shadow-sm border border-orange-100 text-sm">
                  <span className="font-bold text-gray-800">{job.companyName}</span>
                  <span className="text-gray-500 mx-2">|</span>
                  <span className="font-semibold text-orange-600">
                    {getInterviewStatus(job.interviewDate).text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col xl:flex-row gap-4 mb-10 bg-white p-4 rounded-xl shadow-sm border border-gray-200 justify-between items-center">
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            <div className="relative w-full sm:w-64">
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
              <input type="text" placeholder="Search company..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition" />
            </div>
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="w-full sm:w-auto border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 outline-none text-sm font-semibold focus:ring-2 focus:ring-blue-500 transition cursor-pointer">
              <option value="all">⚡ All Priorities</option>
              <option value="2">🔴 High Priority</option>
              <option value="1">🟡 Med Priority</option>
              <option value="0">🟢 Low Priority</option>
            </select>
          </div>

          <form onSubmit={handleAddJob} className="flex flex-wrap sm:flex-nowrap gap-2 w-full xl:w-auto pt-4 xl:pt-0 border-t xl:border-t-0 border-gray-100">
            <input type="text" placeholder="Company" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} className="flex-1 w-full sm:w-32 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            <input type="text" placeholder="Role" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="flex-1 w-full sm:w-32 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
            <select value={newStatus} onChange={(e) => setNewStatus(parseInt(e.target.value))} className="border border-gray-300 rounded-lg px-2 py-2 bg-white outline-none text-sm">
              {Object.entries(COLUMNS).map(([key, config]) => (<option key={key} value={key}>to: {config.title.split(' ')[0]}</option>))}
            </select>
            <select value={newPriority} onChange={(e) => setNewPriority(parseInt(e.target.value))} className="border border-gray-300 rounded-lg px-2 py-2 bg-white outline-none text-sm font-semibold">
              <option value={0}>🟢 Low</option>
              <option value={1}>🟡 Med</option>
              <option value={2}>🔴 High</option>
            </select>
            <button type="submit" className="bg-blue-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition active:scale-95 text-sm">Add</button>
          </form>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-10">
        {Object.entries(COLUMNS).map(([statusKey, columnConfig]) => {
          const statusInt = parseInt(statusKey);
          const columnJobs = filteredJobs.filter(job => job.status === statusInt);

          return (
            <div key={statusInt} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, statusInt)} className={`rounded-2xl p-5 border-2 ${columnConfig.color} ${columnConfig.border} flex flex-col h-fit min-h-[200px] transition-all`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-700">{columnConfig.title}</h2>
                <span className="bg-white px-3 py-1 rounded-full text-xs font-black shadow-sm text-gray-500 border border-gray-100">
                  {columnJobs.length}
                </span>
              </div>

              <div className="space-y-4">
                {columnJobs.map(job => {
                  const priorityLevel = job.priority ?? 1; 
                  const pConfig = PRIORITIES[priorityLevel];
                  const interviewStatus = getInterviewStatus(job.interviewDate);

                  return (
                    <div key={job.id} draggable onDragStart={(e) => handleDragStart(e, job.id)} className={`bg-white p-5 rounded-2xl shadow-sm border-y border-r border-gray-100 border-l-8 ${pConfig.color} cursor-grab active:cursor-grabbing hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-black text-gray-900 text-lg leading-tight break-all">{job.companyName}</h3>
                            <select value={priorityLevel} onChange={(e) => handleUpdateField(job, 'priority', parseInt(e.target.value))} className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase cursor-pointer outline-none ${pConfig.badge} appearance-none text-center`}>
                              <option value={2}>HIGH</option>
                              <option value={1}>MED</option>
                              <option value={0}>LOW</option>
                            </select>
                          </div>
                          <p className="text-sm font-medium text-gray-500 tracking-wider break-all">{job.jobTitle}</p>
                        </div>
                        <button onClick={() => handleDeleteJob(job.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1 -mr-2 -mt-1"><span className="text-xl">×</span></button>
                      </div>

                      {/* 💡 修复 2：只有当 status === 2 (Interviewing) 时，才渲染时间选择器 */}
                      {job.status === 2 && (
                        <div className="mt-5 pt-4 border-t border-gray-50 relative">
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-[10px] text-gray-400 font-black uppercase tracking-[0.1em]">Interview Schedule</label>
                            {interviewStatus && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${interviewStatus.color}`}>
                                {interviewStatus.text}
                              </span>
                            )}
                          </div>
                          <input type="datetime-local" value={formatDateForInput(job.interviewDate)} onChange={(e) => handleUpdateField(job, 'interviewDate', e.target.value ? e.target.value : null)} className="text-xs border border-gray-100 rounded-xl p-2 w-full text-gray-600 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-between xl:hidden">
                         <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Move:</label>
                         <select value={job.status} onChange={(e) => handleMoveJob(job.id, parseInt(e.target.value))} className="text-[10px] border-none bg-transparent font-bold text-blue-400 focus:ring-0 cursor-pointer">
                           {Object.entries(COLUMNS).map(([k, c]) => (<option key={k} value={k}>{c.title.split(' ')[0]}</option>))}
                        </select>
                      </div>
                    </div>
                  );
                })}
                {columnJobs.length === 0 && (
                  <div className="py-8 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center">
                    <p className="text-gray-300 text-sm font-medium italic">No applications match</p>
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