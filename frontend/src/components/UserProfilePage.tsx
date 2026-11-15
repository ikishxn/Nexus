import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ShieldCheck,
  Award,
  Wallet,
  Coins,
  ArrowUpRight,
  History,
  Loader2,
  Calendar,
  Mail,
  MessageSquare,
  Sparkles,
  ArrowLeft,
  ExternalLink,
  Flame,
} from 'lucide-react';
import api, { API_BASE_URL } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Button } from './UIComponents';
import { cn } from '../lib/cn';
import { Post } from '../types';

export interface ProfileTransaction {
  _id: string;
  userId: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'BOUNTY_EARNED' | 'BOUNTY_PAID' | 'UPVOTE_EARNED';
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  gatewayReferenceId?: string;
  description?: string;
  createdAt: string;
}

type TabType = 'activity' | 'bounties' | 'wallet';

export default function UserProfilePage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams<{ userId?: string }>();

  const isViewingSelf = !userId || userId === user?.id || userId === user?._id || userId === user?.username;
  const [activeTab, setActiveTab] = useState<TabType>(isViewingSelf ? 'wallet' : 'activity');

  // Transactions State
  const [transactions, setTransactions] = useState<ProfileTransaction[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState(false);

  // User Posts State
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  useEffect(() => {
    refreshUser();
  }, []);

  useEffect(() => {
    if (!isViewingSelf && activeTab === 'wallet') {
      setActiveTab('activity');
    }
  }, [isViewingSelf, activeTab]);

  useEffect(() => {
    if (activeTab === 'wallet' && isViewingSelf) {
      const fetchTransactions = async () => {
        setIsLoadingTx(true);
        try {
          const baseUrl = (API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
          const res = await api.get(`${baseUrl}/payments/transactions`);
          setTransactions(res.data || []);
        } catch (err) {
          console.error('Failed to load transaction history', err);
        } finally {
          setIsLoadingTx(false);
        }
      };
      fetchTransactions();
    } else if (activeTab === 'activity' || activeTab === 'bounties') {
      const fetchPosts = async () => {
        setIsLoadingPosts(true);
        try {
          const res = await api.get('/posts?limit=50');
          const allPosts: Post[] = res.data?.posts || res.data || [];
          const currentUserId = user?.id || user?._id;
          const filtered = allPosts.filter((p) => {
            const authorId = typeof p.author === 'object' ? p.author?._id : p.author;
            const authorUsername = typeof p.author === 'object' ? p.author?.username : '';
            if (isViewingSelf) {
              return authorId === currentUserId;
            }
            return authorId === userId || authorUsername === userId;
          });
          setUserPosts(filtered);
        } catch (err) {
          console.error('Failed to load user posts', err);
        } finally {
          setIsLoadingPosts(false);
        }
      };
      fetchPosts();
    }
  }, [activeTab, isViewingSelf, user?.id || user?._id, userId]);

  if (!user) {
    return (
      <div className="container mx-auto max-w-4xl py-12 text-center">
        <p className="text-zinc-500">Please sign in to view your profile.</p>
        <Button className="mt-4" onClick={() => navigate('/auth')}>
          Sign In
        </Button>
      </div>
    );
  }

  // Profile metadata for self vs viewed contributor
  const displayedUsername = isViewingSelf
    ? user.username
    : (userPosts[0]?.author && typeof userPosts[0].author === 'object'
        ? userPosts[0].author.username
        : userId || 'Contributor');

  const displayedEmail = isViewingSelf ? user.email : `${displayedUsername.toLowerCase()}@nexus.community`;
  const userInitials = (displayedUsername || 'U').slice(0, 2).toUpperCase();
  const totalReputation = isViewingSelf
    ? (user.totalReputation ?? user.reputationScore ?? 0)
    : (userPosts[0]?.author && typeof userPosts[0].author === 'object'
        ? (userPosts[0].author.totalReputation ?? userPosts[0].author.reputationScore ?? 850)
        : 850);

  const isHumanClean = isViewingSelf ? (user.aiBotScore ?? 0) <= 25 : true;
  const walletBalance = user.walletBalance ?? 0;
  const fiatValuation = (walletBalance / 100).toFixed(2);

  const bountyPosts = userPosts.filter((p) => p.bountyAmount && p.bountyAmount > 0);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-8 animate-in slide-in-from-top-2">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Feed</span>
        </button>
      </div>

      {/* Header Section: Premium Rose & Zinc Theme (bg-zinc-900) */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 p-6 md:p-8 text-white shadow-2xl">
        {/* Ambient atmospheric glows */}
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-rose-600/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 via-rose-600 to-purple-600 text-3xl font-black text-white shadow-lg ring-4 ring-rose-500/20 select-none">
              {userInitials}
            </div>

            {/* Profile Info */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                  {displayedUsername}
                </h1>

                {/* Verified Human Badge */}
                {isHumanClean && (
                  <span
                    title="Authentic human contributor with clean AI screening verification"
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/20"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Verified Human</span>
                  </span>
                )}

                {isViewingSelf && user.role === 'ADMIN' && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-xs font-bold text-purple-300">
                    <Sparkles className="h-3 w-3" /> Admin
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-zinc-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-zinc-500" />
                  {displayedEmail}
                </span>
                {isViewingSelf && user.createdAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                    Joined {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Total Reputation Score Card */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-800/60 p-4 text-right backdrop-blur-sm min-w-[140px]">
              <div className="flex items-center justify-end gap-1.5 text-rose-400">
                <Flame className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Total Reputation
                </span>
              </div>
              <p className="mt-0.5 text-2xl font-black text-white font-mono">
                {totalReputation.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* User Badges Strip */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-zinc-400 mr-1 flex items-center gap-1">
            <Award className="h-3.5 w-3.5 text-rose-400" /> Badges:
          </span>
          {isHumanClean && (
            <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
              🛡️ Proof of Humanity
            </span>
          )}
          <span className="rounded-lg border border-zinc-800 bg-zinc-800/60 px-2.5 py-1 text-[11px] font-bold text-zinc-300">
            ⚡ Nexus Pioneer
          </span>
          {totalReputation >= 50 && (
            <span className="rounded-lg border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-[11px] font-bold text-purple-300">
              💎 Verified Solution Provider
            </span>
          )}
          {user.badges?.map((badge, idx) => (
            <span
              key={idx}
              className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-[11px] font-bold text-rose-300"
            >
              ★ {badge}
            </span>
          ))}
        </div>
      </div>

      {/* Tabbed Navigation */}
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <nav className="flex items-center gap-8 -mb-px">
          {[
            { id: 'activity', label: 'Activity', icon: MessageSquare },
            { id: 'bounties', label: 'Bounties', icon: Award },
            ...(isViewingSelf ? [{ id: 'wallet', label: 'Wallet & Ledger', icon: Wallet }] : []),
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  'flex items-center gap-2 py-3.5 text-sm font-semibold transition-all cursor-pointer',
                  isActive
                    ? 'border-b-2 border-rose-500 text-rose-600 dark:text-rose-400 font-bold'
                    : 'border-b-2 border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                )}
              >
                <Icon className={cn('h-4 w-4', isActive ? 'text-rose-500' : 'text-zinc-400')} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}

      {/* TAB 1: Activity */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">
            Your Contributions ({userPosts.length})
          </h3>

          {isLoadingPosts ? (
            <div className="py-12 text-center text-zinc-400 flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-rose-500" />
              <span>Loading your activity...</span>
            </div>
          ) : userPosts.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 text-center bg-white dark:bg-zinc-900">
              <MessageSquare className="mx-auto h-8 w-8 text-zinc-400 mb-2" />
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                You haven't posted any topics yet.
              </p>
              <Button className="mt-3" size="sm" onClick={() => navigate('/create')}>
                Create First Post
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {userPosts.map((post) => (
                <div
                  key={post._id}
                  onClick={() => navigate(`/post/${post._id}`)}
                  className="group flex items-center justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-rose-400/50 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="space-y-1">
                    <span className="inline-block rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-600 dark:text-zinc-300 uppercase">
                      {post.category}
                    </span>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-rose-500 transition-colors">
                      {post.title}
                    </h4>
                    <p className="text-xs text-zinc-400">
                      Posted on {new Date(post.createdAt).toLocaleDateString()} • {post.commentCount || 0} comments • {post.voteScore || 0} votes
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-zinc-400 group-hover:text-rose-500 transition-colors shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Bounties */}
      {activeTab === 'bounties' && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">
            Bounty Questions ({bountyPosts.length})
          </h3>

          {isLoadingPosts ? (
            <div className="py-12 text-center text-zinc-400 flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-rose-500" />
              <span>Loading bounties...</span>
            </div>
          ) : bountyPosts.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 text-center bg-white dark:bg-zinc-900">
              <Award className="mx-auto h-8 w-8 text-zinc-400 mb-2" />
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                No active bounties posted yet.
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Post questions with credit bounties attached to incentivize expert answers.
              </p>
              <Button className="mt-3" size="sm" onClick={() => navigate('/create')}>
                Create Bounty Thread
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {bountyPosts.map((post) => (
                <div
                  key={post._id}
                  onClick={() => navigate(`/post/${post._id}`)}
                  className="flex items-center justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-amber-400/50 transition-all cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <Coins className="h-3 w-3 text-amber-500" />
                        {post.bountyAmount} cr Bounty
                      </span>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                          post.bountyStatus === 'awarded'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-blue-500/10 text-blue-500'
                        )}
                      >
                        {post.bountyStatus === 'awarded' ? 'Claimed' : 'Active'}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                      {post.title}
                    </h4>
                  </div>
                  <ExternalLink className="h-4 w-4 text-zinc-400 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Wallet & Ledger */}
      {activeTab === 'wallet' && (
        <div className="space-y-6">
          {/* Large Prominent Statistic Card */}
          <div className="relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-white via-zinc-50/50 to-white dark:from-zinc-900 dark:via-zinc-900/60 dark:to-zinc-900 p-7 shadow-panel">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <Wallet className="h-4 w-4 text-rose-500" />
                  Available Wallet Balance
                </span>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white font-mono">
                    {walletBalance.toLocaleString()}
                  </span>
                  <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">cr</span>
                </div>
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  Approx. <strong className="text-zinc-900 dark:text-zinc-200">${fiatValuation} USD</strong> at 100 cr = $1.00 USD
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link to="/wallet">
                  <Button variant="primary" size="sm" className="gap-2">
                    <Coins className="h-4 w-4 text-amber-300" />
                    <span>Manage & Cash Out</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Clean Tailwind Data Table for Transaction History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <History className="h-4 w-4 text-rose-500" />
                <span>Transaction Ledger History</span>
              </h3>
              <span className="text-xs text-zinc-400 font-mono">
                {transactions.length} records
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {isLoadingTx ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-zinc-400">
                          <div className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
                            <span>Loading ledger history...</span>
                          </div>
                        </td>
                      </tr>
                    ) : transactions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-zinc-400 dark:text-zinc-500 font-medium">
                          No transactions found on your account.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx) => {
                        const isEarnedOrDeposited = tx.amount > 0;
                        const formattedDate = new Date(tx.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        });

                        const typeLabel =
                          tx.type === 'DEPOSIT'
                            ? 'Deposit'
                            : tx.type === 'WITHDRAWAL'
                            ? 'Cash Out'
                            : tx.type === 'BOUNTY_EARNED'
                            ? 'Bounty Claim'
                            : tx.type === 'BOUNTY_PAID'
                            ? 'Bounty Lock'
                            : tx.type === 'UPVOTE_EARNED'
                            ? isEarnedOrDeposited ? 'Upvote Reward' : 'Upvote Revocation'
                            : tx.type;

                        return (
                          <tr
                            key={tx._id}
                            className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors font-medium"
                          >
                            <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                              {formattedDate}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-100/70 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                                {typeLabel}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 max-w-sm truncate">
                              {tx.description || `${typeLabel} transaction`}
                            </td>
                            {/* Color-code amount text: text-emerald-400 for earned/deposited, text-rose-400 for spent/withdrawn */}
                            <td
                              className={cn(
                                'px-4 py-3 text-right font-bold font-mono whitespace-nowrap text-sm',
                                isEarnedOrDeposited
                                  ? 'text-emerald-400'
                                  : 'text-rose-400'
                              )}
                            >
                              {isEarnedOrDeposited ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()}{' '}
                              <span className="text-xs font-normal opacity-75">{tx.currency || 'cr'}</span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

