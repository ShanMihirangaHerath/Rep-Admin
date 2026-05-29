import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, DollarSign, Wallet, CheckCircle, XCircle, Loader2, Search } from 'lucide-react';

const RequestsApprovals = () => {
  const [activeTab, setActiveTab] = useState('salaries'); 
  const [data, setData] = useState({ leaves: [], expenses: [], salaries: [] });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [lRes, eRes, sRes] = await Promise.all([
        axios.get('http://157.230.244.87:5000/api/admin/leaves'),
        axios.get('http://157.230.244.87:5000/api/admin/expenses'),
        axios.get('http://157.230.244.87:5000/api/admin/salaries')
      ]);
      setData({ leaves: lRes.data, expenses: eRes.data, salaries: sRes.data });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdate = async (type, id, status) => {
    try {
      await axios.put(`http://157.230.244.87:5000/api/admin/${type}/${id}`, { status });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const renderStatus = (status) => {
    if (status === 'Pending') return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-bold">Pending</span>;
    if (status === 'Approved' || status === 'Paid') return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">{status}</span>;
    return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">{status}</span>;
  };

  const filteredData = data[activeTab].filter(item => {
    const fullName = `${item.first_name || ''} ${item.last_name || ''}`.toLowerCase();
    const itemStatus = (item.status || '').toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    return fullName.includes(searchLower) || itemStatus.includes(searchLower);
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[calc(100vh-120px)] p-3 sm:p-4 md:p-6">
      
      {/* Header Section */}
      <div className="mb-4 sm:mb-6 border-b border-slate-200 pb-4">
        
        {/* Title */}
        <h2 className="text-lg sm:text-xl font-bold text-[#0A192F] mb-3">Requests & Approvals</h2>

        {/* Tabs + Search: stacked on mobile, side-by-side on md+ */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          
          {/* Tabs — scrollable on small screens */}
          <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setActiveTab('salaries')}
              className={`px-3 py-2 font-medium text-xs sm:text-sm rounded-lg flex items-center whitespace-nowrap transition-colors flex-shrink-0 ${activeTab === 'salaries' ? 'bg-[#0A192F] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              <Wallet className="w-4 h-4 mr-1.5"/> Salaries
            </button>
            <button
              onClick={() => setActiveTab('leaves')}
              className={`px-3 py-2 font-medium text-xs sm:text-sm rounded-lg flex items-center whitespace-nowrap transition-colors flex-shrink-0 ${activeTab === 'leaves' ? 'bg-[#0A192F] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              <Calendar className="w-4 h-4 mr-1.5"/> Leaves
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-3 py-2 font-medium text-xs sm:text-sm rounded-lg flex items-center whitespace-nowrap transition-colors flex-shrink-0 ${activeTab === 'expenses' ? 'bg-[#0A192F] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              <DollarSign className="w-4 h-4 mr-1.5"/> Expenses
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64 flex-shrink-0">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Name or Status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <>
          {/* Desktop Table — hidden on small screens */}
          <div className="hidden sm:block overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                  <th className="p-4 font-semibold">Rep Name</th>
                  <th className="p-4 font-semibold">Details</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr><td colSpan="4" className="text-center py-10 text-slate-500">No requests found.</td></tr>
                ) : filteredData.map(item => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-800 whitespace-nowrap">{item.first_name} {item.last_name}</td>
                    <td className="p-4 text-sm text-slate-600">
                      {activeTab === 'leaves' && <div><span className="font-bold">Date:</span> {item.leave_date ? item.leave_date.split('T')[0] : 'N/A'}<br/><span>Reason:</span> {item.reason}</div>}
                      {activeTab === 'expenses' && <div><span className="font-bold text-green-600">Amount: Rs. {item.amount}</span><br/><span>Date:</span> {item.expense_date ? item.expense_date.split('T')[0] : 'N/A'}<br/><span>Note:</span> {item.description}</div>}
                      {activeTab === 'salaries' && <div><span className="font-bold text-blue-600">Amount: Rs. {item.amount}</span><br/><span>Date:</span> {item.req_date || 'N/A'}<br/><span className="text-xs">Bank: {item.bank_account || 'N/A'}</span></div>}
                    </td>
                    <td className="p-4">{renderStatus(item.status)}</td>
                    <td className="p-4 text-right">
                      {item.status === 'Pending' && (
                        <div className="flex justify-end space-x-2">
                          <button onClick={() => handleUpdate(activeTab, item.id, activeTab === 'salaries' ? 'Paid' : 'Approved')} className="bg-green-100 text-green-700 p-2 rounded hover:bg-green-200" title="Approve">
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleUpdate(activeTab, item.id, 'Rejected')} className="bg-red-100 text-red-700 p-2 rounded hover:bg-red-200" title="Reject">
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View — shown only on xs screens */}
          <div className="sm:hidden space-y-3">
            {filteredData.length === 0 ? (
              <div className="text-center py-10 text-slate-500 border border-slate-200 rounded-lg">No requests found.</div>
            ) : filteredData.map(item => (
              <div key={item.id} className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
                
                {/* Card Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-slate-800 text-sm">{item.first_name} {item.last_name}</span>
                  {renderStatus(item.status)}
                </div>

                {/* Card Details */}
                <div className="text-xs text-slate-600 space-y-1 mb-3">
                  {activeTab === 'leaves' && (
                    <>
                      <div><span className="font-bold text-slate-700">Date:</span> {item.leave_date ? item.leave_date.split('T')[0] : 'N/A'}</div>
                      <div><span className="font-bold text-slate-700">Reason:</span> {item.reason}</div>
                    </>
                  )}
                  {activeTab === 'expenses' && (
                    <>
                      <div><span className="font-bold text-green-600">Amount: Rs. {item.amount}</span></div>
                      <div><span className="font-bold text-slate-700">Date:</span> {item.expense_date ? item.expense_date.split('T')[0] : 'N/A'}</div>
                      <div><span className="font-bold text-slate-700">Note:</span> {item.description}</div>
                    </>
                  )}
                  {activeTab === 'salaries' && (
                    <>
                      <div><span className="font-bold text-blue-600">Amount: Rs. {item.amount}</span></div>
                      <div><span className="font-bold text-slate-700">Date:</span> {item.req_date || 'N/A'}</div>
                      <div><span className="font-bold text-slate-700">Bank:</span> {item.bank_account || 'N/A'}</div>
                    </>
                  )}
                </div>

                {/* Card Actions */}
                {item.status === 'Pending' && (
                  <div className="flex space-x-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleUpdate(activeTab, item.id, activeTab === 'salaries' ? 'Paid' : 'Approved')}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-green-100 text-green-700 py-2 rounded hover:bg-green-200 text-xs font-medium"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                    <button
                      onClick={() => handleUpdate(activeTab, item.id, 'Rejected')}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-red-100 text-red-700 py-2 rounded hover:bg-red-200 text-xs font-medium"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default RequestsApprovals;
