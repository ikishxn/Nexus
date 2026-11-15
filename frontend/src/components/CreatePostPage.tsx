import { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, Laptop, Film, Utensils, Shirt, Atom, 
  Music, BookOpen, Briefcase, Brain, Scroll, HeartPulse, HelpCircle, Coins, ArrowLeft,
  MessageSquare, Scale, Target, Lock, Search, Check, Loader2
} from 'lucide-react';
import api from '../lib/api';
import { PostCategory } from '../types';
import { Button } from './UIComponents';
import MediaDropzone from './MediaDropzone';
import VoiceRecorder from './VoiceRecorder';
import { cn } from '../lib/cn';

const CATEGORIES: { value: PostCategory; label: string }[] = [
  { value: 'technology', label: 'Technology' },
  { value: 'movies', label: 'Movies' },
  { value: 'food_cooking', label: 'Food & Cooking' },
  { value: 'fashion_style', label: 'Fashion & Style' },
  { value: 'science', label: 'Science' },
  { value: 'music', label: 'Music' },
  { value: 'books', label: 'Books' },
  { value: 'business', label: 'Business' },
  { value: 'psychology', label: 'Psychology' },
  { value: 'history', label: 'History' },
  { value: 'health', label: 'Health' },
  { value: 'general', label: 'General' },
];

interface CreatePostPageProps {
  onCancel: () => void;
  onSuccess: (createdPost?: any) => void;
}

