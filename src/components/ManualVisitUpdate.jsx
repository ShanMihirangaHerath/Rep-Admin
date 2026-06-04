import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Save, User, MapPin, FileText, Phone, CheckCircle, Loader2, Plus, Trash2, Search, ChevronDown } from 'lucide-react';

const ManualVisitUpdate = () => {
  const [reps, setReps] = useState([]);
  const [locations, setLocations] = useState([]);
  
  const [selectedRep, setSelectedRep] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState('');
  
  // 🚀 Searchable Dropdown States
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // 🚀 Dynamic Multiple Persons State
  const [persons, setPersons] = useState([{ name: '', phone: '' }]);
  
  const [formData, setFormData] = useState({
    status: 'Visited',
    visit_notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Load Reps
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

  // Load locations when Rep changes
  useEffect(() => {
    if (selectedRep) {
      const fetchLocations = async () => {
        try {
          const res = await axios.get(`http://157.230.244.87:5000/api/admin/reps/${selectedRep}/assignments`);
          setLocations(res.data);
          setSelectedAssignment('');
          setSearchQuery('');
        } catch (error) {
          console.error("Error fetching locations", error);
        }
      };
      fetchLocations();
    } else {
      setLocations([]);
    }
  }, [selectedRep]);

  // Handle outside click for custom dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 🚀 Dynamic Person Handlers
  const handlePersonChange = (index, field, value) => {
    const updatedPersons = [...persons];
    updatedPersons[index][field] = value;
    setPersons(updatedPersons);
  };

  const addPerson = () => {
    setPersons([...persons, { name: '', phone: '' }]);
  };

  const removePerson = (index) => {
    const updatedPersons = persons.filter((_, i) => i !== index);
    setPersons(updatedPersons);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssignment) {
      setMessage({ type: 'error', text: 'Please select a location first.' });
      return;
    }

    // 🚀 Array eka String ekakata convert karanawa Backend ekata yawanna
    const combinedMetPersons = persons.map(p => p.name.trim()).filter(Boolean).join(' | ');
    const combinedContacts = persons.map(p => p.phone.trim()).filter(Boolean).join(' | ');

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.post('http://157.230.244.87:5000/api/admin/manual-visit-update', {
        assignment_id: selectedAssignment,
        status: formData.status,
        met_person: combinedMetPersons,
        contact_number: combinedContacts,
        visit_notes: formData.visit_notes
      });
      
      setMessage({ type: 'success', text: 'Visit record updated successfully!' });
      
      // Reset Form
      setFormData({ status: 'Visited', visit_notes: '' });
      setPersons([{ name: '', phone: '' }]);
      setSelectedAssignment('');
      setSearchQuery('');
      
      // Refresh locations
      const res = await axios.get(`http://157.230.244.87:5000/api/admin/reps/${selectedRep}/assignments`);
      setLocations(res.data);

    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update record. Server error.' });
    }
    setLoading(false);
  };

  // Filter locations for search
  const filteredLocations = locations.filter(loc => 
    loc.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    loc.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSelectedLocationName = () => {
    const loc = locations.find(l => l.assignment_id === parseInt(selectedAssignment));
    return loc ? `${loc.shop_name} (${loc.category})` : '-- Select Location --';
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 bg-white rounded-xl shadow-sm border border-slate-100 mb-10">
      <div className="mb-6 border-b border-slate-100 pb-4">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800">Manual Visit Update</h2>
        <p className="text-slate-500 text-sm mt-1">Update visit logs on behalf of sales representatives.</p>
      </div>

      {message.text && (
        <div className={`p-4 mb-6 rounded-lg flex items-center gap-2 text-sm md:text-base ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Selection Row - Fully Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-50 p-4 md:p-5 rounded-xl border border-slate-200">
          
          {/* Rep Selection */}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500"/> Select Representative
            </label>
            <select 
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm"
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

          {/* 🚀 Searchable Location Dropdown */}
          <div ref={dropdownRef} className="relative">
            <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-500"/> Select Location
            </label>
            
            <div 
              className={`w-full p-3 border border-slate-300 rounded-lg bg-white flex justify-between items-center shadow-sm cursor-pointer ${!selectedRep && 'opacity-60 pointer-events-none'}`}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className="truncate text-slate-700">{getSelectedLocationName()}</span>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </div>

            {isDropdownOpen && selectedRep && (
              <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                <div className="p-3 border-b border-slate-100 flex items-center bg-slate-50">
                  <Search className="w-4 h-4 text-slate-400 mr-2" />
                  <input 
                    type="text" 
                    placeholder="Search shop or category..." 
                    className="w-full bg-transparent outline-none text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                  {filteredLocations.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">No locations found.</div>
                  ) : (
                    filteredLocations.map(loc => (
                      <div 
                        key={loc.assignment_id} 
                        className="p-3 hover:bg-blue-50 border-b border-slate-50 cursor-pointer transition-colors"
                        onClick={() => {
                          setSelectedAssignment(loc.assignment_id);
                          setIsDropdownOpen(false);
                        }}
                      >
                        <div className="font-semibold text-slate-700">{loc.shop_name}</div>
                        <div className="text-xs text-slate-500">{loc.category}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Details Form */}
        {selectedAssignment && (
          <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 animate-fade-in-up">
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Visit Status</label>
              <select 
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full md:w-1/2 p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              >
                <option value="Visited">Visited (Completed)</option>
                <option value="Needs Revisit">Needs Revisit</option>
              </select>
            </div>

            {/* 🚀 Dynamic Met Persons Section */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 p-3 md:p-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600"/> Met Persons Details
                </h3>
              </div>
              
              <div className="p-4 space-y-4 bg-white">
                {persons.map((person, index) => (
                  <div key={index} className="flex flex-col md:flex-row gap-4 items-start md:items-end border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <div className="w-full md:w-1/2">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Person Name</label>
                      <input 
                        type="text" 
                        value={person.name} 
                        onChange={(e) => handlePersonChange(index, 'name', e.target.value)}
                        placeholder="E.g. Mr. Kamal" 
                        className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div className="w-full md:w-1/2">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Contact Number</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={person.phone} 
                          onChange={(e) => handlePersonChange(index, 'phone', e.target.value)}
                          placeholder="E.g. 0771234567" 
                          className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                        />
                        {persons.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => removePerson(index)}
                            className="p-2.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                            title="Remove Person"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                <button 
                  type="button" 
                  onClick={addPerson}
                  className="mt-2 text-sm text-blue-600 font-semibold flex items-center gap-1 hover:text-blue-800 transition-colors bg-blue-50 px-3 py-2 rounded-lg"
                >
                  <Plus className="w-4 h-4" /> Add Another Person
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-500"/> Visit Notes / Remarks
              </label>
              <textarea 
                name="visit_notes" 
                value={formData.visit_notes} 
                onChange={handleInputChange}
                placeholder="Add any notes provided by the rep..." 
                rows="4"
                className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-slate-50"
              ></textarea>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md flex justify-center items-center gap-2 mt-4 text-lg"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
              {loading ? 'Saving Data...' : 'Save Visit Record'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default ManualVisitUpdate;