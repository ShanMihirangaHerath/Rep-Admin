import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, MapPin, Activity, CheckCircle, Loader2, Calendar } from 'lucide-react';

const DashboardOverview = () => {
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState({
    activeReps: 0,
    totalLocations: 0,
    todaysVisits: 0,
    completedVisits: 0,
    repStats: [],
    chartData: [],
    categoryStats: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`http://157.230.244.87:5000/api/dashboard-stats?date=${filterDate}`);
        setStats(res.data);
      } catch (error) {
        console.error("Error fetching stats", error);
      }
      setLoading(false);
    };
    fetchStats();
  }, [filterDate]);

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      
      {/* 🚀 Mobile & Desktop Responsive Filter Section - FIXED OVERFLOW */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100 gap-4 w-full box-border">
        <h2 className="text-lg font-bold text-slate-800">Overview Dashboard</h2>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center w-full md:w-auto gap-3">
          <label className="text-sm font-semibold text-slate-600 flex items-center whitespace-nowrap">
            <Calendar className="w-4 h-4 mr-1" /> Filter by Date:
          </label>
          <div className="flex flex-row w-full sm:w-auto gap-2">
            <input 
              type="date" 
              value={filterDate === 'all' ? '' : filterDate}
              onChange={(e) => setFilterDate(e.target.value || 'all')}
              className="border-2 border-slate-200 rounded-lg px-2 sm:px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none flex-1 w-full"
            />
            <button 
              onClick={() => setFilterDate('all')}
              className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${filterDate === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              All Time
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64 w-full"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : (
        <>
          {/* 🚀 Top Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full">
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-100 flex items-center min-w-0">
              <div className="p-3 md:p-4 bg-blue-50 rounded-lg mr-4 flex-shrink-0"><Users className="w-6 h-6 text-blue-600" /></div>
              <div className="truncate">
                <p className="text-xs md:text-sm font-medium text-slate-500 truncate">Total Reps</p>
                <h3 className="text-xl md:text-2xl font-bold text-slate-800">{stats.activeReps}</h3>
              </div>
            </div>
            
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-100 flex items-center min-w-0">
              <div className="p-3 md:p-4 bg-purple-50 rounded-lg mr-4 flex-shrink-0"><MapPin className="w-6 h-6 text-purple-600" /></div>
              <div className="truncate">
                <p className="text-xs md:text-sm font-medium text-slate-500 truncate">Total DB Locations</p>
                <h3 className="text-xl md:text-2xl font-bold text-slate-800">{stats.totalLocations}</h3>
              </div>
            </div>

            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-100 flex items-center min-w-0">
              <div className="p-3 md:p-4 bg-orange-50 rounded-lg mr-4 flex-shrink-0"><Activity className="w-6 h-6 text-orange-600" /></div>
              <div className="truncate">
                <p className="text-xs md:text-sm font-medium text-slate-500 truncate">Locations Assigned</p>
                <h3 className="text-xl md:text-2xl font-bold text-slate-800">{stats.todaysVisits}</h3>
              </div>
            </div>

            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-100 flex items-center min-w-0">
              <div className="p-3 md:p-4 bg-green-50 rounded-lg mr-4 flex-shrink-0"><CheckCircle className="w-6 h-6 text-green-600" /></div>
              <div className="truncate">
                <p className="text-xs md:text-sm font-medium text-slate-500 truncate">Visited & Updated</p>
                <h3 className="text-xl md:text-2xl font-bold text-slate-800">{stats.completedVisits}</h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
            {/* 🚀 Chart Section */}
            <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-100 w-full min-w-0">
              <h3 className="text-base md:text-lg font-semibold text-slate-800 mb-4 md:mb-6">Activity Trend (Last 7 Days)</h3>
              <div className="h-60 md:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                    <Tooltip cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }} />
                    <Line type="monotone" dataKey="visited" stroke="#0A192F" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 🚀 Rep Target Completion Table - Mobile Scroll Fix */}
            <div className="lg:col-span-1 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col w-full min-w-0">
              <h3 className="text-base md:text-lg font-semibold text-slate-800 mb-4">Rep Performance</h3>
              <div className="overflow-x-auto w-full flex-1 rounded-lg">
                <div className="w-full max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  <table className="w-full text-left min-w-[250px]">
                    <thead className="sticky top-0 bg-white z-10">
                      <tr className="border-b border-slate-200 text-xs md:text-sm text-slate-500">
                        <th className="pb-2 font-medium">Rep Name</th>
                        <th className="pb-2 text-center font-medium" title="Targets Assigned">Assigned</th>
                        <th className="pb-2 text-center font-medium" title="Visits Recorded">Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.repStats.length === 0 ? (
                        <tr><td colSpan="3" className="py-4 text-center text-sm text-slate-400">No data available</td></tr>
                      ) : stats.repStats.map((rep) => (
                        <tr key={rep.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                          <td className="py-3 text-sm md:text-base font-medium text-slate-700 break-words">{rep.first_name} {rep.last_name}</td>
                          <td className="py-3 text-center text-sm md:text-base text-orange-600 font-bold">{rep.total_assigned}</td>
                          <td className="py-3 text-center text-sm md:text-base text-green-600 font-bold">{rep.completed || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
          </div>
          {/* 🚀 Category Stats Section */}
          <div className="w-full mt-2">
            <h3 className="text-base md:text-lg font-semibold text-slate-800 mb-4">Location Statistics by Category</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {stats.categoryStats && stats.categoryStats.length === 0 ? (
                <div className="col-span-full bg-white p-6 rounded-xl border border-slate-100 text-center text-sm text-slate-500">
                  No category data available
                </div>
              ) : (
                stats.categoryStats?.map((cat, index) => (
                  <div key={index} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow">
                    <h4 className="text-lg font-bold text-slate-700 mb-3 border-b border-slate-100 pb-2">
                      {cat.category || 'Uncategorized'}
                    </h4>
                    
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-500">Total in DB:</span>
                      <span className="text-sm font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{cat.total}</span>
                    </div>
                    
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-500">Ongoing:</span>
                      <span className="text-sm font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">{cat.ongoing}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-500">Completed:</span>
                      <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">{cat.completed}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardOverview;