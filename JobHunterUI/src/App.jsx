import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Ensure this matches your backend port (5244)
const API_URL = 'http://localhost:5244/api/JobApplications';


const COLUMNS = {
  0: { title: "Wishlist", icon: "📝", bg: "bg-slate-100/60", text: "text-slate-600" },
  1: { title: "Applied", icon: "📤", bg: "bg-blue-50/60", text: "text-blue-600" },
  2: { title: "Interviewing", icon: "🗣️", bg: "bg-amber-50/60", text: "text-amber-600" },
  3: { title: "Offer", icon: "🏆", bg: "bg-emerald-50/60", text: "text-emerald-600" },
  4: { title: "Rejected", icon: "💔", bg: "bg-rose-50/60", text: "text-rose-600" }
};


const PRIORITIES = {
  0: { label: "Low", color: "border-l-emerald-400", badge: "bg-emerald-100/80 text-emerald-700" },
  1: { label: "Medium", color: "border-l-amber-400", badge: "bg-amber-100/80 text-amber-700" },
  2: { label: "High", color: "border-l-rose-500", badge: "bg-rose-100/80 text-rose-700" }
};

const MY_SKILLS = [
  "C#", ".NET", "React", "JavaScript", "SQL Server", "SQL", "Docker", 
  "Git", "Tailwind", "CSS", "HTML", "REST API", "Frontend", "Backend", 
  "Full Stack", "Agile", "MVC", "Entity Framework"
];

