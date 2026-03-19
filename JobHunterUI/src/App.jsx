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

// 💡 NEW: 你的个人技能数据库 (你可以随时往里面加东西)
const MY_SKILLS = [
  "C#", ".NET", "React", "JavaScript", "SQL Server", "SQL", "Docker", 
  "Git", "Tailwind", "CSS", "HTML", "REST API", "Frontend", "Backend", 
  "Full Stack", "Agile", "MVC", "Entity Framework"
];

export default function App() {
  // --- View State ---
  // 💡 NEW: 导航状态，默认显示 Kanban
  const [activeTab, setActiveTab] = useState('kanban'); // 'kanban' | 'matcher'
  const [jdText, setJdText] = useState(''); // 存放粘贴的 JD 文本

  // --- Kanban State ---
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
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  // ... (保留了你之前所有完美的 Kanban 函数，如 handleAddJob, handleDeleteJob 等)
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
    if (diffMs < 0) return { text: "Completed", isUrgent: false, color: "bg-gray-100 text-gray-500" };
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffHours < 24) return { text: `🔥 In ${diffHours} hours!`, isUrgent: true, color: "bg-red-500 text-white animate-pulse" };
    else if (diffDays <= 7) return { text: `⏳ In ${diffDays} days`, isUrgent: true, color: "bg-yellow-100 text-yellow-800" };
    return { text: `In ${diffDays} days`, isUrgent: false, color: "bg-blue-50 text-blue-600" };
  };

  // 💡 NEW: 核心解析引擎！将普通文本变成带有高亮标签的 React 元素
  const renderHighlightedJD = (text) => {
    if (!text) return <p className="text-gray-400 italic">Paste JD text on the left to see magic...</p>;
    
    // 对技能数组按长度排序（长的优先匹配，比如先匹配 SQL Server，再匹配 SQL）
    const sortedSkills = [...MY_SKILLS].sort((a, b) => b.length - a.length);
    
    // 转义特殊字符（比如 C# 里的 #），生成正则表达式
    const escapedSkills = sortedSkills.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escapedSkills.join('|')})`, 'gi');
    
    // 切割文本，并渲染高亮
    const parts = text.split(regex);
    let matchCount = 0;

    const renderedText = parts.map((part, i) => {
      const isSkill = MY_SKILLS.find(s => s.toLowerCase() === part.toLowerCase());
      if (isSkill) {
        matchCount++;
        return <mark key={i} className="bg-green-200 text-green-900 font-bold px-1.5 py-0.5 rounded shadow-sm">{part}</mark>;
      }
      return <span key={i}>{part}</span>;
    });

    return (
      <>
        <div className="mb-4 pb-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-700">Analysis Result</h3>
          <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">
            🔥 Found {matchCount} skill matches!
          </span>
        </div>
        <div className="whitespace-pre-wrap leading-relaxed text-gray-700 text-sm">
          {renderedText}
        </div>
      </>
    );
  };

  // Kanban Derived State
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans flex flex-col relative">
      <header className="flex-shrink-0">
        <div className="flex justify-between items-end mb-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 tracking-tight">
            🚀 Job Hunter Pro
          </h1>
        </div>

        {/* 💡 NEW: 优雅的页面导航 (Tab Switcher) */}
        <div className="flex gap-8 mb-8 border-b-2 border-gray-200">
          <button 
            onClick={() => setActiveTab('kanban')} 
            className={`pb-3 text-lg font-bold transition-all relative ${activeTab === 'kanban' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Kanban Board
            {activeTab === 'kanban' && <div className="absolute bottom-[-2px] left-0 w-full h-1 bg-blue-600 rounded-t-lg"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('matcher')} 
            className={`pb-3 text-lg font-bold transition-all relative ${activeTab === 'matcher' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            JD Skill Matcher ⚡
            {activeTab === 'matcher' && <div className="absolute bottom-[-2px] left-0 w-full h-1 bg-blue-600 rounded-t-lg"></div>}
          </button>
        </div>
      </header>

      {/* ========================================= */}
      {/* 视图 1： Kanban Board (原来的所有内容) */}
      {/* ========================================= */}
      {activeTab === 'kanban' && (
        <div className="animate-fade-in">
          {/* Dashboard Section */}
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
                    <span className="font-semibold text-orange-600">{getInterviewStatus(job.interviewDate).text}</span>
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

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-10">
            {Object.entries(COLUMNS).map(([statusKey, columnConfig]) => {
              const statusInt = parseInt(statusKey);
              const columnJobs = filteredJobs.filter(job => job.status === statusInt);

              return (
                <div key={statusInt} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, statusInt)} className={`rounded-2xl p-5 border-2 ${columnConfig.color} ${columnConfig.border} flex flex-col h-fit min-h-[200px] transition-all`}>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-700">{columnConfig.title}</h2>
                    <span className="bg-white px-3 py-1 rounded-full text-xs font-black shadow-sm text-gray-500 border border-gray-100">{columnJobs.length}</span>
                  </div>

                  <div className="space-y-4">
                    {columnJobs.map(job => {
                      const priorityLevel = job.priority ?? 1; 
                      const pConfig = PRIORITIES[priorityLevel];
                      const interviewStatus = getInterviewStatus(job.interviewDate);

                      return (
                        <div key={job.id} draggable onDragStart={(e) => handleDragStart(e, job.id)} className={`bg-white p-5 rounded-2xl shadow-sm border-y border-r border-gray-100 border-l-8 ${pConfig.color} cursor-grab active:cursor-grabbing hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group`}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1 pr-6">
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
                            
                            <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openModal(job)} className="text-blue-400 hover:text-blue-600 p-1 mr-1" title="View Details">📝</button>
                              <button onClick={() => handleDeleteJob(job.id)} className="text-gray-300 hover:text-red-500 p-1" title="Delete">🗑️</button>
                            </div>
                          </div>

                          {job.status === 2 && (
                            <div className="mt-5 pt-4 border-t border-gray-50 relative">
                              <div className="flex justify-between items-center mb-2">
                                <label className="text-[10px] text-gray-400 font-black uppercase tracking-[0.1em]">Interview Schedule</label>
                                {interviewStatus && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${interviewStatus.color}`}>{interviewStatus.text}</span>}
                              </div>
                              <input type="datetime-local" value={formatDateForInput(job.interviewDate)} onChange={(e) => handleUpdateField(job, 'interviewDate', e.target.value ? e.target.value : null)} className="text-xs border border-gray-100 rounded-xl p-2 w-full text-gray-600 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                            </div>
                          )}
                          
                          {job.jobPostingUrl && (
                            <a href={job.jobPostingUrl} target="_blank" rel="noreferrer" className="block mt-4 text-xs font-bold text-blue-500 hover:text-blue-700 truncate">
                              🔗 Link to JD
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* 视图 2： JD Skill Matcher (全新的页面逻辑) */}
      {/* ========================================= */}
      {activeTab === 'matcher' && (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 animate-fade-in">
          
          {/* 左侧：输入框 */}
          <div className="w-full lg:w-1/2 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-800 p-4 border-b border-gray-200">
              <h2 className="text-white font-bold flex items-center gap-2">
                <span>📋</span> Paste Job Description Here
              </h2>
            </div>
            <textarea 
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Copy and paste the raw text from LinkedIn, Indeed, etc..."
              className="flex-1 p-5 w-full resize-none outline-none text-gray-600 leading-relaxed min-h-[400px]"
            />
          </div>

          {/* 右侧：分析结果 */}
          <div className="w-full lg:w-1/2 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-blue-50 p-4 border-b border-blue-100 flex justify-between items-center">
              <h2 className="text-blue-800 font-bold flex items-center gap-2">
                <span>✨</span> Highlighted Match
              </h2>
              <button 
                onClick={() => setJdText('')}
                className="text-xs bg-white border border-blue-200 text-blue-600 px-3 py-1 rounded hover:bg-blue-100 transition"
              >
                Clear
              </button>
            </div>
            <div className="flex-1 p-5 overflow-y-auto bg-gray-50 max-h-[600px]">
              {renderHighlightedJD(jdText)}
            </div>
            
            {/* 你的技能树提示 */}
            <div className="p-4 bg-white border-t border-gray-100">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">My Skill Database:</p>
              <div className="flex flex-wrap gap-1.5">
                {MY_SKILLS.map(skill => (
                  <span key={skill} className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================= */}
      {/* 弹窗： Details Modal (依然保留且正常工作) */}
      {/* ========================================= */}
      {editingJob && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-gray-800">{editingJob.companyName}</h2>
                <p className="text-blue-600 font-bold uppercase tracking-wider text-sm mt-1">{editingJob.jobTitle}</p>
              </div>
              <button onClick={() => setEditingJob(null)} className="text-gray-400 hover:text-gray-800 text-2xl p-2 leading-none transition">×</button>
            </div>
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">📍 Location</label>
                  <input type="text" placeholder="e.g. Ottawa / Remote" value={editingJob.location || ''} onChange={(e) => handleModalChange('location', e.target.value)} className="w-full border border-gray-200 rounded-lg p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">🔗 Job Posting URL</label>
                <input type="url" placeholder="https://..." value={editingJob.jobPostingUrl || ''} onChange={(e) => handleModalChange('jobPostingUrl', e.target.value)} className="w-full border border-gray-200 rounded-lg p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm text-blue-600" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">📝 Interview Notes / Research</label>
                <textarea placeholder="Record your company research..." value={editingJob.notes || ''} onChange={(e) => handleModalChange('notes', e.target.value)} className="w-full border border-gray-200 rounded-lg p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm min-h-[150px] resize-y" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setEditingJob(null)} className="px-5 py-2.5 rounded-lg text-gray-600 font-bold hover:bg-gray-200 transition text-sm">Cancel</button>
              <button onClick={saveModalDetails} className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition shadow-md active:scale-95 text-sm">Save Details</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}