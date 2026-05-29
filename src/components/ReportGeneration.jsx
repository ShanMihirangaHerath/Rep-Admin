import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { FileText, Download, Search, Calendar, User, Loader2, Filter, BarChart3 } from 'lucide-react';

const ReportGeneration = () => {
  const [reports, setReports] = useState([]);
  const [reps, setReps] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [dateType, setDateType] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedRep, setSelectedRep] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [summary, setSummary] = useState({ total: 0, positive: 0, revisit: 0, notFound: 0 });

  useEffect(() => {
    fetchReps();
    generateReport();
  }, []);

  const fetchReps = async () => {
    try {
      const res = await axios.get('http://157.230.244.87:5000/api/reps');
      setReps(res.data);
    } catch (e) { console.error(e); }
  };

  const generateReport = async () => {
    setLoading(true);
    let queryStart = 'all';
    let queryEnd = 'all';

    if (dateType === 'month' && selectedMonth) {
      queryStart = `${selectedMonth}-01`;
      const year = selectedMonth.split('-')[0];
      const month = selectedMonth.split('-')[1];
      const lastDay = new Date(year, month, 0).getDate();
      queryEnd = `${selectedMonth}-${lastDay}`;
    } else if (dateType === 'range') {
      queryStart = startDate || 'all';
      queryEnd = endDate || 'all';
    }

    try {
      const res = await axios.get(`http://157.230.244.87:5000/api/admin/full-report`, {
        params: { startDate: queryStart, endDate: queryEnd, repId: selectedRep, status: selectedStatus }
      });
      const data = res.data;
      setReports(data);
      setSummary({
        total: data.length,
        positive: data.filter(r => r.status === 'Positive').length,
        revisit: data.filter(r => r.status === 'Needs Revisit').length,
        notFound: data.filter(r => r.status === 'Shop Not Found').length,
      });
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const downloadExcel = () => {
    if (reports.length === 0) return alert("No data to download based on current filters.");
    const excelData = reports.map(r => ({
      "Visit Date & Time": new Date(r.visit_date).toLocaleString(),
      "Assigned Date": r.assigned_date,
      "Rep Name": `${r.first_name} ${r.last_name}`,
      "Shop Name": r.shop_name,
      "Category": r.category || 'Pharmacy',
      "Met Person": r.met_person,
      "Person Contact": r.person_contact || 'N/A',
      "Visit Status": r.status,
      "Visit Notes": r.notes || '',
      "Visit Type": r.is_unassigned ? 'Spontaneous (Unassigned)' : 'Assigned Target'
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Advanced_Visit_Report");
    XLSX.writeFile(workbook, `Rep_Report_${new Date().getTime()}.xlsx`);
  };

  const filteredReports = reports.filter(r => 
    r.shop_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.met_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.first_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[calc(100vh-120px)] p-3 sm:p-4 md:p-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#0A192F] flex items-center">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-blue-600 flex-shrink-0" /> Advanced Report Generator
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Filter by date, rep, or status and export to Excel.</p>
        </div>
        <button
          onClick={downloadExcel}
          className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center shadow-md transition-colors"
        >
          <Download className="w-4 h-4 mr-2" /> Export to Excel
        </button>
      </div>

      {/* Filter Panel */}
      <div className="bg-slate-50 p-3 sm:p-5 rounded-xl border border-slate-200 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

          {/* Time Period */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center">
              <Calendar className="w-3 h-3 mr-1"/> Time Period
            </label>
            <select
              value={dateType}
              onChange={(e) => setDateType(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:border-blue-500 outline-none bg-white"
            >
              <option value="all">All Time</option>
              <option value="month">By Month</option>
              <option value="range">Custom Date Range</option>
            </select>
          </div>

          {/* Dynamic Date Input */}
          {dateType === 'month' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Select Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:border-blue-500 outline-none bg-white"
              />
            </div>
          )}
          {dateType === 'range' && (
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">From Date</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:border-blue-500 outline-none bg-white" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">To Date</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:border-blue-500 outline-none bg-white" />
                </div>
              </div>
            </div>
          )}
          {dateType === 'all' && <div className="hidden lg:block" />}

          {/* Representative */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center">
              <User className="w-3 h-3 mr-1"/> Representative
            </label>
            <select
              value={selectedRep}
              onChange={(e) => setSelectedRep(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:border-blue-500 outline-none bg-white"
            >
              <option value="all">All Representatives</option>
              {reps.map(rep => <option key={rep.id} value={rep.id}>{rep.first_name} {rep.last_name}</option>)}
            </select>
          </div>

          {/* Visit Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center">
              <Filter className="w-3 h-3 mr-1"/> Visit Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:border-blue-500 outline-none bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="Positive">Positive</option>
              <option value="Needs Revisit">Needs Revisit</option>
              <option value="Shop Not Found">Shop Not Found</option>
              <option value="Do Not Visit">Do Not Visit</option>
            </select>
          </div>
        </div>

        {/* Apply Button */}
        <div className="flex justify-end mt-3 sm:mt-4">
          <button
            onClick={generateReport}
            className="w-full sm:w-auto bg-[#0A192F] hover:bg-[#172A45] text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            Apply Filters & Generate Report
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {!loading && reports.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-blue-50 border border-blue-100 p-3 sm:p-4 rounded-xl">
            <p className="text-xs text-blue-600 font-bold uppercase mb-1">Total Visits</p>
            <h3 className="text-xl sm:text-2xl font-bold text-blue-900">{summary.total}</h3>
          </div>
          <div className="bg-green-50 border border-green-100 p-3 sm:p-4 rounded-xl">
            <p className="text-xs text-green-600 font-bold uppercase mb-1">Positive</p>
            <h3 className="text-xl sm:text-2xl font-bold text-green-900">{summary.positive}</h3>
          </div>
          <div className="bg-red-50 border border-red-100 p-3 sm:p-4 rounded-xl">
            <p className="text-xs text-red-600 font-bold uppercase mb-1">Needs Revisit</p>
            <h3 className="text-xl sm:text-2xl font-bold text-red-900">{summary.revisit}</h3>
          </div>
          <div className="bg-slate-100 border border-slate-200 p-3 sm:p-4 rounded-xl">
            <p className="text-xs text-slate-600 font-bold uppercase mb-1">Not Found</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800">{summary.notFound}</h3>
          </div>
        </div>
      )}

      {/* Search Box */}
      <div className="mb-4 relative w-full sm:w-72">
        <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
        <input 
          type="text"
          placeholder="Search by Shop, Rep or Person..."
          className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-full focus:border-blue-500 outline-none"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Report Table */}
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-10 text-slate-500 border border-slate-200 rounded-lg">
          <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-medium text-slate-600">No report data found.</p>
          <p className="text-xs mt-1">Try changing the date, rep, or status filters above.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto border border-slate-200 rounded-lg max-h-[500px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-[#0A192F] text-slate-100 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="p-4 font-semibold whitespace-nowrap">Visit Date</th>
                  <th className="p-4 font-semibold">Rep Name</th>
                  <th className="p-4 font-semibold">Shop Name</th>
                  <th className="p-4 font-semibold">Met Person</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold w-1/4">Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map(r => (
                  <tr key={r.log_id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 whitespace-nowrap text-slate-600 font-medium">
                      {new Date(r.visit_date).toLocaleDateString()}<br/>
                      <span className="text-xs font-normal text-slate-400">{new Date(r.visit_date).toLocaleTimeString()}</span>
                    </td>
                    <td className="p-4 font-bold text-slate-800 whitespace-nowrap">{r.first_name} {r.last_name}</td>
                    <td className="p-4">
                      <div className="font-bold text-blue-800">{r.shop_name}</div>
                      {r.is_unassigned === 1 && (
                        <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full mt-1 border border-purple-200 inline-block">Spontaneous</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-800">👤 {r.met_person}</div>
                      <div className="text-xs text-slate-500 mt-1">📞 {r.person_contact || 'N/A'}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md border text-[11px] font-bold uppercase tracking-wider ${
                        r.status === 'Positive' ? 'bg-green-50 text-green-700 border-green-200' : 
                        r.status === 'Needs Revisit' ? 'bg-red-50 text-red-700 border-red-200' : 
                        'bg-slate-100 text-slate-700 border-slate-200'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 italic text-xs leading-relaxed">
                      {r.notes ? `"${r.notes}"` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {filteredReports.map(r => (
              <div key={r.log_id} className="border border-slate-200 rounded-lg overflow-hidden shadow-sm bg-white">
                {/* Card Header */}
                <div className="bg-[#0A192F] px-4 py-3 flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{r.shop_name}</span>
                  {r.is_unassigned === 1 && (
                    <span className="text-[10px] bg-purple-500 text-white px-2 py-0.5 rounded-full border border-purple-400">Spontaneous</span>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-3 space-y-2 text-xs">
                  {/* Rep + Date row */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-slate-400 font-semibold mb-0.5">Rep Name</p>
                      <p className="font-bold text-slate-800">{r.first_name} {r.last_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 font-semibold mb-0.5">Visit Date</p>
                      <p className="font-medium text-slate-600">{new Date(r.visit_date).toLocaleDateString()}</p>
                      <p className="text-slate-400">{new Date(r.visit_date).toLocaleTimeString()}</p>
                    </div>
                  </div>

                  {/* Met Person */}
                  <div>
                    <p className="text-slate-400 font-semibold mb-0.5">Met Person</p>
                    <p className="font-medium text-slate-800">👤 {r.met_person}</p>
                    <p className="text-slate-500">📞 {r.person_contact || 'N/A'}</p>
                  </div>

                  {/* Status + Notes row */}
                  <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-100">
                    <span className={`px-2.5 py-1 rounded-md border text-[11px] font-bold uppercase tracking-wider ${
                      r.status === 'Positive' ? 'bg-green-50 text-green-700 border-green-200' :
                      r.status === 'Needs Revisit' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-slate-100 text-slate-700 border-slate-200'}`}>
                      {r.status}
                    </span>
                    {r.notes && (
                      <p className="text-slate-500 italic text-right flex-1">"{r.notes}"</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ReportGeneration;