export default function App() {
  const [activeTab, setActiveTab] = useState('kanban'); 
  const [jdText, setJdText] = useState(''); 

  const [jobs, setJobs] = useState([]);
  const [newCompany, setNewCompany] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newStatus, setNewStatus] = useState(0); 
  const [newPriority, setNewPriority] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all'); 
  const [editingJob, setEditingJob] = useState(null);

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    try {
      const response = await axios.get(API_URL);
      setJobs(response.data);
    } catch (error) { console.error("Error fetching jobs:", error); }
  };

  const handleAddJob = async (e) => {
    e.preventDefault();
    if (!newCompany || !newTitle) return;
    const newJob = { companyName: newCompany, jobTitle: newTitle, status: newStatus, priority: newPriority };
    try {
      const response = await axios.post(API_URL, newJob);
      setJobs([...jobs, response.data]);
      setNewCompany(''); setNewTitle(''); setNewStatus(0); setNewPriority(1); 
    } catch (error) { console.error("Error adding job:", error); }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job application?")) return;
    try {
      await axios.delete(`${API_URL}/${jobId}`);
      setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
      if(editingJob && editingJob.id === jobId) setEditingJob(null);
    } catch (error) { console.error("Error deleting job:", error); }
  };

  const handleUpdateField = async (job, fieldName, newValue) => {
    const updatedJob = { ...job, [fieldName]: newValue };
    setJobs(prevJobs => prevJobs.map(j => j.id === job.id ? updatedJob : j));
    try { await axios.put(`${API_URL}/${job.id}`, updatedJob); } 
    catch (error) { console.error("Error updating:", error); fetchJobs(); }
  };

  const handleMoveJob = async (jobId, newStatusInt) => {
    setJobs(prevJobs => prevJobs.map(job => job.id === jobId ? { ...job, status: newStatusInt } : job));
    try { await axios.put(`${API_URL}/${jobId}/status`, newStatusInt, { headers: { 'Content-Type': 'application/json' } }); } 
    catch (error) { console.error("Error moving status:", error); fetchJobs(); }
  };

  const openModal = (job) => setEditingJob({ ...job });
  const handleModalChange = (field, value) => setEditingJob(prev => ({ ...prev, [field]: value }));
  const saveModalDetails = async () => {
    setJobs(prevJobs => prevJobs.map(j => j.id === editingJob.id ? editingJob : j));
    try { await axios.put(`${API_URL}/${editingJob.id}`, editingJob); setEditingJob(null); } 
    catch (error) { console.error("Error saving details:", error); fetchJobs(); }
  };

  const handleDragStart = (e, jobId) => { e.dataTransfer.setData("jobId", jobId); };
  const handleDragOver = (e) => { e.preventDefault(); };
  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    handleMoveJob(parseInt(e.dataTransfer.getData("jobId")), newStatus);
  };

  const formatDateForInput = (dateString) => dateString ? dateString.slice(0, 16) : '';

  const getInterviewStatus = (dateString) => {
    if (!dateString) return null;
    const diffMs = new Date(dateString) - new Date();
    if (diffMs < 0) return { text: "Completed", isUrgent: false, color: "bg-slate-100 text-slate-500" };
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffHours < 24) return { text: `🔥 In ${diffHours} hours!`, isUrgent: true, color: "bg-rose-500 text-white animate-pulse shadow-sm" };
    else if (diffDays <= 7) return { text: `⏳ In ${diffDays} days`, isUrgent: true, color: "bg-amber-100 text-amber-800" };
    return { text: `In ${diffDays} days`, isUrgent: false, color: "bg-blue-50 text-blue-600" };
  };

  const renderHighlightedJD = (text) => {
    if (!text) return <p className="text-slate-400 italic">Paste JD text on the left to see magic...</p>;
    const sortedSkills = [...MY_SKILLS].sort((a, b) => b.length - a.length);
    const escapedSkills = sortedSkills.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escapedSkills.join('|')})`, 'gi');
    const parts = text.split(regex);
    let matchCount = 0;

    const renderedText = parts.map((part, i) => {
      const isSkill = MY_SKILLS.find(s => s.toLowerCase() === part.toLowerCase());
      if (isSkill) {
        matchCount++;
        return <mark key={i} className="bg-emerald-200/60 text-emerald-900 font-bold px-1.5 py-0.5 rounded-md shadow-sm">{part}</mark>;
      }
      return <span key={i}>{part}</span>;
    });

    return (
      <>
        <div className="mb-4 pb-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-700">Analysis Result</h3>
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
            🔥 Found {matchCount} skill matches!
          </span>
        </div>
        <div className="whitespace-pre-wrap leading-relaxed text-slate-600 text-sm">
          {renderedText}
        </div>
      </>
    );
  };

  const upcomingInterviews = jobs.filter(job => job.status === 2 && job.interviewDate && new Date(job.interviewDate) > new Date()).sort((a, b) => new Date(a.interviewDate) - new Date(b.interviewDate)).slice(0, 2); 
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || job.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'all' || job.priority === parseInt(filterPriority);
    return matchesSearch && matchesPriority;
  });
  
  const totalApplications = jobs.length;
  const interviewingCount = jobs.filter(j => j.status === 2).length;
  const offerCount = jobs.filter(j => j.status === 3).length;
  const successRate = totalApplications > 0 ? ((offerCount / totalApplications) * 100).toFixed(1) : 0;

  return (

    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans flex flex-col relative text-slate-800 selection:bg-indigo-100 selection:text-indigo-900">
      
      <header className="flex-shrink-0 max-w-[1600px] mx-auto w-full">
        <div className="flex justify-between items-end mb-6">
          <div className="flex items-center gap-3">
            <span className="text-4xl drop-shadow-sm">🚀</span>
     
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent pb-1">
              Job Hunter Pro
            </h1>
          </div>
        </div>

        
        <div className="flex gap-8 mb-8 border-b border-slate-200">
          <button onClick={() => setActiveTab('kanban')} className={`pb-3 text-sm uppercase tracking-widest font-bold transition-all relative ${activeTab === 'kanban' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
            Kanban Board
            {activeTab === 'kanban' && <div className="absolute bottom-[-1px] left-0 w-full h-[3px] bg-indigo-600 rounded-t-full shadow-[0_-2px_10px_rgba(79,70,229,0.5)]"></div>}
          </button>
          <button onClick={() => setActiveTab('matcher')} className={`pb-3 text-sm uppercase tracking-widest font-bold transition-all relative ${activeTab === 'matcher' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
            JD Matcher ⚡
            {activeTab === 'matcher' && <div className="absolute bottom-[-1px] left-0 w-full h-[3px] bg-indigo-600 rounded-t-full shadow-[0_-2px_10px_rgba(79,70,229,0.5)]"></div>}
          </button>
        </div>
      </header>

      {/* ========================================= */}
      {/*  Kanban Board */}
      {/* ========================================= */}
      {activeTab === 'kanban' && (
        <div className="animate-fade-in max-w-[1600px] mx-auto w-full flex-1 flex flex-col">
          
        
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/70 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Pipeline</span>
              <span className="text-3xl font-black text-indigo-600 drop-shadow-sm">{totalApplications}</span>
            </div>
            <div className="bg-white/70 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Interviews</span>
              <span className="text-3xl font-black text-amber-500 drop-shadow-sm">{interviewingCount}</span>
            </div>
            <div className="bg-white/70 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Offers</span>
              <span className="text-3xl font-black text-emerald-500 drop-shadow-sm">{offerCount}</span>
            </div>
            <div className="bg-slate-900 p-5 rounded-2xl shadow-lg flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 relative z-10">Win Rate</span>
              <span className="text-3xl font-black text-white relative z-10">{successRate}%</span>
              <div className="w-full bg-slate-800 h-1.5 mt-3 rounded-full overflow-hidden relative z-10">
                <div className="bg-gradient-to-r from-emerald-400 to-emerald-300 h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(52,211,153,0.5)]" style={{ width: `${successRate}%` }}></div>
              </div>
            </div>
          </div>

          {upcomingInterviews.length > 0 && (
            <div className="mb-6 bg-amber-50/80 backdrop-blur-sm border border-amber-200/50 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center gap-2">
                <span className="text-2xl animate-bounce">⏰</span>
                <h3 className="font-bold text-amber-800 tracking-tight">Upcoming Action:</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {upcomingInterviews.map(job => (
                  <div key={`alert-${job.id}`} className="bg-white px-3 py-1.5 rounded-xl shadow-sm border border-amber-100/50 text-sm flex items-center gap-2">
                    <span className="font-bold text-slate-800">{job.companyName}</span>
                    <span className="text-slate-300">|</span>
                    <span className="font-semibold text-rose-500">{getInterviewStatus(job.interviewDate).text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

    
          <div className="flex flex-col xl:flex-row gap-4 mb-8 bg-white/80 backdrop-blur-md p-3 rounded-3xl shadow-sm border border-slate-100/50 justify-between items-center w-full">
            
            <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto px-2">
              <div className="relative w-full sm:w-56">
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
                <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl pl-9 pr-4 py-2 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm transition font-medium text-slate-700" />
              </div>
              <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="w-full sm:w-auto bg-slate-50 border-none rounded-xl px-4 py-2 outline-none text-sm font-bold text-slate-600 focus:ring-2 focus:ring-indigo-500/20 transition cursor-pointer">
                <option value="all">⚡ All Priorities</option>
                <option value="2">🔴 High</option>
                <option value="1">🟡 Med</option>
                <option value="0">🟢 Low</option>
              </select>
            </div>

            <div className="h-px xl:h-8 w-full xl:w-px bg-slate-100 mx-2"></div>

            <form onSubmit={handleAddJob} className="flex flex-wrap sm:flex-nowrap gap-2 w-full xl:w-auto px-2">
              <input type="text" placeholder="Company" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} className="flex-1 w-full sm:w-32 bg-slate-50 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium" />
              <input type="text" placeholder="Role" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="flex-1 w-full sm:w-32 bg-slate-50 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium" />
              <select value={newStatus} onChange={(e) => setNewStatus(parseInt(e.target.value))} className="bg-slate-50 border-none rounded-xl px-3 py-2 outline-none text-sm font-bold text-slate-600">
                {Object.entries(COLUMNS).map(([key, config]) => (<option key={key} value={key}>to: {config.title}</option>))}
              </select>
              <select value={newPriority} onChange={(e) => setNewPriority(parseInt(e.target.value))} className="bg-slate-50 border-none rounded-xl px-3 py-2 outline-none text-sm font-bold text-slate-600">
                <option value={0}>🟢 Low</option>
                <option value={1}>🟡 Med</option>
                <option value={2}>🔴 High</option>
              </select>
              <button type="submit" className="bg-indigo-600 text-white font-bold px-6 py-2 rounded-xl hover:bg-indigo-700 transition shadow-md hover:shadow-lg active:scale-95 text-sm">Add</button>
            </form>
          </div>

   
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-10 flex-1">
            {Object.entries(COLUMNS).map(([statusKey, columnConfig]) => {
              const statusInt = parseInt(statusKey);
              const columnJobs = filteredJobs.filter(job => job.status === statusInt);

              return (
                <div key={statusInt} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, statusInt)} className={`rounded-3xl p-5 ${columnConfig.bg} flex flex-col h-fit min-h-[200px] transition-all border border-white/40 shadow-sm backdrop-blur-md`}>
                  <div className="flex justify-between items-center mb-5 px-1">
                    <h2 className={`text-lg font-extrabold flex items-center gap-2 ${columnConfig.text}`}>
                      <span>{columnConfig.icon}</span> {columnConfig.title}
                    </h2>
                    <span className="bg-white/60 px-3 py-1 rounded-full text-xs font-black shadow-sm text-slate-500">{columnJobs.length}</span>
                  </div>

                  <div className="space-y-4">
                    {columnJobs.map(job => {
                      const priorityLevel = job.priority ?? 1; 
                      const pConfig = PRIORITIES[priorityLevel];
                      const interviewStatus = getInterviewStatus(job.interviewDate);

                      return (
                        <div key={job.id} draggable onDragStart={(e) => handleDragStart(e, job.id)} className={`bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-l-4 ${pConfig.color} cursor-grab active:cursor-grabbing hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden`}>
                          
                          <div className="flex justify-between items-start">
                            <div className="flex-1 pr-6">
                              <div className="flex items-center gap-2 mb-1.5">
                                <h3 className="font-black text-slate-800 text-lg leading-tight break-all tracking-tight">{job.companyName}</h3>
                                <select value={priorityLevel} onChange={(e) => handleUpdateField(job, 'priority', parseInt(e.target.value))} className={`text-[9px] tracking-widest font-black px-2 py-0.5 rounded-full uppercase cursor-pointer outline-none ${pConfig.badge} appearance-none text-center shadow-sm`}>
                                  <option value={2}>HIGH</option>
                                  <option value={1}>MED</option>
                                  <option value={0}>LOW</option>
                                </select>
                              </div>
                              <p className="text-sm font-bold text-indigo-500/80 tracking-wide break-all">{job.jobTitle}</p>
                            </div>
                            
                            <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-slate-100 p-1">
                              <button onClick={() => openModal(job)} className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-md hover:bg-indigo-50 transition" title="View Details">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                              </button>
                              <button onClick={() => handleDeleteJob(job.id)} className="text-slate-400 hover:text-rose-500 p-1.5 rounded-md hover:bg-rose-50 transition" title="Delete">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                              </button>
                            </div>
                          </div>

                          {job.status === 2 && (
                            <div className="mt-5 pt-4 border-t border-slate-50 relative bg-slate-50/50 -mx-5 -mb-5 p-5 rounded-b-2xl">
                              <div className="flex justify-between items-center mb-2">
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Schedule</label>
                                {interviewStatus && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${interviewStatus.color}`}>{interviewStatus.text}</span>}
                              </div>
                              <input type="datetime-local" value={formatDateForInput(job.interviewDate)} onChange={(e) => handleUpdateField(job, 'interviewDate', e.target.value ? e.target.value : null)} className="text-xs border-none rounded-xl p-2.5 w-full text-slate-600 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-medium cursor-pointer" />
                            </div>
                          )}
                          
                          {job.jobPostingUrl && job.status !== 2 && (
                            <a href={job.jobPostingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-4 text-[11px] font-bold text-slate-400 hover:text-indigo-500 transition-colors uppercase tracking-wider">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                              JD Link
                            </a>
                          )}

                          <div className="mt-4 flex items-center justify-between xl:hidden">
                             <select value={job.status} onChange={(e) => handleMoveJob(job.id, parseInt(e.target.value))} className="text-[10px] border-none bg-slate-50 rounded-lg px-2 py-1 font-bold text-indigo-500 focus:ring-0 cursor-pointer outline-none">
                               <option disabled>Move to...</option>
                               {Object.entries(COLUMNS).map(([k, c]) => (<option key={k} value={k}>{c.title}</option>))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                    {columnJobs.length === 0 && (
                      <div className="py-10 border-2 border-dashed border-slate-200/60 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-2">
                        <span className="text-2xl opacity-50">{columnConfig.icon}</span>
                        <p className="text-xs font-bold tracking-wider uppercase">Empty</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* JD Skill Matcher */}
      {/* ========================================= */}
      {activeTab === 'matcher' && (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 animate-fade-in max-w-[1600px] mx-auto w-full">
          <div className="w-full lg:w-1/2 flex flex-col bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-800 p-5 flex justify-between items-center">
              <h2 className="text-white font-bold flex items-center gap-2 tracking-wide">
                <span>📋</span> Paste Job Description
              </h2>
            </div>
            <textarea value={jdText} onChange={(e) => setJdText(e.target.value)} placeholder="Paste raw text here..." className="flex-1 p-6 w-full resize-none outline-none text-slate-600 leading-relaxed min-h-[500px] bg-slate-50/50" />
          </div>

          <div className="w-full lg:w-1/2 flex flex-col bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-indigo-50 p-5 flex justify-between items-center">
              <h2 className="text-indigo-800 font-bold flex items-center gap-2 tracking-wide">
                <span>✨</span> Highlighted Match
              </h2>
              <button onClick={() => setJdText('')} className="text-xs bg-white text-indigo-600 px-4 py-1.5 rounded-full font-bold shadow-sm hover:shadow transition active:scale-95">Clear</button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto bg-white max-h-[600px]">
              {renderHighlightedJD(jdText)}
            </div>
            <div className="p-5 bg-slate-50 border-t border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">My Skill Database</p>
              <div className="flex flex-wrap gap-2">
                {MY_SKILLS.map(skill => (
                  <span key={skill} className="bg-white border border-slate-200 text-slate-500 text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm">{skill}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

   
      {editingJob && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20 transform transition-all scale-100">
            <div className="bg-slate-50/50 p-6 px-8 border-b border-slate-100 flex justify-between items-center relative">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">{editingJob.companyName}</h2>
                <p className="text-indigo-600 font-bold uppercase tracking-widest text-xs mt-1.5">{editingJob.jobTitle}</p>
              </div>
              <button onClick={() => setEditingJob(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 bg-white hover:bg-slate-100 rounded-full p-2 transition shadow-sm border border-slate-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-6 flex-1 bg-white">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">📍 Location</label>
                <input type="text" placeholder="e.g. Ottawa / Remote" value={editingJob.location || ''} onChange={(e) => handleModalChange('location', e.target.value)} className="w-full bg-slate-50 border-none rounded-xl p-3.5 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium transition-all shadow-inner" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">🔗 Job Posting URL</label>
                <input type="url" placeholder="https://..." value={editingJob.jobPostingUrl || ''} onChange={(e) => handleModalChange('jobPostingUrl', e.target.value)} className="w-full bg-slate-50 border-none rounded-xl p-3.5 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium text-indigo-600 transition-all shadow-inner" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">📝 Interview Notes / Research</label>
                <textarea placeholder="Record your company research..." value={editingJob.notes || ''} onChange={(e) => handleModalChange('notes', e.target.value)} className="w-full bg-slate-50 border-none rounded-xl p-4 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium min-h-[160px] resize-y transition-all shadow-inner leading-relaxed" />
              </div>
            </div>
            
            <div className="p-6 px-8 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button onClick={() => setEditingJob(null)} className="px-6 py-2.5 rounded-xl text-slate-500 font-bold hover:bg-slate-200/50 hover:text-slate-800 transition text-sm">Cancel</button>
              <button onClick={saveModalDetails} className="px-8 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition shadow-md hover:shadow-lg active:scale-95 text-sm">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}