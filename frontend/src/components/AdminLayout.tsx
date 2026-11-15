import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layout, Users, AlertTriangle, Coins, LogOut, Network, Shield
} from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'flagged' | 'bounties'>('dashboard');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Layout },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'flagged', label: 'Flagged Posts', icon: AlertTriangle },
    { id: 'bounties', label: 'Bounties', icon: Coins },
  ] as const;

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-900 flex flex-col shrink-0">
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-zinc-800">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 shadow-lg shadow-rose-600/30">
            <Network className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
          </span>
          <div>
            <span className="text-[15px] font-bold tracking-tight text-white block">Nexus Admin</span>
            <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest block -mt-0.5">RBAC Protected</span>
          </div>
        </div>

        {/* User Info Capsule */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/40 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-rose-500 to-rose-600 font-bold text-white text-sm shadow">
            {user?.username?.slice(0, 2).toUpperCase() || 'AD'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">@{user?.username || 'admin'}</p>
            <p className="text-[10px] text-rose-400 font-semibold uppercase tracking-wider">Super Administrator</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                  isActive 
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/10' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Exit Options */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/20">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            Exit Admin Panel
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-zinc-950 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-zinc-800 bg-zinc-900/40 sticky top-0 z-10 backdrop-blur flex items-center justify-between px-8">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
            <Shield className="h-4 w-4 text-rose-500" />
            <span>Nexus Administrative Control Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Live Secure Conn</span>
          </div>
        </header>

        {/* Dashboard View Container */}
        <div className="p-8 max-w-6xl mx-auto">
          <AdminDashboard activeTab={activeTab} />
        </div>
      </main>
    </div>
  );
}
