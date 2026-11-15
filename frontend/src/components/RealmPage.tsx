import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Settings, Globe, Users, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import FeedPost from './FeedPost';
import RightSidebar from './RightSidebar';
import { cn } from '../lib/cn';

// Map Tailwind color name → actual Tailwind class strings
const COLOR_MAP: Record<string, { bg: string; text: string; border: string; ring: string; badge: string }> = {
  rose:    { bg: 'bg-rose-600',    text: 'text-rose-600',    border: 'border-rose-500', ring: 'ring-rose-500',    badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400' },
  emerald: { bg: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-500', ring: 'ring-emerald-500', badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  amber:   { bg: 'bg-amber-500',   text: 'text-amber-600',   border: 'border-amber-500', ring: 'ring-amber-500',   badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  indigo:  { bg: 'bg-indigo-600',  text: 'text-indigo-600',  border: 'border-indigo-500', ring: 'ring-indigo-500',  badge: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400' },
  violet:  { bg: 'bg-violet-600',  text: 'text-violet-600',  border: 'border-violet-500', ring: 'ring-violet-500',  badge: 'bg-violet-500/15 text-violet-600 dark:text-violet-400' },
  sky:     { bg: 'bg-sky-500',     text: 'text-sky-600',     border: 'border-sky-500',    ring: 'ring-sky-500',    badge: 'bg-sky-500/15 text-sky-600 dark:text-sky-400' },
};

function getColors(themeColor: string) {
  return COLOR_MAP[themeColor] ?? COLOR_MAP['rose'];
}

interface Realm {
  _id: string;
  name: string;
  displayName: string;
  description: string;
  ownerId: { _id: string; username: string } | string;
  memberCount: number;
  themeColor: string;
  createdAt: string;
}

function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-zinc-100 dark:bg-white/10" />
            <div className="space-y-2">
              <div className="h-3 w-24 rounded bg-zinc-100 dark:bg-white/10" />
              <div className="h-2.5 w-16 rounded bg-zinc-100 dark:bg-white/10" />
            </div>
          </div>
          <div className="mt-4 h-4 w-2/3 rounded bg-zinc-100 dark:bg-white/10" />
          <div className="mt-2 h-3 w-full rounded bg-zinc-100 dark:bg-white/10" />
        </div>
      ))}
    </div>
  );
}

// Inline settings panel for realm owner
function RealmSettingsPanel({ realm, colors, onSaved }: { realm: Realm; colors: ReturnType<typeof getColors>; onSaved: (updated: Partial<Realm>) => void }) {
  const [desc, setDesc] = useState(realm.description);
  const [color, setColor] = useState(realm.themeColor);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const COLOR_OPTIONS = Object.keys(COLOR_MAP);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.patch(`/realms/${realm.name}`, { description: desc, themeColor: color });
      onSaved({ description: res.data.description, themeColor: res.data.themeColor });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // silent fail – user sees no change
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn('rounded-2xl border p-4 space-y-3', colors.border, 'border-opacity-30 bg-white dark:bg-zinc-900')}>
      <h3 className={cn('text-xs font-bold uppercase tracking-wider', colors.text)}>Realm Settings</h3>
      <div>
        <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Description</label>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          rows={3}
          maxLength={500}
          className="w-full resize-none rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 py-2 px-3 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:border-rose-500"
        />
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2">Theme Color</label>
        <div className="flex gap-1.5 flex-wrap">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                'h-5 w-5 rounded-full transition-all ring-offset-1 dark:ring-offset-zinc-900',
                COLOR_MAP[c].bg,
                color === c ? `ring-2 ${COLOR_MAP[c].ring} scale-110` : 'opacity-60 hover:opacity-100'
              )}
            />
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className={cn(
          'w-full rounded-xl py-2 text-xs font-bold text-white transition-all',
          saving ? 'bg-zinc-400 cursor-not-allowed' : colors.bg + ' hover:opacity-90 active:scale-95'
        )}
      >
        {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Changes'}
      </button>
    </div>
  );
}

