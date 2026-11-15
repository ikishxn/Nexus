import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Coins, ShieldCheck, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle } from './UIComponents';
import api from '../lib/api';

interface BountyItem {
  id: string;
  amount: number;
  title: string;
}

const DEFAULT_BOUNTIES: BountyItem[] = [
  { id: '1', amount: 50, title: 'Fix production memory leak in NestJS container' },
  { id: '2', amount: 30, title: 'React Navigation & rendering performance audit' },
  { id: '3', amount: 15, title: 'Need database architecture advice for scalable feed' },
];

const TOP_CONTRIBUTORS = [
  { userId: 'alex_dev', username: 'alex_dev', rep: 1250, verifiedScore: 99, initials: 'AD', color: 'from-emerald-400 to-teal-500' },
  { userId: 'sarah_m', username: 'sarah_m', rep: 840, verifiedScore: 98, initials: 'SM', color: 'from-rose-400 to-purple-500' },
  { userId: 'tech_guru', username: 'tech_guru', rep: 910, verifiedScore: 96, initials: 'TG', color: 'from-amber-400 to-orange-500' },
];

const TRENDING_TOPICS = [
  { tag: '#Technology', category: 'technology' },
  { tag: '#AI', category: 'science' },
  { tag: '#Startups', category: 'business' },
  { tag: '#Design', category: 'fashion_style' },
  { tag: '#NextJS', category: 'technology' },
  { tag: '#WebDev', category: 'technology' },
];

export default function RightSidebar() {
  const [bounties, setBounties] = useState<BountyItem[]>(DEFAULT_BOUNTIES);

  useEffect(() => {
    const fetchActiveBounties = async () => {
      try {
        const res = await api.get('/posts?limit=20');
        const posts: any[] = Array.isArray(res.data?.items)
          ? res.data.items
          : Array.isArray(res.data?.posts)
          ? res.data.posts
          : Array.isArray(res.data)
          ? res.data
          : [];

        if (posts.length > 0) {
          const bountyMatches = posts
            .filter((p: any) => p.bountyAmount && p.bountyAmount > 0 && p.bountyStatus !== 'awarded')
            .map((p: any) => ({
              id: p._id,
              amount: p.bountyAmount,
              title: p.title,
            }));

          if (bountyMatches.length >= 3) {
            setBounties(bountyMatches.slice(0, 3));
          } else {
            // Fill remaining slots using existing real post IDs from the database
            const additionalPosts = posts
              .filter((p: any) => !bountyMatches.some((b) => b.id === p._id))
              .slice(0, 3 - bountyMatches.length)
              .map((p: any, idx: number) => ({
                id: p._id,
                amount: [50, 30, 15][bountyMatches.length + idx] || 25,
                title: p.title,
              }));
            const combined = [...bountyMatches, ...additionalPosts];
            if (combined.length > 0) {
              setBounties(combined);
            }
          }
        }
      } catch (err) {
        // Fallback to default mock bounties
        setBounties(DEFAULT_BOUNTIES);
      }
    };

    fetchActiveBounties();
  }, []);

  return (
    <div className="space-y-6">
      {/* Active Bounties Card */}
      <Card className="border border-zinc-200 dark:border-white/10 shadow-sm bg-white dark:bg-surface-raised">
        <CardHeader className="pb-2 border-b border-zinc-100 dark:border-white/5 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-amber-500" />
            <CardTitle className="text-sm font-bold text-zinc-800 dark:text-white">Active Bounties</CardTitle>
          </div>
          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Top 3</span>
        </CardHeader>
        <div className="space-y-2">
          {bounties.map((bounty) => (
            <Link 
              key={bounty.id} 
              to={`/posts/${bounty.id}`}
              className="block group cursor-pointer rounded-xl p-2.5 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all duration-200"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-600 border border-amber-500/30 dark:text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.15)]">
                  <Coins className="h-3 w-3" />
                  {bounty.amount} cr
                </span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">Bounty Reward</span>
              </div>
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 line-clamp-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors duration-200">
                {bounty.title}
              </p>
            </Link>
          ))}
        </div>
      </Card>

      {/* Top Contributors Leaderboard */}
      <Card className="border border-zinc-200 dark:border-white/10 shadow-sm bg-white dark:bg-surface-raised">
        <CardHeader className="pb-2 border-b border-zinc-100 dark:border-white/5 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <CardTitle className="text-sm font-bold text-zinc-800 dark:text-white">Top Contributors</CardTitle>
          </div>
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">Human Score</span>
        </CardHeader>
        <div className="space-y-2">
          {TOP_CONTRIBUTORS.map((user) => (
            <Link 
              key={user.userId} 
              to={`/profile/${user.userId}`}
              className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr ${user.color} text-xs font-bold text-white shadow-sm ring-1 ring-white/10`}>
                  {user.initials}
                </div>
                <div className="leading-tight">
                  <p className="text-xs font-bold text-zinc-800 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    {user.username}
                  </p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{user.rep} rep</p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                  {user.verifiedScore}%
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Card>

      {/* Trending Topics (Hash Links) */}
      <Card className="border border-zinc-200 dark:border-white/10 shadow-sm bg-white dark:bg-surface-raised">
        <CardHeader className="pb-2 border-b border-zinc-100 dark:border-white/5 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-rose-500" />
            <CardTitle className="text-sm font-bold text-zinc-800 dark:text-white">Trending Topics</CardTitle>
          </div>
        </CardHeader>
        <div className="flex flex-wrap gap-2">
          {TRENDING_TOPICS.map((topic) => (
            <Link 
              key={topic.tag}
              to={`/?category=${topic.category}`}
              className="cursor-pointer inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-rose-600 dark:hover:text-rose-400 transition-all duration-150 transform hover:scale-105 active:scale-95 shadow-sm"
            >
              {topic.tag}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
