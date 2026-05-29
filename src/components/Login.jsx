import React, { useState } from 'react';
import axios from 'axios';
import { User, Lock, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('http://157.230.244.87:5000/api/admin/login', { username, password });
      // Login Success!
      onLogin(res.data.admin);
    } catch (err) {
      setError(err.response?.data?.message || 'Connection failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden w-full">
      {/* 🚀 Background Decorations - Adjusted height for mobile */}
      <div className="absolute top-0 left-0 w-full h-64 sm:h-96 bg-[#0A192F] transform -skew-y-6 origin-top-left -z-10 shadow-2xl transition-all duration-300"></div>
      
      {/* 🚀 Main Form Container - Adjusted padding for mobile */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8 z-10 animate-fade-in mx-auto box-border">
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-sm">
            <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">REP PRO Admin</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Please sign in to access the dashboard</p>
        </div>

        {error && (
          <div className="mb-4 sm:mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-xs sm:text-sm font-medium rounded-lg text-center animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Enter your username"
                className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A192F] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A192F] transition-colors"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#0A192F] hover:bg-[#172A45] text-white font-bold py-2.5 sm:py-3 px-4 rounded-lg flex items-center justify-center transition-colors shadow-md mt-4 sm:mt-6 text-sm sm:text-base"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>Sign In <ArrowRight className="w-4 h-4 ml-2" /></>
            )}
          </button>
        </form>

        <p className="text-center text-[10px] sm:text-xs text-slate-400 mt-6 sm:mt-8">
          &copy; {new Date().getFullYear()} Family Doctor Health. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;