export default function RealmPage() {
  const { realmName } = useParams<{ realmName: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [realm, setRealm] = useState<Realm | null>(null);
  const [realmLoading, setRealmLoading] = useState(true);
  const [realmError, setRealmError] = useState<string | null>(null);

  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  const [showSettings, setShowSettings] = useState(false);
  const [sortBy, setSortBy] = useState<'latest' | 'trending' | 'top-voted'>('latest');

  const fetchRealm = useCallback(async () => {
    if (!realmName) return;
    setRealmLoading(true);
    try {
      const res = await api.get(`/realms/${realmName}`);
      setRealm(res.data);
      setRealmError(null);
    } catch (err: any) {
      setRealmError(err.response?.data?.message || 'Realm not found');
    } finally {
      setRealmLoading(false);
    }
  }, [realmName]);

  const fetchPosts = useCallback(async () => {
    if (!realmName) return;
    setPostsLoading(true);
    try {
      const res = await api.get('/posts', { params: { realmName } });
      const items = res.data?.items ?? res.data ?? [];
      setPosts(items);
    } catch {
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  }, [realmName]);

  useEffect(() => { fetchRealm(); }, [fetchRealm]);
  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  if (realmLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-7 w-7 animate-spin text-rose-500" />
      </div>
    );
  }

  if (realmError || !realm) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
        <AlertCircle className="h-10 w-10 text-zinc-400" />
        <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">{realmError ?? 'Realm not found'}</p>
        <button onClick={() => navigate('/')} className="text-xs font-bold text-rose-500 hover:underline flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Feed
        </button>
      </div>
    );
  }

  const colors = getColors(realm.themeColor);
  const ownerId = typeof realm.ownerId === 'object' ? realm.ownerId._id : realm.ownerId;
  const currentUserId = user?.id || user?._id;
  const isOwner = !!currentUserId && currentUserId === ownerId;

  // Sort posts client-side
  let sortedPosts = [...posts];
  if (sortBy === 'latest') sortedPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  else if (sortBy === 'trending') sortedPosts.sort((a, b) => ((b.commentCount || 0) + (b.voteScore || 0)) - ((a.commentCount || 0) + (a.voteScore || 0)));
  else if (sortBy === 'top-voted') sortedPosts.sort((a, b) => (b.voteScore || 0) - (a.voteScore || 0));

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-12 items-start w-full">
      <Helmet>
        <title>{realm.displayName ? `${realm.displayName} (n/${realm.name}) | Nexus Realm` : `n/${realm.name} | Nexus Realm`}</title>
        <meta property="og:title" content={`Nexus Realm: ${realm.displayName || realm.name}`} />
        <meta property="og:description" content={realm.description || `Explore n/${realm.name} community on Nexus.`} />
      </Helmet>

      {/* Left Sidebar */}
      <aside className="hidden md:block md:col-span-4 lg:col-span-3 space-y-4 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Realm Identity Card */}
        <div className={cn('rounded-2xl border overflow-hidden', colors.border, 'border-opacity-40')}>
          <div className={cn('h-10 w-full', colors.bg)} />
          <div className="p-4 space-y-2 bg-white dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl -mt-7 border-2 border-white dark:border-zinc-900', colors.bg)}>
                  <Globe className="h-4 w-4 text-white" />
                </div>
                <div className="mt-1">
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">{realm.displayName}</p>
                  <p className="text-[11px] text-zinc-500">n/{realm.name}</p>
                </div>
              </div>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setShowSettings((s) => !s)}
                  title="Realm Settings"
                  className={cn('flex h-7 w-7 items-center justify-center rounded-lg transition-colors', showSettings ? colors.bg + ' text-white' : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800')}
                >
                  <Settings className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {realm.description && (
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{realm.description}</p>
            )}

            <div className="flex items-center gap-1 pt-1">
              <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold', colors.badge)}>
                <Users className="h-3 w-3" />
                {realm.memberCount.toLocaleString()} members
              </span>
            </div>
          </div>
        </div>

        {/* Settings Panel (owner only) */}
        {showSettings && isOwner && (
          <RealmSettingsPanel
            realm={realm}
            colors={colors}
            onSaved={(updated) => setRealm((r) => r ? { ...r, ...updated } : r)}
          />
        )}

        {/* Back link */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Global Feed
        </button>
      </aside>

      {/* Main Feed */}
      <section className="col-span-1 md:col-span-8 lg:col-span-9 xl:col-span-6 w-full space-y-4">
        {/* Realm Header Banner */}
        <div className={cn('rounded-2xl overflow-hidden border', colors.border, 'border-opacity-30')}>
          <div className={cn('px-5 py-4 flex items-center justify-between', colors.bg)}>
            <div>
              <p className="text-xs font-semibold text-white/70">Community Realm</p>
              <h1 className="text-lg font-black text-white">n/{realm.name}</h1>
            </div>
            <Globe className="h-8 w-8 text-white/30" />
          </div>
        </div>

        {/* Sort Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-white/10 pb-0.5 gap-6 overflow-x-auto scrollbar-none">
          {(['latest', 'trending', 'top-voted'] as const).map((tab) => {
            const isActive = sortBy === tab;
            const labels = { latest: 'Latest', trending: 'Trending', 'top-voted': 'Top Voted' };
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setSortBy(tab)}
                className={cn(
                  'pb-2.5 px-0.5 text-sm font-semibold transition-all duration-200 border-b-2 -mb-[2px] outline-none whitespace-nowrap',
                  isActive
                    ? `${colors.border} ${colors.text} font-bold`
                    : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300'
                )}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {postsLoading && <FeedSkeleton />}

        {!postsLoading && sortedPosts.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 py-16 px-6 text-center">
            <Globe className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
            <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">No posts in this realm yet</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">Be the first to post here!</p>
          </div>
        )}

        {!postsLoading && sortedPosts.length > 0 && (
          <div className="space-y-4">
            {sortedPosts.map((post) => (
              <FeedPost
                key={post._id}
                post={post}
                onViewComments={(id) => navigate(`/post/${id}`)}
                onRequestChat={(_id, _preview) => {/* optional chat context */}}
                onDeleteSuccess={fetchPosts}
              />
            ))}
          </div>
        )}
      </section>

      {/* Right Sidebar */}
      <aside className="hidden xl:block xl:col-span-3 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <RightSidebar />
      </aside>
    </div>
  );
}