export default function CreatePostPage({ onCancel, onSuccess }: CreatePostPageProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<PostCategory>('general');
  const [postType, setPostType] = useState<'post' | 'question' | 'debate'>('post');
  const [stance, setStance] = useState<'affirmative' | 'negative'>('affirmative');
  const [text, setText] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  // Bounty system state
  const [hasBounty, setHasBounty] = useState(false);
  const [bountyAmount, setBountyAmount] = useState<number>(10);

  // Targeted Expert 24-Hour Exclusivity Lock state
  const [isTargeted, setIsTargeted] = useState(false);
  const [targetedExpertId, setTargetedExpertId] = useState<string | null>(null);
  const [contributors, setContributors] = useState<Array<{ _id: string; username: string; reputationScore: number; badges?: string[] }>>([]);
  const [loadingContributors, setLoadingContributors] = useState(false);
  const [contributorSearch, setContributorSearch] = useState('');

  useEffect(() => {
    if (isTargeted && contributors.length === 0) {
      setLoadingContributors(true);
      api.get('/users/top-contributors')
        .then((res) => {
          setContributors(Array.isArray(res.data) ? res.data : []);
        })
        .catch((err) => {
          console.error('Failed to load top contributors', err);
        })
        .finally(() => {
          setLoadingContributors(false);
        });
    }
  }, [isTargeted, contributors.length]);

  const filteredContributors = useMemo(() => {
    if (!contributorSearch.trim()) return contributors;
    return contributors.filter((c) =>
      c.username.toLowerCase().includes(contributorSearch.trim().toLowerCase())
    );
  }, [contributors, contributorSearch]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || title.length < 3) {
      setError('Title must be at least 3 characters long.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const activeMediaUrls = [...mediaUrls];
      if (audioUrl) {
        activeMediaUrls.push(audioUrl);
      }

      const payload: any = {
        title: title.trim(),
        category,
        postType,
        content: {
          text: text.trim() || undefined,
          codeSnippet: category === 'technology' ? codeSnippet.trim() || undefined : undefined,
          mediaUrls: activeMediaUrls.length > 0 ? activeMediaUrls : undefined,
        },
      };

      if (postType === 'debate') {
        payload.threadStyle = 'debate';
        payload.stance = stance;
      }

      if (postType === 'question' && hasBounty && bountyAmount > 0) {
        payload.bountyAmount = Number(bountyAmount);
      }

      if (isTargeted && targetedExpertId) {
        payload.targetedExpertId = targetedExpertId;
      }

      const response = await api.post('/posts', payload);
      const createdPost = response.data;
      
      const authProfile = await api.get('/auth/me').catch(() => null);
      if (authProfile) {
        localStorage.setItem('user', JSON.stringify(authProfile.data));
        window.dispatchEvent(new Event('storage'));
      }

      // Dispatch global events for instant feed update and cache invalidation
      window.dispatchEvent(new CustomEvent('feed:new-post', { detail: createdPost }));
      window.dispatchEvent(new Event('feed:invalidate'));

      onSuccess(createdPost);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 text-sm font-bold text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Feed
        </button>
        
        <h1 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-rose-500" />
          Create new Post
        </h1>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Post Editor Card */}
      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-surface-raised">
        <div>
          <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            Thread Style
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setPostType('post')}
              className={cn(
                'flex flex-col items-center gap-1 p-3.5 rounded-xl border-2 transition-all text-center',
                postType === 'post'
                  ? 'border-rose-600 bg-rose-50/50 text-rose-700 dark:border-rose-500 dark:bg-rose-500/10 dark:text-rose-400 font-bold'
                  : 'border-zinc-200 hover:border-zinc-300 text-zinc-600 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-white/5'
              )}
            >
              <MessageSquare className="h-4.5 w-4.5 text-rose-500 mb-1" />
              <span className="text-xs">Open Discussion</span>
              <span className="text-[10px] opacity-80 font-normal">Threaded conversations, ideas & replies</span>
            </button>
            <button
              type="button"
              onClick={() => setPostType('question')}
              className={cn(
                'flex flex-col items-center gap-1 p-3.5 rounded-xl border-2 transition-all text-center',
                postType === 'question'
                  ? 'border-rose-600 bg-rose-50/50 text-rose-700 dark:border-rose-500 dark:bg-rose-500/10 dark:text-rose-400 font-bold'
                  : 'border-zinc-200 hover:border-zinc-300 text-zinc-600 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-white/5'
              )}
            >
              <HelpCircle className="h-4.5 w-4.5 text-rose-500 mb-1" />
              <span className="text-xs">Structured Q&A</span>
              <span className="text-[10px] opacity-80 font-normal">Direct answers with credit bounties</span>
            </button>
            <button
              type="button"
              onClick={() => setPostType('debate')}
              className={cn(
                'flex flex-col items-center gap-1 p-3.5 rounded-xl border-2 transition-all text-center',
                postType === 'debate'
                  ? 'border-rose-600 bg-rose-50/50 text-rose-700 dark:border-rose-500 dark:bg-rose-500/10 dark:text-rose-400 font-bold'
                  : 'border-zinc-200 hover:border-zinc-300 text-zinc-600 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-white/5'
              )}
            >
              <Scale className="h-4.5 w-4.5 text-rose-500 mb-1" />
              <span className="text-xs">Formal Debate</span>
              <span className="text-[10px] opacity-80 font-normal">Side-by-side structured arguments</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Post Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              postType === 'question' 
                ? 'Ask a question...' 
                : postType === 'debate'
                  ? 'State the debate motion (e.g., Remote work is better than office work)...'
                  : 'Share a post...'
            }
            className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-rose-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Choose Topic
          </label>
          <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.value;
              const Icon = {
                technology: Laptop,
                movies: Film,
                food_cooking: Utensils,
                fashion_style: Shirt,
                science: Atom,
                music: Music,
                books: BookOpen,
                business: Briefcase,
                psychology: Brain,
                history: Scroll,
                health: HeartPulse,
                general: HelpCircle,
              }[cat.value];
 
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => {
                    setCategory(cat.value);
                    if (cat.value !== 'technology') setCodeSnippet('');
                  }}
                  className={`flex items-center gap-2 rounded-xl border p-2.5 transition-all text-left ${
                    isSelected
                      ? 'border-rose-600 bg-rose-50 text-rose-700 dark:border-rose-500 dark:bg-rose-500/10 dark:text-rose-400 font-semibold'
                      : 'border-zinc-200 hover:border-zinc-300 text-zinc-600 dark:border-white/10 dark:text-zinc-400'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
                  <span className="text-xs">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Context / Details
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share details or details so other members can give helpful answers..."
            rows={4}
            className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-rose-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        </div>

        {postType === 'debate' && (
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Your Stance
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStance('affirmative')}
                className={cn(
                  'flex-1 py-2.5 px-4 rounded-xl border-2 text-xs font-bold transition-all text-center',
                  stance === 'affirmative'
                    ? 'border-emerald-600 bg-emerald-50/50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400'
                    : 'border-zinc-200 hover:border-zinc-300 text-zinc-600 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-white/5'
                )}
              >
                Affirmative (Pro)
              </button>
              <button
                type="button"
                onClick={() => setStance('negative')}
                className={cn(
                  'flex-1 py-2.5 px-4 rounded-xl border-2 text-xs font-bold transition-all text-center',
                  stance === 'negative'
                    ? 'border-rose-600 bg-rose-50/50 text-rose-700 dark:border-rose-500 dark:bg-rose-500/10 dark:text-rose-400'
                    : 'border-zinc-200 hover:border-zinc-300 text-zinc-600 dark:border-white/10 dark:text-zinc-400 dark:hover:bg-white/5'
                )}
              >
                Negative (Con)
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Category Code snippet Input */}
        {category === 'technology' && (
          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Code Snippet
            </label>
            <textarea
              value={codeSnippet}
              onChange={(e) => setCodeSnippet(e.target.value)}
              placeholder="// Paste your code block here..."
              rows={8}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-900 px-3.5 py-3 text-xs font-mono text-amber-200 placeholder:text-zinc-600 focus:outline-none dark:border-white/10"
            />
          </div>
        )}

        {/* Dynamic Image attachments */}
        <MediaDropzone value={mediaUrls} onChange={setMediaUrls} />

        {/* Dynamic Audio attachments */}
        {['movies', 'music', 'books', 'business', 'psychology', 'history', 'health', 'general'].includes(category) && (
          <VoiceRecorder value={audioUrl || undefined} onChange={setAudioUrl} />
        )}

        {/* Bounty Setup Escrow */}
        {postType === 'question' && (
          <div className="rounded-xl border border-amber-100 bg-amber-50/30 p-4 dark:border-amber-500/20 dark:bg-amber-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Coins className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    Add Active Bounty
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Lock credits in escrow. The best accepted answer claims the payout.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={hasBounty}
                onChange={(e) => setHasBounty(e.target.checked)}
                className="h-4.5 w-4.5 rounded border-zinc-300 text-rose-600 focus:ring-rose-500 dark:border-white/10 dark:bg-white/5"
              />
            </div>
 
            {hasBounty && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs text-zinc-600 dark:text-zinc-400">Bounty Amount (credits):</span>
                <input
                  type="number"
                  min={1}
                  required={hasBounty}
                  value={bountyAmount}
                  onChange={(e) => setBountyAmount(Math.max(1, Number(e.target.value)))}
                  className="w-24 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm font-bold text-zinc-900 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>
            )}
          </div>
        )}

        {/* Targeted Specific Expert (24-Hour Exclusivity Lock) */}
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 dark:border-amber-500/20 dark:bg-amber-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  Target Specific Expert (Optional)
                  <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400 border border-amber-500/30">
                    <Lock className="h-2.5 w-2.5" /> 24h Lock
                  </span>
                </p>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                  Direct this post to a specific expert. Grants them an exclusive 24-hour window to answer.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isTargeted}
              onChange={(e) => {
                const checked = e.target.checked;
                setIsTargeted(checked);
                if (!checked) setTargetedExpertId(null);
              }}
              className="h-4.5 w-4.5 rounded border-zinc-300 text-rose-600 focus:ring-rose-500 dark:border-white/10 dark:bg-white/5 cursor-pointer"
            />
          </div>

          {isTargeted && (
            <div className="mt-4 pt-3 border-t border-amber-200/60 dark:border-amber-500/15 space-y-3">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="text"
                  value={contributorSearch}
                  onChange={(e) => setContributorSearch(e.target.value)}
                  placeholder="Search top contributors by username..."
                  className="w-full rounded-lg border border-zinc-200 bg-white pl-8 pr-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-rose-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>

              {/* Contributors horizontally scrolling list */}
              {loadingContributors ? (
                <div className="flex items-center justify-center gap-2 py-4 text-xs text-zinc-500">
                  <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                  Loading expert contributors...
                </div>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-1 pt-1 themed-scrollbar">
                  {filteredContributors.length === 0 ? (
                    <p className="text-xs text-zinc-500 py-2">No matching contributors found.</p>
                  ) : (
                    filteredContributors.map((c) => {
                      const isSelected = targetedExpertId === c._id;
                      return (
                        <button
                          key={c._id}
                          type="button"
                          onClick={() => setTargetedExpertId(isSelected ? null : c._id)}
                          className={cn(
                            'flex shrink-0 items-center gap-2.5 rounded-xl border p-2.5 transition-all text-left cursor-pointer',
                            isSelected
                              ? 'border-rose-500 bg-rose-500/10 ring-2 ring-rose-500 dark:bg-rose-500/20'
                              : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-850'
                          )}
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-rose-500 to-purple-600 text-xs font-bold text-white shadow-sm">
                            {c.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                {c.username}
                              </span>
                              {isSelected && <Check className="h-3 w-3 text-rose-500 font-bold" />}
                            </div>
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                              {c.reputationScore} rep
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {targetedExpertId && (
                <div className="flex items-center justify-between rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 text-xs text-rose-700 dark:text-rose-300">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Lock className="h-3.5 w-3.5 text-rose-500" />
                    Locked for <strong>@{contributors.find((c) => c._id === targetedExpertId)?.username}</strong> for 24 hours
                  </span>
                  <button
                    type="button"
                    onClick={() => setTargetedExpertId(null)}
                    className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-zinc-100 pt-4 dark:border-white/5">
          <Button variant="secondary" size="md" type="button" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="md" type="submit" isLoading={isSubmitting}>
            {postType === 'debate' ? 'Open Debate' : 'Publish Post'}
          </Button>
        </div>
      </form>
    </div>
  );
}
