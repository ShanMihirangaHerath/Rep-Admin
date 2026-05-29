import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, CheckCircle, XCircle, Loader2, MapPin, User, ArrowRight, Store, ChevronDown, Search } from 'lucide-react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});
const defaultIcon = new L.Icon.Default();

const FileUpload = () => {
  const [reps, setReps] = useState([]);
  const [selectedRep, setSelectedRep] = useState(''); 
  const [selectedCategory, setSelectedCategory] = useState('Pharmacy'); 
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle'); 
  const [errorMessage, setErrorMessage] = useState('');
  const [previewData, setPreviewData] = useState([]);

  const [repSearch, setRepSearch] = useState('');
  const [showRepDropdown, setShowRepDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchReps = async () => {
      try {
        const res = await axios.get('http://157.230.244.87:5000/api/reps');
        setReps(res.data);
        if (res.data.length > 0) {
          setSelectedRep(res.data[0].id.toString());
        }
      } catch (error) {
        console.error("Error fetching reps", error);
      }
    };
    fetchReps();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowRepDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setUploadStatus('idle');
      setPreviewData([]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
  });

  const handlePreview = async () => {
    if (!selectedFile) return;
    setUploadStatus('processing');
    const formData = new FormData();
    formData.append('document', selectedFile);

    try {
      const response = await axios.post('http://157.230.244.87:5000/api/preview-locations', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreviewData(response.data.data);
      setUploadStatus('preview');
    } catch (error) {
      setUploadStatus('error');
      setErrorMessage(error.response?.data?.message || 'Processing failed. Please try again.');
    }
  };

  const handleConfirm = async () => {
    setUploadStatus('saving');
    try {
      await axios.post('http://157.230.244.87:5000/api/confirm-locations', {
        repId: selectedRep,
        category: selectedCategory.trim() || 'Other',
        locations: previewData
      });
      setUploadStatus('success');
      
      setTimeout(() => {
        setSelectedFile(null);
        setPreviewData([]);
        setUploadStatus('idle');
      }, 4000);
    } catch (error) {
      setUploadStatus('error');
      setErrorMessage('Failed to save data to the database.');
    }
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    setPreviewData([]);
    setUploadStatus('idle');
  };

  const mapCenter = previewData.length > 0 && previewData[0].latitude 
    ? [previewData[0].latitude, previewData[0].longitude] 
    : [6.9271, 79.8612];

  const filteredReps = reps.filter(rep => 
    `${rep.first_name} ${rep.last_name}`.toLowerCase().includes(repSearch.toLowerCase())
  );
  
  const selectedRepData = reps.find(r => r.id.toString() === selectedRep);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full items-start">
      
      {/* Left Form Panel */}
      <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 flex flex-col min-h-none lg:min-h-[550px]">
        <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-1">Upload & Assign</h2>
        <p className="text-xs sm:text-sm text-slate-500 mb-6">Select a rep, choose or type a category, and upload target locations.</p>

        <div className="space-y-4 mb-6">
          
          {/* Searchable Custom Rep Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 flex items-center">
              <User className="w-4 h-4 mr-2 text-blue-600" /> Assign To Representative
            </label>
            
            <div 
              className={`w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-medium focus:outline-none transition-colors flex justify-between items-center ${
                (uploadStatus === 'processing' || uploadStatus === 'saving' || reps.length === 0) 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-slate-50 text-slate-700 cursor-pointer hover:border-blue-400'
              }`}
              onClick={() => {
                if (uploadStatus !== 'processing' && uploadStatus !== 'saving' && reps.length > 0) {
                  setShowRepDropdown(!showRepDropdown);
                }
              }}
            >
              <span className="truncate">{selectedRepData ? `${selectedRepData.first_name} ${selectedRepData.last_name}` : 'Loading Reps...'}</span>
              <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${showRepDropdown ? 'rotate-180 text-blue-500' : 'text-slate-400'}`} />
            </div>

            {/* Dropdown Menu Overlay */}
            {showRepDropdown && (
              <div className="absolute z-[50] w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden animate-fade-in">
                <div className="p-2 border-b border-slate-100 bg-slate-50">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 text-slate-400 w-4 h-4" />
                    <input 
                      type="text" 
                      placeholder="Search by name..." 
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-md outline-none text-sm focus:border-blue-500"
                      value={repSearch}
                      onChange={(e) => setRepSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredReps.length === 0 ? (
                    <div className="p-3 text-sm text-slate-500 text-center">No representatives found.</div>
                  ) : (
                    filteredReps.map(rep => (
                      <div 
                        key={rep.id} 
                        className="px-4 py-2 text-sm hover:bg-blue-50 cursor-pointer flex items-center transition-colors border-b border-slate-50 last:border-0"
                        onClick={() => {
                          setSelectedRep(rep.id.toString());
                          setShowRepDropdown(false);
                          setRepSearch('');
                        }}
                      >
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px] mr-3 shrink-0">
                          {rep.first_name.charAt(0)}
                        </div>
                        <div className="truncate">
                           <p className="font-semibold text-slate-800 truncate">{rep.first_name} {rep.last_name}</p>
                           <p className="text-[10px] text-slate-500 truncate">{rep.mobile_number || rep.email}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Location Category Input */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 flex items-center">
              <Store className="w-4 h-4 mr-2 text-green-600" /> Location Category
            </label>
            <input 
              type="text"
              list="category-options"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              placeholder="Select or type category..."
              disabled={uploadStatus === 'processing' || uploadStatus === 'saving'}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors bg-slate-50"
            />
            <datalist id="category-options">
              <option value="Pharmacy" />
              <option value="Hospital" />
              <option value="Clinic" />
              <option value="Grocery" />
              <option value="Hardware" />
              <option value="Supermarket" />
              <option value="Bookshop" />
              <option value="Salon" />
              <option value="Garage" />
            </datalist>
            <p className="text-[11px] text-slate-400 mt-1 italic">Type a custom category if not in the list.</p>
          </div>
        </div>

        {/* Dropzone Wrapper */}
        <div 
          {...getRootProps()} 
          className={`relative flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200
            ${isDragActive ? 'border-blue-500 bg-blue-50 scale-[1.01]' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-blue-400'}
            ${(uploadStatus === 'processing' || uploadStatus === 'saving') ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input {...getInputProps()} />
          {selectedFile ? (
            <div className="flex flex-col items-center animate-fade-in w-full px-4">
              <File className="w-10 h-10 sm:w-12 sm:h-12 text-blue-500 mb-3 shrink-0" />
              <p className="text-sm font-bold text-slate-800 text-center truncate w-full max-w-[140px] sm:max-w-[220px]">{selectedFile.name}</p>
              <p className="text-xs text-slate-500 mt-1">{(selectedFile.size / 1024).toFixed(2)} KB</p>
              {uploadStatus === 'idle' && (
                <button onClick={clearSelection} className="absolute top-2.5 right-2.5 text-slate-400 hover:text-red-500 transition-colors bg-white rounded-full shadow-sm p-0.5">
                  <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <UploadCloud className={`w-10 h-10 sm:w-12 sm:h-12 mb-3 transition-colors ${isDragActive ? 'text-blue-500' : 'text-slate-400'}`} />
              <p className="text-sm font-bold text-slate-700">Click or Drag & Drop</p>
              <p className="text-xs text-slate-500 mt-1">Excel (.xlsx, .csv) or Word (.docx)</p>
            </div>
          )}
        </div>

        {/* Status Alerts */}
        {uploadStatus === 'error' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700 text-xs sm:text-sm animate-fade-in">
            <XCircle className="w-5 h-5 mr-2 flex-shrink-0" /> <span className="break-words flex-1">{errorMessage}</span>
          </div>
        )}
        {uploadStatus === 'success' && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-700 text-xs sm:text-sm animate-fade-in">
            <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" /> <span>Locations assigned successfully!</span>
          </div>
        )}

        {/* Action Buttons Section */}
        <div className="mt-6 lg:mt-auto pt-4">
          {uploadStatus === 'idle' && (
            <button
              onClick={handlePreview}
              disabled={!selectedFile}
              className={`w-full py-3 px-4 rounded-lg font-bold text-sm sm:text-base flex items-center justify-center transition-all duration-200
                ${!selectedFile ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-[#0A192F] hover:bg-[#172A45] text-white shadow-md hover:shadow-lg'}`}
            >
              Generate Map Preview <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 shrink-0" />
            </button>
          )}

          {uploadStatus === 'processing' && (
            <div className="w-full py-3 px-4 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm sm:text-base">
              <Loader2 className="w-5 h-5 mr-2 animate-spin shrink-0" /> Geocoding Data...
            </div>
          )}
          {uploadStatus === 'saving' && (
            <div className="w-full py-3 px-4 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm sm:text-base">
              <Loader2 className="w-5 h-5 mr-2 animate-spin shrink-0" /> Saving to Database...
            </div>
          )}

          {uploadStatus === 'preview' && (
            <div className="space-y-2.5 animate-fade-in">
              <button
                onClick={handleConfirm}
                className="w-full py-3 px-4 rounded-lg font-bold flex items-center justify-center bg-green-600 hover:bg-green-700 text-white shadow-md transition-all text-sm sm:text-base"
              >
                <CheckCircle className="w-5 h-5 mr-2 shrink-0" /> Confirm & Assign Locations
              </button>
              <button
                onClick={clearSelection}
                className="w-full py-2.5 px-4 rounded-lg font-semibold text-slate-500 hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200 text-sm"
              >
                Cancel Process
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Map Preview Panel */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden h-[380px] sm:h-[480px] lg:h-[550px]">
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center text-sm sm:text-base shrink-0">
          <h3 className="font-bold text-slate-800 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-blue-600 shrink-0" /> Live Map Preview
          </h3>
          {previewData.length > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-200 shrink-0">
              {previewData.length} Found
            </span>
          )}
        </div>
        
        <div className="flex-1 relative z-0 w-full h-full">
          {previewData.length === 0 && uploadStatus !== 'processing' && (
            <div className="absolute inset-0 z-[1000] bg-slate-50/90 flex flex-col items-center justify-center backdrop-blur-sm p-4 text-center">
              <MapPin className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mb-3 animate-bounce shrink-0" />
              <p className="text-slate-600 font-semibold text-base sm:text-lg">Waiting for Document</p>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5">Upload a file to view generated locations on the map</p>
            </div>
          )}

          <MapContainer 
            key={previewData.length > 0 ? previewData[0].latitude : 'default'} 
            center={mapCenter} zoom={13} style={{ height: '100%', width: '100%', zIndex: 1 }}
          >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
            
            {previewData.map((loc, idx) => (
              loc.latitude && loc.longitude && (
                <Marker key={idx} position={[loc.latitude, loc.longitude]} icon={defaultIcon}>
                  <Popup>
                    <div className="text-sm font-sans max-w-[200px]">
                      <span className="text-[9px] font-bold text-white bg-blue-600 px-2 py-0.5 rounded-full mb-1 inline-block uppercase truncate max-w-full">
                        {selectedCategory}
                      </span>
                      <strong className="block text-sm sm:text-base mb-1 mt-1 text-slate-800 truncate">{loc.Name}</strong>
                      <span className="text-slate-600 text-xs block truncate">📞 {loc.Contact || 'N/A'}</span>
                      {loc.status === 'Found' ? (
                        <span className="text-green-600 font-bold text-[11px] mt-1.5 block bg-green-50 px-2 py-0.5 rounded inline-block border border-green-200/50">Valid Location</span>
                      ) : (
                        <span className="text-red-600 font-bold text-[11px] mt-1.5 block bg-red-50 px-2 py-0.5 rounded inline-block border border-red-200/50">Location Error</span>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )
            ))}
          </MapContainer>
        </div>
      </div>

    </div>
  );
};

export default FileUpload;