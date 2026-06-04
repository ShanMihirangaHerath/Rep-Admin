import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, User, MapPin, FileText, Phone, CheckCircle, Loader2 } from 'lucide-react';

const ManualVisitUpdate = () => {
  const [reps, setReps] = useState([]);
  const [locations, setLocations] = useState([]);
  
  const [selectedRep, setSelectedRep] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState('');
  
  const [formData, setFormData] = useState({
    status: 'Visited',
    met_person: '',
    contact_number: '',
    visit_notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Load Reps on mount
  useEffect(() => {
    const fetchReps = async () => {
      try {
        const res = await axios.get('http://157.230.244.87:5000/api/admin/reps');
        setReps(res.data);
      } catch (error) {
        console.error("Error fetching reps", error);
      }
    };
    fetchReps();
  }, []);

  // Load locations when a Rep is selected
  useEffect(() => {
    if (selectedRep) {
      const fetchLocations = async () => {
        try {
          const res = await axios.get(`http://157.230.244.87:5000/api/admin/reps/${selectedRep}/assignments`);
          setLocations(res.data);
          setSelectedAssignment(''); // Reset assignment when rep changes
        } catch (error) {
          console.error("Error fetching locations", error);
        }
      };
      fetchLocations();
    } else {
      setLocations([]);
    }
  }, [selectedRep]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssignment) {
      setMessage({ type: 'error', text: 'Please select a location first.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.post('http://157.230.244.87:5000/api/admin/manual-visit-update', {
        assignment_id: selectedAssignment,
        ...formData
      });
      
      setMessage({ type: 'success', text: 'Visit record updated successfully!' });
      
      // Form reset karo
      setFormData({ status: 'Visited', met_person: '', contact_number: '', visit_notes: '' });
      setSelectedAssignment('');
      
      // Refresh locations list
      const res = await axios.get(`http://157.230.244.87:5000/api/admin/reps/${selectedRep}/assignments`);
      setLocations(res.data);

    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update record. Server error.' });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-100">
      <div className="mb-6 border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-bold text-slate-800">Manual Visit Update</h2>
        <p className="text-slate-500 text-sm mt-1">Update visit logs on behalf of sales representatives.</p>
      </div>

      {message.text && (
        <div className={`p-4 mb-6 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Selection Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500"/> Select Representative
            </label>
            <select 
              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={selectedRep}
              onChange={(e) => setSelectedRep(e.target.value)}
              required
            >
              <option value="">-- Choose Rep --</option>
              {reps.map(rep => (
                <option key={rep.id} value={rep.id}>{rep.first_name} {rep.last_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-500"/> Select Location (Pending)
            </label>
            <select 
              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={selectedAssignment}
              onChange={(e) => setSelectedAssignment(e.target.value)}
              required
              disabled={!selectedRep || locations.length === 0}
            >
              <option value="">{locations.length === 0 ? '-- No pending locations --' : '-- Choose Location --'}</option>
              {locations.map(loc => (
                <option key={loc.assignment_id} value={loc.assignment_id}>
                  {loc.shop_name} ({loc.category})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Details Form (Only visible if location is selected) */}
        {selectedAssignment && (
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select 
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full p-2.5 border border-slate-300 rounded-lg outline-none"
                >
                  <option value="Visited">Visited (Completed)</option>
                  <option value="Needs Revisit">Needs Revisit</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><User className="w-4 h-4"/> Met Person Name</label>
                <input 
                  type="text" name="met_person" value={formData.met_person} onChange={handleInputChange}
                  placeholder="E.g. Mr. Kamal" className="w-full p-2.5 border border-slate-300 rounded-lg outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><Phone className="w-4 h-4"/> Contact Number</label>
              <input 
                type="text" name="contact_number" value={formData.contact_number} onChange={handleInputChange}
                placeholder="E.g. 0771234567" className="w-full p-2.5 border border-slate-300 rounded-lg outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><FileText className="w-4 h-4"/> Visit Notes</label>
              <textarea 
                name="visit_notes" value={formData.visit_notes} onChange={handleInputChange}
                placeholder="Add any notes provided by the rep..." rows="3"
                className="w-full p-3 border border-slate-300 rounded-lg outline-none resize-none"
              ></textarea>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex justify-center items-center gap-2 mt-4"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {loading ? 'Saving...' : 'Save Visit Record'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default ManualVisitUpdate;