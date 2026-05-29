import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Users, UserPlus, Edit, Eye, CreditCard, X, Loader2, CheckCircle, Phone, Calendar, ClipboardList, MapPin, MessageSquare, Search, CheckSquare, Square, Send } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Leaflet Icon Setup
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const getMarkerIcon = (status, isUnassigned) => {
  let color = '#3b82f6'; // Default Blue (Pending)
  if (status === 'Positive') color = '#10b981'; // Green (Completed/Positive)
  else if (status === 'Needs Revisit') color = '#ef4444'; // Red
  else if (status === 'Shop Not Found') color = '#64748b'; // Gray
  else if (status === 'Do Not Visit') color = '#78350f'; // Brown
  else if (isUnassigned === 1) color = '#a855f7'; // Purple (Spontaneous)

  return L.divIcon({
    className: 'custom-status-icon',
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
    iconSize: [20, 20], iconAnchor: [10, 10],
  });
};

const RepManagement = () => {
  const [reps, setReps] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRep, setEditingRep] = useState(null);
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  
  const [viewingRep, setViewingRep] = useState(null);
  const [repHistory, setRepHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [chattingRep, setChattingRep] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatText, setChatText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [isBulkChatOpen, setIsBulkChatOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const chatEndRef = useRef(null);

  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', username: '', password: '', 
    mobile_number: '', whatsapp_number: '', nic_number: '', address: '', bank_account: ''
  });

  const fetchReps = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://157.230.244.87:5000/api/reps');
      setReps(res.data);
    } catch (error) {
      console.error("Error fetching reps", error);
    }
    setLoading(false);
  };

  useEffect(() => { 
    fetchReps(); 
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const handleViewProfile = async (rep) => {
    setViewingRep(rep);
    setHistoryLoading(true);
    try {
      const res = await axios.get(`http://157.230.244.87:5000/api/reps/${rep.id}/history`);
      setRepHistory(res.data);
    } catch (error) {
      console.error("Error fetching history", error);
    }
    setHistoryLoading(false);
  };

  const openModal = (rep = null) => {
    setSubmitStatus({ type: '', message: '' });
    if (rep) {
      setEditingRep(rep);
      setFormData({ ...rep, password: '' });
    } else {
      setEditingRep(null);
      setFormData({ first_name: '', last_name: '', email: '', username: '', password: '', mobile_number: '', whatsapp_number: '', nic_number: '', address: '', bank_account: '' });
    }
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitStatus({ type: '', message: '' });

    try {
      if (editingRep) {
        await axios.put(`http://157.230.244.87:5000/api/reps/${editingRep.id}`, formData);
        setSubmitStatus({ type: 'success', message: 'Representative updated successfully!' });
      } else {
        await axios.post('http://157.230.244.87:5000/api/reps', formData);
        setSubmitStatus({ type: 'success', message: 'New representative created!' });
      }
      fetchReps();
      setTimeout(() => setIsModalOpen(false), 2000);
    } catch (error) {
      setSubmitStatus({ type: 'error', message: error.response?.data?.message || 'Something went wrong.' });
    }
    setSubmitting(false);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const filteredReps = reps.filter(rep => 
    rep.first_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    rep.last_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openSingleChat = async (rep) => {
    setChattingRep(rep);
    setChatLoading(true);
    try {
      const res = await axios.get(`http://157.230.244.87:5000/api/admin/messages/${rep.id}`);
      setChatMessages(res.data);
    } catch (error) { console.error(error); }
    setChatLoading(false);
  };

  const sendSingleMessage = async () => {
    if(!chatText.trim()) return;
    try {
      await axios.post('http://157.230.244.87:5000/api/admin/send-message', { repIds: [chattingRep.id], message: chatText });
      setChatText('');
      const res = await axios.get(`http://157.230.244.87:5000/api/admin/messages/${chattingRep.id}`);
      setChatMessages(res.data);
    } catch (e) { console.error(e); }
  };

  const sendBulkMessage = async () => {
    if(!bulkText.trim()) return;
    try {
      await axios.post('http://157.230.244.87:5000/api/admin/send-message', { repIds: selectedIds, message: bulkText });
      setIsBulkChatOpen(false);
      setBulkText('');
      setSelectedIds([]); 
      alert("Message sent to selected reps successfully!");
    } catch (e) { console.error(e); }
  };

  const mapCenter = repHistory.length > 0 && repHistory[0].latitude 
    ? [repHistory[0].latitude, repHistory[0].longitude] 
    : [6.9271, 79.8612];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[calc(100vh-120px)] p-4 sm:p-6 relative">
      
      {/* Top Header Section */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#0A192F] flex items-center">
            <Users className="w-5 h-5 sm:w-6 h-6 mr-2 text-blue-600" /> Team Representatives ({filteredReps.length})
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Manage reps, view performance history, and send messages.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
            <input 
              type="text" placeholder="Search Reps..." 
              className="pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm w-full focus:border-blue-500 outline-none shadow-sm"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Action Buttons Wrapper */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {selectedIds.length > 0 && (
              <button onClick={() => setIsBulkChatOpen(true)} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center transition-colors shadow-sm">
                <MessageSquare className="w-4 h-4 mr-2"/> Send Bulk ({selectedIds.length})
              </button>
            )}

            <button onClick={() => openModal()} className="w-full sm:w-auto bg-[#0A192F] hover:bg-[#172A45] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center shadow-sm justify-center">
              <UserPlus className="w-4 h-4 mr-2" /> Add New Rep
            </button>
          </div>
        </div>
      </div>

      {/* Main Reps Content (Loader / Empty State Handling) */}
      {loading ? (
        <div className="flex justify-center items-center h-40"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : reps.length === 0 ? (
        <div className="text-center py-10 text-slate-500 border border-slate-200 rounded-lg">No representatives found. Add one to get started.</div>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW (Visible on MD screens and up) */}
          <div className="hidden md:block overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                  <th className="p-4 w-10 text-center"><CheckSquare className="w-5 h-5 text-slate-400 inline"/></th>
                  <th className="p-4 font-semibold">Representative Name</th>
                  <th className="p-4 font-semibold">NIC & Contact</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReps.map(rep => (
                  <tr key={rep.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-center cursor-pointer" onClick={() => toggleSelect(rep.id)}>
                      {selectedIds.includes(rep.id) ? <CheckSquare className="text-blue-600 w-5 h-5 inline" /> : <Square className="text-slate-300 w-5 h-5 inline" />}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg mr-3">
                          {rep.first_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{rep.first_name} {rep.last_name}</p>
                          <p className="text-xs text-slate-500">@{rep.username} | {rep.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      <div className="font-medium text-slate-700">NIC: {rep.nic_number || 'N/A'}</div>
                      <div className="flex items-center text-xs mt-1 text-slate-500"><Phone className="w-3 h-3 mr-1"/> {rep.mobile_number || 'N/A'}</div>
                    </td>
                    <td className="p-4 text-right space-x-2 whitespace-nowrap">
                      <button onClick={() => openSingleChat(rep)} className="bg-green-50 text-green-600 px-3 py-2 rounded-md hover:bg-green-100 transition-colors inline-flex items-center text-sm font-medium">
                        <MessageSquare className="w-4 h-4 mr-1" /> Chat
                      </button>
                      <button onClick={() => handleViewProfile(rep)} className="bg-blue-50 text-blue-600 px-3 py-2 rounded-md hover:bg-blue-100 transition-colors inline-flex items-center text-sm font-medium">
                        <Eye className="w-4 h-4 mr-1" /> View Profile
                      </button>
                      <button onClick={() => openModal(rep)} className="bg-slate-100 text-slate-600 p-2 rounded-md hover:bg-slate-200 transition-colors inline-flex" title="Edit Profile">
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS VIEW (Visible only on small screens) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredReps.map(rep => (
              <div key={rep.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-3 relative">
                
                {/* Checkbox and Rep Primary Info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg mr-3">
                      {rep.first_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{rep.first_name} {rep.last_name}</h4>
                      <p className="text-xs text-slate-500">@{rep.username} | {rep.email}</p>
                    </div>
                  </div>
                  
                  <button onClick={() => toggleSelect(rep.id)} className="p-1">
                    {selectedIds.includes(rep.id) ? <CheckSquare className="text-blue-600 w-6 h-6" /> : <Square className="text-slate-300 w-6 h-6" />}
                  </button>
                </div>

                {/* Additional Details Grid */}
                <div className="grid grid-cols-2 bg-slate-50 p-2.5 rounded-lg text-xs gap-2 border border-slate-100">
                  <div>
                    <span className="text-slate-400 block font-medium">NIC Number</span>
                    <span className="text-slate-700 font-semibold">{rep.nic_number || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Mobile Contact</span>
                    <span className="text-slate-700 font-semibold flex items-center mt-0.5"><Phone className="w-3 h-3 mr-1 text-slate-400"/> {rep.mobile_number || 'N/A'}</span>
                  </div>
                </div>

                {/* Mobile Quick Action Buttons */}
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <button onClick={() => openSingleChat(rep)} className="bg-green-50 text-green-600 py-2.5 px-2 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center text-xs font-semibold border border-green-200/50">
                    <MessageSquare className="w-3.5 h-3.5 mr-1" /> Chat
                  </button>
                  <button onClick={() => handleViewProfile(rep)} className="bg-blue-50 text-blue-600 py-2.5 px-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center text-xs font-semibold border border-blue-200/50">
                    <Eye className="w-3.5 h-3.5 mr-1" /> Profile
                  </button>
                  <button onClick={() => openModal(rep)} className="bg-slate-50 text-slate-600 py-2.5 px-2 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center text-xs font-semibold border border-slate-200">
                    <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                  </button>
                </div>

              </div>
            ))}
          </div>
        </>
      )}

      {/* SINGLE CHAT SLIDER MODAL */}
      {chattingRep && (
        <div className="fixed inset-0 z-[105] flex justify-end bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full sm:max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
            
            <div className="p-4 bg-[#0A192F] text-white flex justify-between items-center shadow-md">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg mr-3">
                  {chattingRep.first_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">{chattingRep.first_name} {chattingRep.last_name}</h3>
                  <p className="text-xs text-green-400">Direct Message</p>
                </div>
              </div>
              <button onClick={() => setChattingRep(null)} className="text-white/80 hover:text-white bg-white/10 p-2 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-100 space-y-4">
              {chatLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-600" /></div>
              ) : chatMessages.length === 0 ? (
                <div className="text-center text-sm text-slate-400 mt-10 bg-white p-4 rounded-lg shadow-sm border border-slate-200">No messages yet. Send a message to start the conversation.</div>
              ) : (
                chatMessages.map(m => (
                  <div key={m.id} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3 rounded-2xl max-w-[85%] sm:max-w-[80%] shadow-sm text-sm ${m.sender === 'admin' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none border border-slate-200'}`}>
                      {m.message}
                      <div className={`text-[10px] mt-1 ${m.sender === 'admin' ? 'text-blue-200 text-right' : 'text-slate-400 text-right'}`}>
                        {new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex gap-2 items-center shadow-lg z-10">
              <input 
                className="border border-slate-300 p-3 flex-1 rounded-full text-sm outline-none focus:border-blue-500 bg-slate-50" 
                value={chatText} 
                placeholder="Type your message..." 
                onChange={(e) => setChatText(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && sendSingleMessage()}
              />
              <button onClick={sendSingleMessage} disabled={!chatText.trim()} className="bg-blue-600 disabled:bg-slate-300 text-white p-3 rounded-full hover:bg-blue-700 transition-colors shadow-sm shrink-0">
                <Send size={18} className="ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK CHAT MODAL */}
      {isBulkChatOpen && (
        <div className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-5 sm:p-6 rounded-xl w-full max-w-md shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-800">Send Bulk Message</h3>
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">{selectedIds.length} Reps</span>
            </div>
            <p className="text-sm text-slate-500 mb-4">This message will be sent individually to all selected representatives.</p>
            
            <textarea 
              className="w-full border border-slate-300 p-3 rounded-lg mb-4 h-32 outline-none focus:border-blue-500 text-sm bg-slate-50 resize-none" 
              placeholder="Type your official announcement or message here..." 
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
            ></textarea>
            
            <div className="flex gap-3">
              <button onClick={() => setIsBulkChatOpen(false)} className="flex-1 border border-slate-300 text-slate-600 p-2.5 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm text-sm">Cancel</button>
              <button onClick={sendBulkMessage} disabled={!bulkText.trim()} className="flex-1 bg-green-600 disabled:bg-green-300 text-white p-2.5 rounded-lg font-medium flex items-center justify-center hover:bg-green-700 transition-colors shadow-sm text-sm">
                <Send size={16} className="mr-2"/> Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROFILE VIEW SLIDER (Map & History) */}
      {viewingRep && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-y-auto animate-slide-in-right">
            
            <div className="p-4 sm:p-6 bg-[#0A192F] text-white flex justify-between items-center sticky top-0 z-10 shadow-md">
              <div>
                <h3 className="text-lg sm:text-xl font-bold flex items-center">
                  <UserPlus className="w-5 h-5 mr-2 opacity-80" /> {viewingRep.first_name} {viewingRep.last_name}
                </h3>
                <p className="text-xs text-slate-300 mt-1">Detailed Performance Logs & Field Records</p>
              </div>
              <button onClick={() => setViewingRep(null)} className="text-white/80 hover:text-white bg-white/10 p-2 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-6 flex-1 bg-slate-50">
              
              <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-xl shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-600">
                <div className="border-b sm:border-b-0 sm:border-r border-slate-100 pb-3 sm:pb-0 sm:pr-4">
                  <strong className="block text-xs text-slate-400 uppercase mb-2 tracking-wider">Contact Info</strong>
                  <div className="truncate">📧 {viewingRep.email}</div>
                  <div className="mt-1.5">📞 {viewingRep.mobile_number || 'N/A'}</div>
                </div>
                <div>
                  <strong className="block text-xs text-slate-400 uppercase mb-2 tracking-wider">Official Details</strong>
                  <div>💳 NIC: {viewingRep.nic_number || 'N/A'}</div>
                  <div className="mt-1.5 truncate">🏦 Bank: {viewingRep.bank_account || 'N/A'}</div>
                </div>
              </div>

              {historyLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-blue-600 w-8 h-8" /></div>
              ) : repHistory.length === 0 ? (
                <div className="text-sm text-slate-400 text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                  No visit history logs recorded yet. Data will appear when the rep uses the mobile app.
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm relative z-0">
                    <h4 className="font-bold text-slate-800 mb-3 flex items-center text-sm">
                      <MapPin className="w-4 h-4 mr-2 text-blue-600" /> Visited Locations Map
                    </h4>
                    <div className="h-60 sm:h-64 rounded-lg overflow-hidden border border-slate-200">
                      <MapContainer key={`map-${viewingRep.id}`} center={mapCenter} zoom={12} style={{ height: '100%', width: '100%', zIndex: 1 }}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                        
                        {repHistory.map((log) => {
                          const latestStatus = log.logs && log.logs.length > 0 ? log.logs[0].status : null;
                          return log.latitude && log.longitude && (
                            <Marker 
                              key={`history-map-${log.id}`} 
                              position={[log.latitude, log.longitude]} 
                              icon={getMarkerIcon(latestStatus, log.is_unassigned)}
                            >
                              <Popup>
                                <div className="text-sm">
                                  <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mb-1 ${log.is_unassigned ? 'bg-purple-200 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                    {log.is_unassigned ? '🔥 Spontaneous Visit' : '🎯 Assigned Target'}
                                  </span>
                                  <strong className="block text-base mb-1">{log.location_name}</strong>
                                  {latestStatus ? (
                                     <span className={`mt-1 block font-bold text-xs px-2 py-1 rounded inline-block ${latestStatus === 'Positive' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>{latestStatus}</span>
                                  ) : (
                                     <span className="mt-1 block font-bold text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded inline-block">Pending</span>
                                  )}
                                </div>
                              </Popup>
                            </Marker>
                          );
                        })}
                      </MapContainer>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center text-base border-b pb-3">
                      <ClipboardList className="w-5 h-5 mr-2 text-blue-600" /> Visit Details & Notes
                    </h4>

                    <div className="space-y-4">
                      {repHistory.map((log) => {
                        const latestStatus = log.logs && log.logs.length > 0 ? log.logs[0].status : null;
                        
                        return (
                          <div key={log.id} className={`p-4 rounded-xl border shadow-sm transition-all ${log.is_unassigned ? 'bg-purple-50 border-purple-200' : (latestStatus ? 'bg-green-50/40 border-green-200' : 'bg-white border-slate-200')}`}>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                              <div>
                                <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-1.5 ${log.is_unassigned ? 'bg-purple-200 text-purple-800 border border-purple-300' : 'bg-blue-100 text-blue-800 border border-blue-200'}`}>
                                  {log.is_unassigned ? '🔥 Spontaneous Visit' : '🎯 Assigned Target'}
                                </span>
                                <h5 className="font-bold text-slate-800 text-base">{log.location_name}</h5>
                              </div>
                              <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-md flex items-center self-start sm:self-auto">
                                <Calendar className="w-3 h-3 mr-1" /> {log.assigned_date.split('T')[0]}
                              </span>
                            </div>

                            {log.logs && log.logs.length > 0 ? (
                              <div className="mt-3 space-y-2 border-t border-slate-200/60 pt-3">
                                {log.logs.map((l) => (
                                  <div key={l.id} className="bg-white p-3 rounded-lg border border-slate-200 text-sm shadow-sm">
                                    <div className="flex justify-between items-center mb-1">
                                      <strong className="text-sm text-slate-800">👤 {l.met_person}</strong>
                                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${l.status === 'Positive' ? 'bg-green-100 text-green-700 border-green-200' : (l.status === 'Shop Not Found' ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-red-50 text-red-700 border-red-200')}`}>
                                        {l.status}
                                      </span>
                                    </div>
                                    {l.contact_number && <div className="text-xs text-slate-500 mb-1 flex items-center"><Phone className="w-3 h-3 mr-1"/> {l.contact_number}</div>}
                                    {l.notes && <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded italic mt-2 border border-slate-100">"{l.notes}"</div>}
                                    {l.log_lat && l.log_lng && (
                                      <div className="mt-2 pt-2 border-t border-slate-100">
                                        <a href={`https://www.google.com/maps/search/?api=1&query=${l.log_lat},${l.log_lng}`} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs font-semibold bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition-colors">
                                          📍 View Actual Location on Map
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="mt-3 text-sm text-slate-400 italic border-t border-slate-200/60 pt-3">No details recorded yet.</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT REP MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex justify-end bg-slate-900/40 backdrop-blur-sm transition-all">
          <div className="w-full sm:max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right overflow-y-auto">
            
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <h3 className="text-base sm:text-lg font-bold text-slate-800">{editingRep ? 'Edit Profile' : 'Add New Representative'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors"><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5 flex-1">
              {submitStatus.message && (
                <div className={`p-3 rounded-lg text-sm flex items-center ${submitStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {submitStatus.type === 'success' && <CheckCircle className="w-4 h-4 mr-2" />}
                  {submitStatus.message}
                </div>
              )}

              {/* Responsive Grid System for Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">First Name *</label>
                  <input required type="text" name="first_name" value={formData.first_name} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Last Name *</label>
                  <input required type="text" name="last_name" value={formData.last_name} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:border-blue-500 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Username *</label>
                  <input required type="text" name="username" value={formData.username} onChange={handleChange} disabled={editingRep} className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Password {editingRep && '(Leave blank to keep)'}</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} required={!editingRep} className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:border-blue-500 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email Address</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:border-blue-500 focus:outline-none" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Mobile Number</label>
                  <input type="text" name="mobile_number" value={formData.mobile_number} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">WhatsApp Number</label>
                  <input type="text" name="whatsapp_number" value={formData.whatsapp_number} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:border-blue-500 focus:outline-none" />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-sm font-bold text-slate-700 mb-3">Official Details</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">NIC Number</label>
                    <input type="text" name="nic_number" value={formData.nic_number} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:border-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Bank Account Details</label>
                    <input type="text" name="bank_account" value={formData.bank_account} onChange={handleChange} placeholder="Acc No / Bank Name / Branch" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:border-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Home Address</label>
                    <textarea name="address" value={formData.address} onChange={handleChange} rows="3" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:border-blue-500 focus:outline-none"></textarea>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white pb-4 mt-auto">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-[#0A192F] hover:bg-[#172A45] text-white rounded-lg transition-colors text-sm font-medium flex items-center shadow-md">
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {editingRep ? 'Save Changes' : 'Create Rep'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default RepManagement;