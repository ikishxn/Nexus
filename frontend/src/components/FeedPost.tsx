import { useState } from 'react';
import { 
  Coins, ShieldCheck, Volume2, Clipboard, Check, ArrowBigUp, ArrowBigDown, MessageSquare,
  Laptop, Film, Utensils, Shirt, Atom, Music as MusicIcon, BookOpen, 
  Briefcase, Brain, Scroll, HeartPulse, HelpCircle, Trash2, MoreVertical, Lock
} from 'lucide-react';
import { Post } from '../types';
import { Card, CardFooter, Button } from './UIComponents';
import { cn } from '../lib/cn';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import InlineCommentSection from './InlineCommentSection';

interface FeedPostProps {
  post: Post;
  onViewComments?: (postId: string) => void;
  onRequestChat: (postId: string, text: string) => void;
  onDeleteSuccess?: () => void;
}

export default function FeedPost({ post, onViewComments, onRequestChat, onDeleteSuccess }: FeedPostProps) {
  const [copied, setCopied] = useState(false);
  const [voteScore, setVoteScore] = useState(post.voteScore || 0);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showFloatReward, setShowFloatReward] = useState(false);
  const { user: currentUser } = useAuth();

  const [myVote, setMyVote] = useState<'up' | 'down' | null>(() => {
    if (!currentUser) return null;
    const userId = currentUser.id || currentUser._id;
    const hasUp = post.upvotes?.some((id: any) => (id.toString() === userId || id._id === userId));
    if (hasUp) return 'up';
    const hasDown = post.downvotes?.some((id: any) => (id.toString() === userId || id._id === userId));
    if (hasDown) return 'down';
    return null;
  });

  const currentUserIdStr = currentUser?.id || currentUser?._id;
  const isAuthor = currentUser && post.author && ((post.author._id || post.author) === currentUserIdStr);

  const handleDeletePost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiFetch(`/posts/${post._id}`, {
        method: 'DELETE',
      });
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete post');
    }
  };

  const handleCopyCode = async () => {
    if (!post.content.codeSnippet) return;
    await navigator.clipboard.writeText(post.content.codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVote = async (type: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (type === 'up' && myVote !== 'up') {
        setShowFloatReward(true);
        setTimeout(() => setShowFloatReward(false), 950);
      }

      const endpoint = `/posts/${post._id}/${type === 'up' ? 'upvote' : 'downvote'}`;
      const updatedPost = await apiFetch<Post>(endpoint, {
        method: 'POST',
      });
      setVoteScore(updatedPost.voteScore || 0);
      
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        const userId = user.id || user._id;
        const isUp = updatedPost.upvotes?.some((id: any) => (id.toString() === userId || id._id === userId));
        const isDown = updatedPost.downvotes?.some((id: any) => (id.toString() === userId || id._id === userId));
        setMyVote(isUp ? 'up' : isDown ? 'down' : null);
      }

      // Signal live wallet update to top navigation header
      window.dispatchEvent(new Event('wallet:update'));
    } catch (err: any) {
      alert(err.message || `Please sign in to ${type}vote posts.`);
    }
  };

  // Extract and separate media formats
  const mediaUrls = post.content?.mediaUrls || [];
  const audioUrls = mediaUrls.filter(url => 
    url.match(/\.(mp3|wav|ogg|m4a|webm)($|\?)/i) || url.includes('video/upload') || url.includes('raw/upload')
  );
  // Support root-level or content-level audioNoteUrl
  const mainAudio = post.audioNoteUrl || post.content?.audioNoteUrl;
  if (mainAudio && !audioUrls.includes(mainAudio)) {
    audioUrls.push(mainAudio);
  }

  const imageUrls = mediaUrls.filter(url => 
    !url.match(/\.(mp3|wav|ogg|m4a|webm)($|\?)/i) && !url.includes('video/upload') && !url.includes('raw/upload')
  );

  // Determine category badge attributes
  const categoryStyles = {
    technology: {
      bg: 'bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-400',
      icon: Laptop,
      label: 'Technology',
    },
    movies: {
      bg: 'bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-400',
      icon: Film,
      label: 'Movies',
    },
    food_cooking: {
      bg: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400',
      icon: Utensils,
      label: 'Food & Cooking',
    },
    fashion_style: {
      bg: 'bg-pink-500/10 text-pink-700 ring-pink-500/20 dark:text-pink-400',
      icon: Shirt,
      label: 'Fashion & Style',
    },
    science: {
      bg: 'bg-cyan-500/10 text-cyan-700 ring-cyan-500/20 dark:text-cyan-400',
      icon: Atom,
      label: 'Science',
    },
    music: {
      bg: 'bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-400',
      icon: MusicIcon,
      label: 'Music',
    },
    books: {
      bg: 'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-400',
      icon: BookOpen,
      label: 'Books',
    },
    business: {
      bg: 'bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-400',
      icon: Briefcase,
      label: 'Business',
    },
    psychology: {
      bg: 'bg-teal-500/10 text-teal-700 ring-teal-500/20 dark:text-teal-400',
      icon: Brain,
      label: 'Psychology',
    },
    history: {
      bg: 'bg-yellow-600/10 text-yellow-800 ring-yellow-600/20 dark:text-yellow-400',
      icon: Scroll,
      label: 'History',
    },
    health: {
      bg: 'bg-red-500/10 text-red-700 ring-red-500/20 dark:text-red-400',
      icon: HeartPulse,
      label: 'Health',
    },
    general: {
      bg: 'bg-zinc-500/10 text-zinc-700 ring-zinc-500/20 dark:text-zinc-400',
      icon: HelpCircle,
      label: 'General',
    },
  }[post.category || 'general'] || {
    bg: 'bg-zinc-500/10 text-zinc-700 ring-zinc-500/20 dark:text-zinc-400',
    icon: HelpCircle,
    label: 'General',
  };

  const CategoryIcon = categoryStyles.icon;
  const isHumanVerified = (post.aiBotScore ?? 0) < 25;

  return (
    <>
      <Card className="hover:border-zinc-300 dark:hover:border-white/10 transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-rose-500 to-purple-600 text-sm font-bold text-white shadow-md shadow-rose-500/10">
            {(post.author?.username || 'G').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-bold text-zinc-900 dark:text-white">
                {post.author?.username || 'Anonymous User'}
              </span>
              
              {isHumanVerified && (
                <span 
                  title="Verified Human" 
                  className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.15)] animate-pulse cursor-help"
                >
                  <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Verified Human</span>
                </span>
              )}
 
              {post.author?.badges?.map((badge, idx) => (
                <span key={idx} className="inline-flex items-center rounded bg-zinc-50 px-1 py-0.5 text-[9px] font-extrabold text-zinc-700 ring-1 ring-inset ring-zinc-600/10 dark:bg-white/5 dark:text-zinc-400">
                  {badge}
                </span>
              ))}
            </div>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
              {post.author?.reputationScore ?? 0} rep • {new Date(post.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAuthor && (
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDropdown(!showDropdown);
                }}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer mr-1"
                title="Post options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {showDropdown && (
                <div 
                  className="absolute right-0 mt-1 w-32 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-lg py-1 z-30"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDropdown(false);
                      setShowConfirmModal(true);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-bold text-red-650 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Post
                  </button>
                </div>
              )}
            </div>
          )}

          <span className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ring-1 ring-inset',
            post.postType === 'question'
              ? 'bg-purple-500/10 text-purple-700 ring-purple-500/20 dark:text-purple-400'
              : 'bg-rose-500/10 text-rose-700 ring-rose-500/20 dark:text-rose-400'
          )}>
            {post.postType === 'question' ? 'Q&A' : 'Discussion'}
          </span>

          {post.bountyStatus === 'active' && post.bountyAmount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow-sm shadow-amber-500/20 dark:bg-amber-600">
              <Coins className="h-3.5 w-3.5" />
              ${post.bountyAmount} Bounty
            </span>
          )}

          {post.exclusiveUntil && new Date(post.exclusiveUntil) > new Date() && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400 shadow-sm shadow-amber-500/20">
              <Lock className="h-3 w-3 text-amber-500" />
              Locked for @{typeof post.targetedExpertId === 'object' && post.targetedExpertId ? (post.targetedExpertId as any).username : 'expert'}
            </span>
          )}

          <span className={cn(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset',
            categoryStyles.bg
          )}>
            <CategoryIcon className="h-3 w-3" />
            {categoryStyles.label}
          </span>
        </div>
      </div>

      {/* Title */}
      <h3
        onClick={() => onViewComments?.(post._id)}
        className={cn(
          "mt-4 text-base font-bold leading-snug text-zinc-900 dark:text-white",
          onViewComments && "cursor-pointer hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
        )}
      >
        {post.title}
      </h3>
 
      {/* Dynamic Content Layout */}
      <div className="mt-3.5 text-sm text-zinc-700 dark:text-zinc-300">
        {/* Technology Code Snippet block */}
        {post.category === 'technology' && post.content.codeSnippet && (
          <div className="relative group mt-2 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-white/5 dark:bg-white/5">
            <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-100/50 px-4 py-1.5 dark:border-white/5 dark:bg-white/5">
              <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
                Code Snippet
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
                title="Copy code"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Clipboard className="h-3.5 w-3.5" />}
              </button>
            </div>
            <pre className="max-h-60 overflow-auto p-4 text-[12px] font-mono leading-relaxed text-zinc-800 dark:text-zinc-300">
              <code>{post.content.codeSnippet}</code>
            </pre>
          </div>
        )}

        {/* Image Gallery / Grid Layout */}
        {imageUrls.length > 0 && (
          <div className={cn(
            "mt-3 gap-2 grid",
            imageUrls.length === 1 && !['food_cooking', 'fashion_style'].includes(post.category)
              ? "grid-cols-1"
              : imageUrls.length === 2
                ? "grid-cols-2"
                : "grid-cols-2 sm:grid-cols-3"
          )}>
            {imageUrls.map((url, idx) => (
              <div 
                key={idx} 
                className="group relative overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 dark:border-white/5 dark:bg-white/5"
              >
                <img 
                  src={url} 
                  alt={`Post attachment ${idx + 1}`} 
                  className={cn(
                    "w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]",
                    imageUrls.length === 1 && !['food_cooking', 'fashion_style'].includes(post.category)
                      ? "max-h-80 rounded-xl"
                      : "aspect-[4/3]"
                  )} 
                />
              </div>
            ))}
          </div>
        )}
 
        {post.content.text && (
          <p className="leading-relaxed mt-2 text-zinc-600 dark:text-zinc-400">
            {post.content.text}
          </p>
        )}
 
        {/* Audio Player Integration */}
        {audioUrls.length > 0 && (
          <div className="mt-3 space-y-2">
            {audioUrls.map((url, idx) => (
              <div key={idx} className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2 dark:border-white/5 dark:bg-white/5 shadow-sm">
                <div className="flex w-full items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                    <Volume2 className="h-4 w-4" />
                  </span>
                  <audio src={url} controls className="h-8 flex-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <CardFooter className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-3.5 dark:border-white/5">
        <div className="flex items-center gap-2">
          {/* Reddit-style Upvote/Downvote container */}
          <div className="relative flex items-center bg-zinc-50 dark:bg-white/5 rounded-full p-0.5 border border-zinc-100 dark:border-white/5">
            {showFloatReward && (
              <span className="absolute -top-6 left-1 text-[11px] font-black text-emerald-500 dark:text-emerald-400 drop-shadow animate-float-fade z-30 select-none">
                +1 cr
              </span>
            )}
            <button
              type="button"
              onClick={(e) => handleVote('up', e)}
              className={cn(
                'p-1 rounded-full transition-all hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-400 dark:text-zinc-500',
                myVote === 'up' && 'text-orange-500 hover:text-orange-600 dark:text-orange-400'
              )}
            >
              <ArrowBigUp className={cn('h-4 w-4', myVote === 'up' ? 'fill-current' : '')} />
            </button>
            <span className={cn(
              'px-2 text-xs font-bold min-w-[20px] text-center',
              myVote === 'up' ? 'text-orange-500' : myVote === 'down' ? 'text-rose-500' : 'text-zinc-700 dark:text-zinc-300'
            )}>
              {voteScore}
            </span>
            <button
              type="button"
              onClick={(e) => handleVote('down', e)}
              className={cn(
                'p-1 rounded-full transition-all hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-400 dark:text-zinc-500',
                myVote === 'down' && 'text-rose-500 hover:text-rose-600 dark:text-rose-400'
              )}
            >
              <ArrowBigDown className={cn('h-4 w-4', myVote === 'down' ? 'fill-current' : '')} />
            </button>
          </div>

          <Button
            id={`comment-toggle-btn-${post._id}`}
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowComments((prev) => !prev);
            }}
            className={cn(
              'transition-all duration-150',
              showComments && 'text-rose-600 dark:text-rose-400 bg-rose-500/10'
            )}
            icon={<MessageSquare className={cn('h-4 w-4', showComments ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-400')} />}
          >
            {commentCount} {post.postType === 'question' ? 'answers' : 'comments'}
          </Button>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => onRequestChat(post._id, post.title)}
          className="text-xs font-bold"
        >
          Ask Nexus AI
        </Button>
      </CardFooter>

      {/* Inline Comments Section */}
      {showComments && (
        <div className="animate-in slide-in-from-top-2">
          <InlineCommentSection
            postId={post._id}
            post={post}
            onCommentAdded={() => setCommentCount((prev) => prev + 1)}
          />
        </div>
      )}
      </Card>
 
      {showConfirmModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4 backdrop-blur-[2px]"
          onClick={() => setShowConfirmModal(false)}
        >
          <div 
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-panel dark:bg-zinc-900 dark:border dark:border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Delete Post</h3>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Are you sure you want to delete this post? This action will soft-delete the post content and cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={(e) => {
                  setShowConfirmModal(false);
                  handleDeletePost(e);
                }}
                className="bg-red-650 hover:bg-red-500 dark:bg-red-600 dark:hover:bg-red-500 shadow-lg shadow-red-600/10 text-white font-bold"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
