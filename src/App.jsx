import React, { useState, useEffect } from "react";
import { LayoutDashboard, Users, Map, FileUp, Settings as SettingsIcon, LogOut, Menu, X, ClipboardCheck, FileText, Wallet, Edit } from "lucide-react"; // 🚀 Edit icon එක එකතු කරා
import FileUpload from "./components/FileUpload";
import DashboardOverview from "./components/DashboardOverview";
import LiveMapModule from "./components/LiveMapModule";
import RepManagement from "./components/RepManagement";
import Settings from "./components/Settings";
import RequestsApprovals from "./components/RequestsApprovals";
import ReportGeneration from "./components/ReportGeneration"; 
import SalaryManagement from "./components/SalaryManagement";
import Login from "./components/Login"; 
import ManualVisitUpdate from "./components/ManualVisitUpdate"; // 🚀 අලුත් Page එක Import කරා

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); 
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const authStatus = localStorage.getItem("rep_admin_auth");
    if (authStatus === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (adminData) => {
    localStorage.setItem("rep_admin_auth", "true");
    localStorage.setItem("admin_name", adminData.name);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("rep_admin_auth");
    localStorage.removeItem("admin_name");
    setIsAuthenticated(false);
  };

  const handleTabChange = (id) => {
    setActiveTab(id);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "reps", label: "Rep Management", icon: Users },
    { id: "map", label: "Live Routes & Map", icon: Map },
    { id: "upload", label: "Upload Targets", icon: FileUp },
    { id: "manual-update", label: "Manual Update", icon: Edit }, // 🚀 අලුත් Menu Item එක දාන්න
    { id: "approvals", label: "Requests & Approvals", icon: ClipboardCheck },
    { id: "salary", label: "Salary Management", icon: Wallet },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`bg-[#0A192F] text-white transition-all duration-300 fixed h-full z-40 flex flex-col
        ${isSidebarOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full md:w-20 md:translate-x-0"}
      `}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          <span className={`text-xl font-bold tracking-wider ${!isSidebarOpen && 'md:hidden'}`}>REP PRO</span>
          
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/10 rounded-lg transition-colors hidden md:block">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors md:hidden">
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto hide-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button 
                key={item.id} 
                onClick={() => handleTabChange(item.id)} 
                title={item.label}
                className={`w-full flex items-center px-3 py-3 rounded-lg transition-all ${isActive ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:bg-white/10 hover:text-white"}`}
              >
                <Icon size={22} className="min-w-[22px]" />
                <span className={`ml-3 font-medium whitespace-nowrap ${!isSidebarOpen && 'md:hidden'}`}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button onClick={handleLogout} className="w-full flex items-center px-3 py-3 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all">
            <LogOut size={22} className="min-w-[22px]" />
            <span className={`ml-3 font-medium ${!isSidebarOpen && 'md:hidden'}`}>Logout</span>
          </button>
        </div>
      </aside>

      <main className={`flex-1 flex flex-col min-w-0 transition-all duration-300 h-screen overflow-y-auto
        ${isSidebarOpen ? "md:ml-64" : "md:ml-20"} ml-0
      `}>
        <header className="h-16 bg-white shadow-sm border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20">
          <div className="flex items-center">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden mr-3 p-2 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200">
              <Menu size={20} />
            </button>
            <h2 className="text-lg md:text-xl font-semibold text-slate-800 capitalize truncate max-w-[150px] sm:max-w-xs">
              {activeTab.replace('-', ' ')}
            </h2>
          </div>
          <div className="text-xs md:text-sm font-medium text-slate-600 truncate">
            Welcome, <span className="text-blue-600 font-bold">{localStorage.getItem("admin_name") || "Admin"}</span>
          </div>
        </header>

        <div className="p-4 md:p-8 flex-1">
          {activeTab === "dashboard" && <DashboardOverview />}
          {activeTab === "upload" && <FileUpload />}
          {activeTab === "reps" && <RepManagement />}
          {activeTab === "map" && <LiveMapModule />}
          {activeTab === "manual-update" && <ManualVisitUpdate />} {/* 🚀 අලුත් Page එක මෙතන Render කරනවා */}
          {activeTab === "approvals" && <RequestsApprovals />}
          {activeTab === "salary" && <SalaryManagement />}    
          {activeTab === "reports" && <ReportGeneration />}  
          {activeTab === "settings" && <Settings />}
        </div>
      </main>
    </div>
  );
}

export default App;