import { useState } from 'react';
import { 
  Users, AlertTriangle, Coins, ShieldAlert, Ban, Trash2, 
  CheckCircle, ArrowUpRight, Activity, Award, UserCheck, Flame
} from 'lucide-react';
import { Card } from './UIComponents';

interface AdminDashboardProps {
  activeTab: 'dashboard' | 'users' | 'flagged' | 'bounties';
}

export default function AdminDashboard({ activeTab }: AdminDashboardProps) {
  // Mock Data
  const [mockUsers, setMockUsers] = useState([
    { id: '1', username: 'kishan_dev', email: 'kishan@example.com', reputation: 450, role: 'ADMIN', status: 'Active' },
    { id: '2', username: 'shadow_coder', email: 'shadow@code.io', reputation: 120, role: 'USER', status: 'Active' },
    { id: '3', username: 'chatty_bot', email: 'bot@spam.com', reputation: 5, role: 'USER', status: 'Flagged' },
    { id: '4', username: 'ux_guru', email: 'guru@design.com', reputation: 890, role: 'MODERATOR', status: 'Active' },
    { id: '5', username: 'malicious_actor', email: 'mal@hacker.org', reputation: 0, role: 'USER', status: 'Banned' },
  ]);

  const [mockFlaggedPosts, setMockFlaggedPosts] = useState([
    { id: 'p1', title: 'Why you should use AI to write all code', author: 'chatty_bot', category: 'technology', botScore: 89, reason: 'High Bot Probability' },
    { id: 'p2', title: 'Free money glitch real 2026', author: 'shadow_coder', category: 'business', botScore: 42, reason: 'Spam keywords detected' },
    { id: 'p3', title: 'I hate typing types', author: 'lazy_dev', category: 'technology', botScore: 12, reason: 'User reported abuse' },
  ]);

  const [mockBounties] = useState([
    { id: 'b1', title: 'Fix memory leak in Socket.io reconnect handler', reward: 150, creator: 'kishan_dev', status: 'Active' },
    { id: 'b2', title: 'Redesign login modal with glassmorphism', reward: 50, creator: 'ux_guru', status: 'Awarded' },
    { id: 'b3', title: 'Benchmark speed of MongoDB indexing queries', reward: 200, creator: 'db_admin', status: 'Active' },
  ]);

  // Actions
  const handleBanUser = (id: string, username: string) => {
    setMockUsers(prev => 
      prev.map(u => u.id === id ? { ...u, status: u.status === 'Banned' ? 'Active' : 'Banned' } : u)
    );
    alert(`User "${username}" status toggled successfully.`);
  };

  const handleForceDeletePost = (id: string, title: string) => {
    setMockFlaggedPosts(prev => prev.filter(p => p.id !== id));
    alert(`Post "${title}" has been permanently purged from database.`);
  };

  const handleApprovePost = (id: string, title: string) => {
    setMockFlaggedPosts(prev => prev.filter(p => p.id !== id));
    alert(`Post "${title}" approved and quarantine cleared.`);
  };

  const handlePromoteUser = (id: string, username: string) => {
    setMockUsers(prev =>
      prev.map(u => u.id === id ? { ...u, role: u.role === 'ADMIN' ? 'USER' : 'ADMIN' } : u)
    );
    alert(`Toggled role for user "${username}".`);
  };

  // 1. Stats Grid
  const renderStats = () => (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="p-5 border-zinc-800 bg-zinc-900 text-white flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Users</p>
          <h3 className="text-2xl font-black mt-1 text-white">1,248</h3>
          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5 mt-1">
            <ArrowUpRight className="h-3 w-3" /> +12% this week
          </span>
        </div>
        <div className="h-10 w-10 rounded-xl bg-zinc-800 flex items-center justify-center text-rose-500">
          <Users className="h-5 w-5" />
        </div>
      </Card>

      <Card className="p-5 border-zinc-800 bg-zinc-900 text-white flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Quarantined Threads</p>
          <h3 className="text-2xl font-black mt-1 text-white">{mockFlaggedPosts.length}</h3>
          <span className="text-[10px] text-rose-400 font-bold flex items-center gap-0.5 mt-1">
            <Flame className="h-3 w-3 animate-pulse" /> High priority review
          </span>
        </div>
        <div className="h-10 w-10 rounded-xl bg-zinc-800 flex items-center justify-center text-rose-500">
          <AlertTriangle className="h-5 w-5" />
        </div>
      </Card>

      <Card className="p-5 border-zinc-800 bg-zinc-900 text-white flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Bounties</p>
          <h3 className="text-2xl font-black mt-1 text-white">$4,850</h3>
          <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5 mt-1">
            <Award className="h-3 w-3" /> 24 Active payouts
          </span>
        </div>
        <div className="h-10 w-10 rounded-xl bg-zinc-800 flex items-center justify-center text-amber-500">
          <Coins className="h-5 w-5" />
        </div>
      </Card>

      <Card className="p-5 border-zinc-800 bg-zinc-900 text-white flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Moderation Queue</p>
          <h3 className="text-2xl font-black mt-1 text-white">Clear</h3>
          <span className="text-[10px] text-zinc-400 font-semibold mt-1 block">
            System latency: 12ms
          </span>
        </div>
        <div className="h-10 w-10 rounded-xl bg-zinc-800 flex items-center justify-center text-emerald-500">
          <ShieldAlert className="h-5 w-5" />
        </div>
      </Card>
    </div>
  );

  // 2. Recent Events Activity Feed
  const renderActivity = () => (
    <Card className="border-zinc-800 bg-zinc-900 text-white p-5 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-4.5 w-4.5 text-rose-500" />
        <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-200">Recent Platform Operations</h4>
      </div>
      <div className="space-y-3.5">
        {[
          { msg: 'System quarantined thread "How to automate comments" due to score: 89%', time: '10m ago', type: 'quarantine' },
          { msg: 'User kishan_dev rewarded $150 to shadow_coder for post acceptance', time: '1h ago', type: 'bounty' },
          { msg: 'Auth Engine registered 14 new users from open GitHub links', time: '3h ago', type: 'info' },
          { msg: 'Administrator purged user spammer_99 and soft-deleted 4 posts', time: '5h ago', type: 'delete' },
        ].map((act, idx) => (
          <div key={idx} className="flex justify-between items-start gap-4 border-b border-zinc-800/60 pb-2.5 last:border-0 last:pb-0">
            <p className="text-xs text-zinc-300 font-medium leading-relaxed">{act.msg}</p>
            <span className="text-[10px] text-zinc-500 shrink-0">{act.time}</span>
          </div>
        ))}
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {activeTab === 'dashboard' && (
        <>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-black tracking-tight text-white">System Overview</h1>
            <p className="text-xs text-zinc-400">Real-time status metrics and event reporting for the Nexus platform.</p>
          </div>
          {renderStats()}
          {renderActivity()}
        </>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-black tracking-tight text-white">User Accounts</h1>
            <p className="text-xs text-zinc-400">Manage user profiles, assign roles, or restrict platform access.</p>
          </div>

          <Card className="border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider text-[10px] bg-zinc-950/40">
                    <th className="px-5 py-3.5">User</th>
                    <th className="px-5 py-3.5">Reputation</th>
                    <th className="px-5 py-3.5">System Role</th>
                    <th className="px-5 py-3.5">Account Status</th>
                    <th className="px-5 py-3.5 text-right">Moderator Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {mockUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-950/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-white">{u.username}</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">{u.email}</div>
                      </td>
                      <td className="px-5 py-3.5 text-zinc-300 font-semibold">{u.reputation} rep</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                          u.role === 'ADMIN' ? 'bg-rose-500/10 text-rose-400' :
                          u.role === 'MODERATOR' ? 'bg-cyan-500/10 text-cyan-400' :
                          'bg-zinc-800 text-zinc-400'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          u.status === 'Active' ? 'bg-emerald-500/15 text-emerald-400' :
                          u.status === 'Flagged' ? 'bg-amber-500/15 text-amber-400' :
                          'bg-red-500/15 text-red-400'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handlePromoteUser(u.id, u.username)}
                          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors font-semibold tracking-tight text-[10px] cursor-pointer"
                        >
                          Toggle Role
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBanUser(u.id, u.username)}
                          className={`px-2.5 py-1 rounded transition-colors font-semibold tracking-tight text-[10px] cursor-pointer inline-flex items-center gap-1 ${
                            u.status === 'Banned' 
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                              : 'bg-red-950/40 text-red-400 border border-red-500/20 hover:bg-red-900/40'
                          }`}
                        >
                          {u.status === 'Banned' ? <UserCheck className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
                          {u.status === 'Banned' ? 'Activate' : 'Ban User'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'flagged' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-black tracking-tight text-white">Quarantined Feed Submissions</h1>
            <p className="text-xs text-zinc-400">Review flagged submissions captured by AI content screening or user reports.</p>
          </div>

          <Card className="border-zinc-800 bg-zinc-900 overflow-hidden">
            {mockFlaggedPosts.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-xs font-semibold">
                No items currently quarantined or flagged. Good job!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider text-[10px] bg-zinc-950/40">
                      <th className="px-5 py-3.5">Post Title</th>
                      <th className="px-5 py-3.5">Author</th>
                      <th className="px-5 py-3.5">Category</th>
                      <th className="px-5 py-3.5">Bot Prob.</th>
                      <th className="px-5 py-3.5">Flag Reason</th>
                      <th className="px-5 py-3.5 text-right">Moderator Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    {mockFlaggedPosts.map((p) => (
                      <tr key={p.id} className="hover:bg-zinc-950/30 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-white max-w-xs truncate">{p.title}</td>
                        <td className="px-5 py-3.5 text-zinc-400 font-semibold">@{p.author}</td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-bold uppercase text-[9px]">
                            {p.category}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`font-bold ${p.botScore > 70 ? 'text-red-400 animate-pulse' : 'text-amber-400'}`}>
                            {p.botScore}%
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-zinc-400 italic">{p.reason}</td>
                        <td className="px-5 py-3.5 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => handleApprovePost(p.id, p.title)}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors font-semibold tracking-tight text-[10px] cursor-pointer inline-flex items-center gap-1"
                          >
                            <CheckCircle className="h-3 w-3" /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleForceDeletePost(p.id, p.title)}
                            className="px-2.5 py-1 rounded bg-red-950/40 border border-red-500/20 text-red-400 hover:bg-red-900/40 transition-colors font-semibold tracking-tight text-[10px] cursor-pointer inline-flex items-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" /> Force Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'bounties' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-black tracking-tight text-white">Active Bounties</h1>
            <p className="text-xs text-zinc-400">Inspect currency escrow status and accepted solution awards.</p>
          </div>

          <Card className="border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider text-[10px] bg-zinc-950/40">
                    <th className="px-5 py-3.5">Escrow Bounty Task</th>
                    <th className="px-5 py-3.5">Bounty Value</th>
                    <th className="px-5 py-3.5">Task Creator</th>
                    <th className="px-5 py-3.5">Escrow Status</th>
                    <th className="px-5 py-3.5 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {mockBounties.map((b) => (
                    <tr key={b.id} className="hover:bg-zinc-950/30 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-white">{b.title}</td>
                      <td className="px-5 py-3.5 text-amber-400 font-extrabold">${b.reward} USD</td>
                      <td className="px-5 py-3.5 text-zinc-400">@{b.creator}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          b.status === 'Active' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-450'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-zinc-500 font-semibold italic text-[10px]">
                        Secure P2P Escrow
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
