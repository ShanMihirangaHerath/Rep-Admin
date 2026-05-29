import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { Wallet, Download, Loader2, Settings2, HandCoins, Search } from 'lucide-react';

const SalaryManagement = () => {
  const [activeView, setActiveView] = useState('overview'); 
  const [globalSearch, setGlobalSearch] = useState(''); 
  
  const [reps, setReps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRep, setSelectedRep] = useState(null);
  const [baseSalaryInput, setBaseSalaryInput] = useState('');
  const [modalType, setModalType] = useState(''); 
  const [submitting, setSubmitting] = useState(false);

  const [reports, setReports] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [filterRep, setFilterRep] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => { 
    if(activeView === 'overview') fetchBalances(); 
    else fetchReports();
  }, [activeView]);

  const fetchBalances = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://157.230.244.87:5000/api/admin/salary-balances');
      setReps(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchReports = async () => {
    setReportLoading(true);
    try {
      const res = await axios.get('http://157.230.244.87:5000/api/admin/salary-reports', {
        params: { startDate: startDate || 'all', endDate: endDate || 'all', repId: filterRep }
      });
      setReports(res.data);
    } catch (e) { console.error(e); }
    setReportLoading(false);
  };

  const handleSetBaseSalary = async () => {
    if(!baseSalaryInput || isNaN(baseSalaryInput)) return;
    setSubmitting(true);
    try {
      await axios.post('http://157.230.244.87:5000/api/admin/set-base-salary', {
        rep_id: selectedRep.id, base_salary: parseFloat(baseSalaryInput)
      });
      setModalType(''); fetchBalances(); alert("Base Salary Updated!");
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  const handleSettleMonth = async () => {
    setSubmitting(true);
    try {
      const res = await axios.post('http://157.230.244.87:5000/api/admin/settle-month', { rep_id: selectedRep.id });
      setModalType(''); fetchBalances(); 
      alert(`Month Settled Successfully! Net Handover Amount: Rs. ${parseFloat(res.data.netPayable).toFixed(2)}`);
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  const updateRequestStatus = async (id, status) => {
    if (status === 'Rejected') {
      const confirmReject = window.confirm("Are you sure you want to REJECT this request? The deducted amount will be refunded to the rep's Available Balance.");
      if(!confirmReject) return;
    }
    try {
      await axios.put(`http://157.230.244.87:5000/api/admin/salary-requests/${id}`, { status });
      fetchReports();
      if(activeView === 'overview') fetchBalances();
    } catch(e) { console.error(e); }
  };

  const downloadExcel = () => {
    if (reports.length === 0) return alert("No data to download!");
    const excelData = reports.map(r => ({
      "Date": new Date(r.requested_at).toLocaleString(),
      "Rep Name": `${r.first_name} ${r.last_name}`,
      "Requested Amount (Rs)": r.amount,
      "Is Advance?": r.is_advance === 1 ? 'Yes' : 'No',
      "10% Penalty Applied": r.penalty_applied,
      "Status": r.status
    }));
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Salary_Reports");
    XLSX.writeFile(wb, `Salary_Advances_Report_${new Date().getTime()}.xlsx`);
  };

  const filteredReps = reps.filter(rep => 
    `${rep.first_name || ''} ${rep.last_name || ''}`.toLowerCase().includes(globalSearch.toLowerCase())
  );

  const filteredReports = reports.filter(r => {
    const fullName = `${r.first_name || ''} ${r.last_name || ''}`.toLowerCase();
    const status = (r.status || '').toLowerCase();
    const searchLower = globalSearch.toLowerCase();
    return fullName.includes(searchLower) || status.includes(searchLower);
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[calc(100vh-120px)] p-3 sm:p-4 md:p-6">
      
      {/* Header */}
      <div className="flex flex-col gap-3 mb-4 sm:mb-6 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-base sm:text-xl font-bold text-[#0A192F] flex items-center">
            <Wallet className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-blue-600 flex-shrink-0" />
            <span>Advanced Salary & Advance Management</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Manage base salaries, auto-deduct 10% penalties, and view detailed reports.</p>
        </div>
        
        {/* Search + View Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by Rep Name..." 
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* View Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveView('overview')}
              className={`flex-1 sm:flex-none px-3 py-2 text-xs sm:text-sm font-bold rounded-md transition-colors whitespace-nowrap ${activeView === 'overview' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Overview & Settlements
            </button>
            <button
              onClick={() => setActiveView('reports')}
              className={`flex-1 sm:flex-none px-3 py-2 text-xs sm:text-sm font-bold rounded-md transition-colors whitespace-nowrap ${activeView === 'reports' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Salary & Advance Reports
            </button>
          </div>
        </div>
      </div>

      {/* Overview Tab */}
      {activeView === 'overview' && (
        <div className="animate-fade-in">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#0A192F] text-white">
                    <tr>
                      <th className="p-4">Representative</th>
                      <th className="p-4 text-blue-300">Base Salary</th>
                      <th className="p-4 text-green-400">Available (Payable)</th>
                      <th className="p-4 text-red-400">Advance Taken</th>
                      <th className="p-4 text-orange-400">10% Penalty</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filteredReps.length === 0 ? (
                      <tr><td colSpan="6" className="text-center py-10 text-slate-500">No representatives found.</td></tr>
                    ) : filteredReps.map(rep => (
                      <tr key={rep.id} className="border-b hover:bg-slate-50">
                        <td className="p-4 font-bold text-slate-800 whitespace-nowrap">{rep.first_name} {rep.last_name}</td>
                        <td className="p-4 font-semibold text-blue-700">Rs. {(Number(rep.base_salary) || 0).toFixed(2)}</td>
                        <td className="p-4 font-bold text-green-600">Rs. {(Number(rep.available_salary) || 0).toFixed(2)}</td>
                        <td className="p-4 font-semibold text-red-600">Rs. {(Number(rep.advance_taken) || 0).toFixed(2)}</td>
                        <td className="p-4 font-semibold text-orange-600">Rs. {(Number(rep.penalty_amount) || 0).toFixed(2)}</td>
                        <td className="p-4 text-right space-x-2">
                          <button onClick={() => { setSelectedRep(rep); setBaseSalaryInput(rep.base_salary); setModalType('setBase'); }} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-200 font-semibold border border-slate-300 transition-colors">
                            <Settings2 className="w-4 h-4 inline mr-1"/>Set Base
                          </button>
                          <button onClick={() => { setSelectedRep(rep); setModalType('settle'); }} className="bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 font-semibold transition-colors shadow-sm">
                            <HandCoins className="w-4 h-4 inline mr-1"/>Settle Month
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {filteredReps.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 border border-slate-200 rounded-lg">No representatives found.</div>
                ) : filteredReps.map(rep => (
                  <div key={rep.id} className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                    {/* Card Header */}
                    <div className="bg-[#0A192F] text-white px-4 py-3">
                      <span className="font-bold text-sm">{rep.first_name} {rep.last_name}</span>
                    </div>
                    {/* Card Body */}
                    <div className="p-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-400 font-semibold mb-0.5">Base Salary</p>
                        <p className="font-bold text-blue-700">Rs. {(Number(rep.base_salary) || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-semibold mb-0.5">Available (Payable)</p>
                        <p className="font-bold text-green-600">Rs. {(Number(rep.available_salary) || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-semibold mb-0.5">Advance Taken</p>
                        <p className="font-semibold text-red-600">Rs. {(Number(rep.advance_taken) || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-semibold mb-0.5">10% Penalty</p>
                        <p className="font-semibold text-orange-600">Rs. {(Number(rep.penalty_amount) || 0).toFixed(2)}</p>
                      </div>
                    </div>
                    {/* Card Actions */}
                    <div className="flex gap-2 px-4 pb-4">
                      <button
                        onClick={() => { setSelectedRep(rep); setBaseSalaryInput(rep.base_salary); setModalType('setBase'); }}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 text-slate-700 py-2 rounded-md hover:bg-slate-200 font-semibold border border-slate-300 text-xs transition-colors"
                      >
                        <Settings2 className="w-4 h-4"/>Set Base
                      </button>
                      <button
                        onClick={() => { setSelectedRep(rep); setModalType('settle'); }}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 font-semibold text-xs transition-colors shadow-sm"
                      >
                        <HandCoins className="w-4 h-4"/>Settle Month
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Reports Tab */}
      {activeView === 'reports' && (
        <div className="animate-fade-in">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6 bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 items-end">
            <div className="flex-1 min-w-[130px]">
              <label className="block text-xs font-bold text-slate-500 mb-1">From Date</label>
              <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="w-full border p-2 rounded-lg text-sm outline-none" />
            </div>
            <div className="flex-1 min-w-[130px]">
              <label className="block text-xs font-bold text-slate-500 mb-1">To Date</label>
              <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="w-full border p-2 rounded-lg text-sm outline-none" />
            </div>
            <div className="flex-1 min-w-[130px]">
              <label className="block text-xs font-bold text-slate-500 mb-1">Select Rep</label>
              <select value={filterRep} onChange={e=>setFilterRep(e.target.value)} className="w-full border p-2 rounded-lg text-sm outline-none bg-white">
                <option value="all">All Reps</option>
                {reps.map(r => <option key={r.id} value={r.id}>{r.first_name}</option>)}
              </select>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={fetchReports} className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm">Filter</button>
              <button onClick={downloadExcel} className="flex-1 sm:flex-none bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm">
                <Download className="w-4 h-4"/>Export Excel
              </button>
            </div>
          </div>

          {reportLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 border-b">
                    <tr>
                      <th className="p-3 font-semibold">Date</th>
                      <th className="p-3 font-semibold">Rep Name</th>
                      <th className="p-3 font-semibold">Requested Amount</th>
                      <th className="p-3 font-semibold">Type</th>
                      <th className="p-3 font-semibold">Penalty Added</th>
                      <th className="p-3 font-semibold">Status</th>
                      <th className="p-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filteredReports.length === 0 ? (
                      <tr><td colSpan="7" className="text-center py-10 text-slate-500">No reports found.</td></tr>
                    ) : filteredReports.map(r => (
                      <tr key={r.id} className="border-b hover:bg-slate-50">
                        <td className="p-3 whitespace-nowrap">{new Date(r.requested_at).toLocaleDateString()}</td>
                        <td className="p-3 font-bold whitespace-nowrap">{r.first_name} {r.last_name}</td>
                        <td className="p-3 font-bold text-blue-700">Rs. {Number(r.amount).toFixed(2)}</td>
                        <td className="p-3">
                          {r.is_advance === 1
                            ? <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">Advance Taken</span>
                            : <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Normal Payout</span>}
                        </td>
                        <td className="p-3 font-bold text-orange-600">Rs. {Number(r.penalty_applied).toFixed(2)}</td>
                        <td className="p-3 font-bold text-slate-600">{r.status}</td>
                        <td className="p-3 space-x-2">
                          {r.status === 'Pending' && (
                            <>
                              <button onClick={()=>updateRequestStatus(r.id, 'Paid')} className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold hover:bg-green-200">Mark Paid</button>
                              <button onClick={()=>updateRequestStatus(r.id, 'Rejected')} className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold hover:bg-red-200">Reject</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards for Reports */}
              <div className="sm:hidden space-y-3">
                {filteredReports.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 border border-slate-200 rounded-lg">No reports found.</div>
                ) : filteredReports.map(r => (
                  <div key={r.id} className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
                    {/* Top Row */}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{r.first_name} {r.last_name}</p>
                        <p className="text-xs text-slate-400">{new Date(r.requested_at).toLocaleDateString()}</p>
                      </div>
                      {r.is_advance === 1
                        ? <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold flex-shrink-0">Advance</span>
                        : <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex-shrink-0">Normal</span>}
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                      <div>
                        <p className="text-slate-400 font-semibold mb-0.5">Amount</p>
                        <p className="font-bold text-blue-700">Rs. {Number(r.amount).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-semibold mb-0.5">Penalty</p>
                        <p className="font-bold text-orange-600">Rs. {Number(r.penalty_applied).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-semibold mb-0.5">Status</p>
                        <p className="font-bold text-slate-600">{r.status}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    {r.status === 'Pending' && (
                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <button onClick={()=>updateRequestStatus(r.id, 'Paid')} className="flex-1 bg-green-100 text-green-700 py-2 rounded text-xs font-bold hover:bg-green-200">Mark Paid</button>
                        <button onClick={()=>updateRequestStatus(r.id, 'Rejected')} className="flex-1 bg-red-100 text-red-700 py-2 rounded text-xs font-bold hover:bg-red-200">Reject</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Set Base Salary Modal */}
      {modalType === 'setBase' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white p-5 sm:p-6 rounded-xl w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-lg mb-2 border-b pb-2">Set Base Salary</h3>
            <p className="text-sm text-slate-500 mb-4">Set the monthly base salary for {selectedRep.first_name}.</p>
            <input
              type="number"
              value={baseSalaryInput}
              onChange={(e) => setBaseSalaryInput(e.target.value)}
              className="w-full border-2 border-slate-300 rounded-lg p-3 text-lg font-bold outline-none focus:border-blue-500 mb-4"
              placeholder="Rs."
            />
            <div className="flex gap-2">
              <button onClick={() => setModalType('')} className="flex-1 p-2 border rounded-lg font-bold text-slate-500">Cancel</button>
              <button onClick={handleSetBaseSalary} disabled={submitting} className="flex-1 bg-blue-600 text-white rounded-lg font-bold p-2">
                {submitting ? 'Saving...' : 'Save Salary'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settle Month Modal */}
      {modalType === 'settle' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white p-5 sm:p-6 rounded-xl w-full max-w-md shadow-xl">
            <h3 className="font-bold text-lg mb-2 text-green-700 flex items-center">
              <HandCoins className="mr-2"/>Month End Settlement
            </h3>
            <p className="text-sm text-slate-500 mb-4 border-b pb-4">
              You are about to close the salary cycle for <b>{selectedRep.first_name}</b>.
            </p>
            
            <div className="space-y-2 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex justify-between font-medium text-slate-600 text-sm">
                <span>Base Salary:</span>
                <span>Rs. {(Number(selectedRep.base_salary) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium text-red-600 text-sm">
                <span>Total Advance Taken:</span>
                <span>- Rs. {(Number(selectedRep.advance_taken) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium text-orange-600 text-sm">
                <span>10% Penalties Added:</span>
                <span>- Rs. {(Number(selectedRep.penalty_amount) || 0).toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-300 my-2 pt-2 flex justify-between font-bold text-lg sm:text-xl text-green-700">
                <span>Net Handover Now:</span>
                <span>Rs. {(Number(selectedRep.available_salary) || 0).toFixed(2)}</span>
              </div>
            </div>
            
            {(Number(selectedRep.available_salary) || 0) <= 0 && (
              <p className="text-xs text-orange-600 font-bold mb-4 bg-orange-100 p-2 rounded text-center">
                This representative has zero or negative balance. Settle Month will simply rollover the debt to next month without creating a payout request.
              </p>
            )}

            <div className="flex gap-2">
              <button onClick={() => setModalType('')} className="flex-1 p-3 border rounded-lg font-bold text-slate-500">Cancel</button>
              <button onClick={handleSettleMonth} disabled={submitting} className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm p-3">
                {submitting ? 'Processing...' : 'Confirm & Settle Month'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SalaryManagement;
