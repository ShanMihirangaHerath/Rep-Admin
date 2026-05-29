import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Lock, Bell, Server, Save, Shield, Loader2, CheckCircle, AlertCircle, UserPlus, Menu, X } from 'lucide-react';

const Settings = () => {
  const [activeSetting, setActiveSetting] = useState('profile');
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile sidebar toggle

  const [profile, setProfile] = useState({ first_name: '', last_name: '', email: '', company_name: '' });
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [notifications, setNotifications] = useState({ email_alerts: true, missing_gps: true, weekly_summary: false });
  const [system, setSystem] = useState({ timezone: 'Asia/Colombo', retention: '30 Days' });
  const [repData, setRepData] = useState({
    first_name: '', last_name: '', email: '', username: '', password: '', 
    mobile_number: '', whatsapp_number: '', nic_number: '', address: '', bank_account: ''
  });
  const [repLoading, setRepLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
    const savedNotifs = JSON.parse(localStorage.getItem('rep_notif_settings'));
    const savedSys = JSON.parse(localStorage.getItem('rep_sys_settings'));
    if (savedNotifs) setNotifications(savedNotifs);
    if (savedSys) setSystem(savedSys);
  }, []);

  const showMessage = (type, text) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
  };

  const fetchProfile = async () => {
    try {
      const res = await axios.get('http://157.230.244.87:5000/api/admin/settings/profile');
      setProfile({
        first_name: res.data.first_name || '',
        last_name: res.data.last_name || '',
        email: res.data.email || '',
        company_name: res.data.company_name || 'Family Doctor Health (Pvt) Ltd'
      });
    } catch (e) { console.error("Error fetching profile"); }
  };

  const handleProfileSave = async () => {
    setLoading(true);
    try {
      await axios.put('http://157.230.244.87:5000/api/admin/settings/profile', profile);
      showMessage('success', 'Admin profile updated successfully!');
      localStorage.setItem("admin_name", profile.first_name);
      window.dispatchEvent(new Event('storage'));
    } catch (e) { showMessage('error', 'Failed to update profile.'); }
    setLoading(false);
  };

  const handlePasswordSave = async () => {
    if (passwords.new_password !== passwords.confirm_password) return showMessage('error', 'New passwords do not match!');
    if (passwords.new_password.length < 6) return showMessage('error', 'Password must be at least 6 characters.');
    setLoading(true);
    try {
      await axios.put('http://157.230.244.87:5000/api/admin/settings/password', {
        current_password: passwords.current_password,
        new_password: passwords.new_password
      });
      showMessage('success', 'Password updated successfully!');
      setPasswords({ current_password: '', new_password: '', confirm_password: '' });
    } catch (e) { showMessage('error', e.response?.data?.message || 'Failed to update password.'); }
    setLoading(false);
  };

  const handleNotificationSave = () => {
    localStorage.setItem('rep_notif_settings', JSON.stringify(notifications));
    showMessage('success', 'Notification preferences saved locally.');
  };

  const handleSystemSave = () => {
    localStorage.setItem('rep_sys_settings', JSON.stringify(system));
    showMessage('success', 'System configurations saved locally.');
  };

  const handleCreateRep = async (e) => {
    e.preventDefault();
    setRepLoading(true);
    try {
      await axios.post('http://157.230.244.87:5000/api/reps', repData);
      showMessage('success', 'New representative created successfully!');
      setRepData({
        first_name: '', last_name: '', email: '', username: '', password: '',
        mobile_number: '', whatsapp_number: '', nic_number: '', address: '', bank_account: ''
      });
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to create representative.');
    }
    setRepLoading(false);
  };

  const navItems = [
    { key: 'profile', label: 'Admin Profile', icon: User },
    { key: 'security', label: 'Security', icon: Lock },
    { key: 'add-rep', label: 'Add New Rep', icon: UserPlus },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'system', label: 'System Config', icon: Server },
  ];

  const handleNavClick = (key) => {
    setActiveSetting(key);
    setSidebarOpen(false); // close sidebar on mobile after selection
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[calc(100vh-120px)] flex flex-col md:flex-row overflow-hidden">

      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        <h2 className="text-base font-bold text-[#0A192F]">System Settings</h2>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar — drawer on mobile, fixed column on md+ */}
      <div className={`
        ${sidebarOpen ? 'block' : 'hidden'} md:block
        w-full md:w-64 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 p-4 md:p-6
      `}>
        <h2 className="hidden md:block text-xl font-bold text-[#0A192F] mb-6">System Settings</h2>

        {/* Mobile: horizontal scrollable tabs, Desktop: vertical nav */}
        <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-1 md:pb-0 md:space-y-2">
          {navItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => handleNavClick(key)}
              className={`flex-shrink-0 md:flex-shrink md:w-full flex items-center px-3 md:px-4 py-2.5 md:py-3 rounded-lg font-medium text-sm transition-colors whitespace-nowrap
                ${activeSetting === key ? 'bg-[#0A192F] text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              <Icon className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3 flex-shrink-0" /> {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Settings Content */}
      <div className="flex-1 p-4 sm:p-6 md:p-8 bg-white md:h-[calc(100vh-120px)] overflow-y-auto">

        {/* Status Messages */}
        {statusMsg.text && (
          <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg flex items-center text-sm font-bold animate-fade-in ${statusMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {statusMsg.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />}
            {statusMsg.text}
          </div>
        )}

        {/* Profile */}
        {activeSetting === 'profile' && (
          <div className="max-w-2xl animate-fade-in">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6">Admin Profile</h3>
            <div className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">First Name</label>
                  <input type="text" value={profile.first_name} onChange={(e) => setProfile({...profile, first_name: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Last Name</label>
                  <input type="text" value={profile.last_name} onChange={(e) => setProfile({...profile, last_name: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Email Address</label>
                <input type="email" value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Company Name</label>
                <input type="text" value={profile.company_name} onChange={(e) => setProfile({...profile, company_name: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 focus:outline-none" />
              </div>
              <button onClick={handleProfileSave} disabled={loading} className="w-full sm:w-auto mt-2 px-6 py-2.5 bg-[#0A192F] hover:bg-[#172A45] text-white font-medium rounded-lg flex items-center justify-center transition-colors disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2" />} Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Security */}
        {activeSetting === 'security' && (
          <div className="max-w-2xl animate-fade-in">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6">Security Settings</h3>
            <div className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Current Password</label>
                <input type="password" value={passwords.current_password} onChange={(e) => setPasswords({...passwords, current_password: e.target.value})} placeholder="••••••••" className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">New Password</label>
                <input type="password" value={passwords.new_password} onChange={(e) => setPasswords({...passwords, new_password: e.target.value})} placeholder="Enter new password" className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Confirm New Password</label>
                <input type="password" value={passwords.confirm_password} onChange={(e) => setPasswords({...passwords, confirm_password: e.target.value})} placeholder="Confirm new password" className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 focus:outline-none" />
              </div>
              <button onClick={handlePasswordSave} disabled={loading || !passwords.current_password || !passwords.new_password} className="w-full sm:w-auto mt-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg flex items-center justify-center transition-colors disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Shield className="w-4 h-4 mr-2" />} Update Password
              </button>
            </div>
          </div>
        )}

        {/* Add New Rep */}
        {activeSetting === 'add-rep' && (
          <div className="max-w-3xl animate-fade-in">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1 sm:mb-2">Add New Representative</h3>
            <p className="text-sm text-slate-500 mb-4 sm:mb-6">Create a new account for a field representative.</p>

            <form onSubmit={handleCreateRep} className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">First Name *</label>
                  <input required type="text" value={repData.first_name} onChange={(e) => setRepData({...repData, first_name: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 focus:outline-none bg-slate-50" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Last Name *</label>
                  <input required type="text" value={repData.last_name} onChange={(e) => setRepData({...repData, last_name: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 focus:outline-none bg-slate-50" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Username *</label>
                  <input required type="text" value={repData.username} onChange={(e) => setRepData({...repData, username: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 focus:outline-none bg-slate-50" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Password *</label>
                  <input required type="password" value={repData.password} onChange={(e) => setRepData({...repData, password: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 focus:outline-none bg-slate-50" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Email Address</label>
                <input type="email" value={repData.email} onChange={(e) => setRepData({...repData, email: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 focus:outline-none bg-slate-50" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Mobile Number</label>
                  <input type="text" value={repData.mobile_number} onChange={(e) => setRepData({...repData, mobile_number: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 focus:outline-none bg-slate-50" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-2">WhatsApp Number</label>
                  <input type="text" value={repData.whatsapp_number} onChange={(e) => setRepData({...repData, whatsapp_number: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 focus:outline-none bg-slate-50" />
                </div>
              </div>

              <div className="pt-3 sm:pt-4 border-t border-slate-200">
                <h4 className="text-sm font-bold text-slate-700 mb-3 sm:mb-4">Official Details</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">NIC Number</label>
                      <input type="text" value={repData.nic_number} onChange={(e) => setRepData({...repData, nic_number: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 focus:outline-none bg-slate-50" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">Bank Account Details</label>
                      <input type="text" value={repData.bank_account} onChange={(e) => setRepData({...repData, bank_account: e.target.value})} placeholder="Acc No / Bank Name / Branch" className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 focus:outline-none bg-slate-50" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">Home Address</label>
                    <textarea value={repData.address} onChange={(e) => setRepData({...repData, address: e.target.value})} rows="3" className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 focus:outline-none bg-slate-50"></textarea>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={repLoading} className="w-full sm:w-auto mt-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 shadow-md">
                {repLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <UserPlus className="w-5 h-5 mr-2" />} Create Representative
              </button>
            </form>
          </div>
        )}

        {/* Notifications */}
        {activeSetting === 'notifications' && (
          <div className="max-w-2xl animate-fade-in">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6">Notification Preferences</h3>
            <div className="space-y-4">
              {[
                { key: 'email_alerts', label: 'Email Alerts', desc: 'Receive email notifications for important events.' },
                { key: 'missing_gps', label: 'Missing GPS Alerts', desc: 'Alert when a rep submits a visit without GPS data.' },
                { key: 'weekly_summary', label: 'Weekly Summary', desc: 'Receive a weekly summary report every Monday.' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-start justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 gap-4">
                  <div>
                    <p className="font-semibold text-slate-700 text-sm">{label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                  </div>
                  <button
                    onClick={() => setNotifications({...notifications, [key]: !notifications[key]})}
                    className={`flex-shrink-0 w-12 h-6 rounded-full transition-colors relative ${notifications[key] ? 'bg-blue-600' : 'bg-slate-300'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifications[key] ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
              <button onClick={handleNotificationSave} className="w-full sm:w-auto mt-2 px-6 py-2.5 bg-[#0A192F] hover:bg-[#172A45] text-white font-medium rounded-lg flex items-center justify-center transition-colors">
                <Save className="w-4 h-4 mr-2" /> Save Preferences
              </button>
            </div>
          </div>
        )}

        {/* System Config */}
        {activeSetting === 'system' && (
          <div className="max-w-2xl animate-fade-in">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6">System Configuration</h3>
            <div className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Google Maps API Key</label>
                <input type="password" placeholder="••••••••••••••••••••••••" disabled className="w-full border border-slate-300 bg-slate-100 rounded-lg p-2.5 outline-none text-slate-400" />
                <p className="text-xs text-orange-600 mt-1 font-medium">API key is securely managed on the backend (.env).</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">System Timezone</label>
                <select value={system.timezone} onChange={(e) => setSystem({...system, timezone: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 focus:outline-none bg-white">
                  <option value="Asia/Colombo">Asia/Colombo (GMT+5:30)</option>
                  <option value="UTC">UTC (GMT+0:00)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Data Retention Period</label>
                <select value={system.retention} onChange={(e) => setSystem({...system, retention: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 focus:outline-none bg-white">
                  <option value="30 Days">30 Days</option>
                  <option value="90 Days">90 Days</option>
                  <option value="1 Year">1 Year</option>
                  <option value="Forever">Forever</option>
                </select>
              </div>
              <button onClick={handleSystemSave} className="w-full sm:w-auto mt-2 px-6 py-2.5 bg-[#0A192F] hover:bg-[#172A45] text-white font-medium rounded-lg flex items-center justify-center transition-colors">
                <Save className="w-4 h-4 mr-2" /> Save System Config
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Settings;
