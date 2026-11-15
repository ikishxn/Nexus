import { useState, useEffect, useMemo, FormEvent } from 'react';
import {
  Loader2,
  Send,
  CornerDownRight,
  ShieldCheck,
  MessageCircle,
  AlertCircle,
  ArrowBigUp,
} from 'lucide-react';
import api from '../lib/api';
import { cn } from '../lib/cn';
import { useAuth } from '../context/AuthContext';
import { Post } from '../types';

export interface InlineComment {
  _id: string;
  postId: string;
  authorId?: {
    _id?: string;
    username?: string;
    reputationScore?: number;
    walletBalance?: number;
  };
  parentCommentId?: string | null;
  parentId?: string | null;
  body: string;
  path?: string;
  depth?: number;
  status?: 'approved' | 'quarantined';
  aiBotScore?: number;
  isAccepted?: boolean;
  upvotes?: (string | { _id: string })[];
  createdAt: string;
}

function formatTimeAgo(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  } catch {
    return dateString;
  }
}

interface CommentCardProps {
  comment: InlineComment;
  isTopLevel: boolean;
  currentUserId?: string;
  isReplying?: boolean;
  onToggleReply?: (commentId: string) => void;
  onUpvote: (commentId: string) => void;
  showReward?: boolean;
  replyText?: string;
  setReplyText?: (val: string) => void;
  isSubmittingReply?: boolean;
  onReplySubmit?: (commentId: string, e: FormEvent) => void;
}

function CommentCard({
  comment,
  isTopLevel,
  currentUserId,
  isReplying,
  onToggleReply,
  onUpvote,
  showReward,
  replyText,
  setReplyText,
  isSubmittingReply,
  onReplySubmit,
}: CommentCardProps) {
  const authorName = comment.authorId?.username || 'Anonymous';
  const authorInitials = authorName.slice(0, 2).toUpperCase();
  const isHumanVerified = (comment.aiBotScore ?? 0) < 25;

  const hasUpvoted = Boolean(
    currentUserId &&
      comment.upvotes?.some((id: any) => {
        const rawId = typeof id === 'object' && id?._id ? id._id : id;
        return rawId?.toString() === currentUserId;
      })
  );
  const upvoteCount = comment.upvotes?.length || 0;

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2.5">
        {/* Avatar */}
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 ring-1 ring-zinc-300/40 dark:ring-white/10">
          {authorInitials}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              {authorName}
            </span>

            {isHumanVerified && (
              <span
                title="Verified Human"
                className="inline-flex items-center gap-0.5 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/20"
              >
                <ShieldCheck className="h-2.5 w-2.5 text-emerald-500" />
                <span>Verified</span>
              </span>
            )}

            <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
              • {comment.authorId?.reputationScore ?? 0} rep • {formatTimeAgo(comment.createdAt)}
            </span>
          </div>

          {/* Body */}
          <p className="mt-1 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 break-words whitespace-pre-wrap">
            {comment.body}
          </p>

          {/* Action Row */}
          <div className="mt-1.5 flex items-center gap-2">
            {/* Upvote button with floating micro-reward animation */}
            <div className="relative inline-flex items-center">
              {showReward && (
                <span className="absolute -top-5 left-1 text-[10px] font-black text-emerald-500 dark:text-emerald-400 drop-shadow animate-float-fade z-30 select-none">
                  +1 cr
                </span>
              )}
              <button
                type="button"
                onClick={() => onUpvote(comment._id)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold transition-all',
                  hasUpvoted
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20'
                    : 'text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                )}
                title="Upvote comment"
              >
                <ArrowBigUp className={cn('h-3.5 w-3.5', hasUpvoted ? 'fill-current' : '')} />
                <span>{upvoteCount > 0 ? upvoteCount : 'Vote'}</span>
              </button>
            </div>

            {/* Top-Level Only: small Reply button next to upvote */}
            {isTopLevel && onToggleReply && (
              <button
                type="button"
                onClick={() => onToggleReply(comment._id)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold transition-colors',
                  isReplying
                    ? 'text-rose-600 dark:text-rose-400 font-bold'
                    : 'text-zinc-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400'
                )}
              >
                <CornerDownRight className="h-3 w-3" />
                <span>{isReplying ? 'Cancel' : 'Reply'}</span>
              </button>
            )}
          </div>

          {/* Top-Level Compact Reply Input Field */}
          {isTopLevel && isReplying && onReplySubmit && setReplyText && (
            <form onSubmit={(e) => onReplySubmit(comment._id, e)} className="mt-2.5 flex items-center gap-2">
              <input
                type="text"
                autoFocus
                required
                value={replyText || ''}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to ${authorName}...`}
                className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/90 dark:text-white shadow-sm"
              />
              <button
                type="submit"
                disabled={isSubmittingReply || !replyText?.trim()}
                className="inline-flex items-center justify-center gap-1 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-rose-600/20 hover:bg-rose-500 disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                {isSubmittingReply ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <span>Reply</span>
                    <Send className="h-3 w-3" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export interface InlineCommentSectionProps {
  postId: string;
  post?: Post;
  onCommentAdded?: () => void;
}

export default function InlineCommentSection({ postId, post, onCommentAdded }: InlineCommentSectionProps) {
  const [rawComments, setRawComments] = useState<InlineComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New root comment state
  const [bodyText, setBodyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active reply state
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [floatingRewardCommentId, setFloatingRewardCommentId] = useState<string | null>(null);

  const { user: currentUser } = useAuth();
  const currentUserId = (currentUser as any)?.id || (currentUser as any)?._id;

  const isLocked = Boolean(post?.exclusiveUntil && new Date(post.exclusiveUntil) > new Date());
  const expertId = typeof post?.targetedExpertId === 'object' && (post?.targetedExpertId as any)?._id
    ? (post?.targetedExpertId as any)._id
    : post?.targetedExpertId;
  const isTargetedExpert = Boolean(currentUser && expertId && (currentUserId === expertId.toString()));
  const hoursRemaining = post?.exclusiveUntil
    ? Math.max(1, Math.ceil((new Date(post.exclusiveUntil).getTime() - Date.now()) / (1000 * 60 * 60)))
    : 0;

  const fetchComments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/comments/post/${postId}`);
      setRawComments(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Could not load comments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (postId) {
      fetchComments();
    }
  }, [postId]);

  // Phase 20: Organize comments into topLevelComments and replies by parentCommentId
  const { topLevelComments, repliesByParentId } = useMemo(() => {
    const top: InlineComment[] = [];
    const repMap: Record<string, InlineComment[]> = {};

    rawComments.forEach((c) => {
      const parentId = c.parentCommentId || c.parentId;
      if (!parentId) {
        top.push(c);
      } else {
        if (!repMap[parentId]) {
          repMap[parentId] = [];
        }
        repMap[parentId].push(c);
      }
    });

    return { topLevelComments: top, repliesByParentId: repMap };
  }, [rawComments]);

  // Handle Root Comment Submit
  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!bodyText.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await api.post('/comments', {
        postId,
        body: bodyText.trim(),
      });

      if (response.data?.status === 'quarantined') {
        alert('Your comment was flagged by the screening engine and quarantined for verification.');
      }

      setBodyText('');
      await fetchComments();
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to submit comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Reply box for top-level comment
  const handleToggleReply = (commentId: string) => {
    if (activeReplyId === commentId) {
      setActiveReplyId(null);
      setReplyText('');
    } else {
      setActiveReplyId(commentId);
      setReplyText('');
    }
  };

  // Handle Reply Submit passing parentCommentId
  const handleReplySubmit = async (parentCommentId: string, e: FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setIsSubmittingReply(true);
    try {
      const response = await api.post('/comments', {
        postId,
        parentCommentId,
        body: replyText.trim(),
      });

      if (response.data?.status === 'quarantined') {
        alert('Your reply was flagged by the screening engine and quarantined for verification.');
      }

      setReplyText('');
      setActiveReplyId(null);
      await fetchComments();
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to post reply');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Handle Toggle Upvote on any comment
  const handleToggleUpvote = async (commentId: string) => {
    if (!currentUserId) {
      alert('Please sign in to upvote comments.');
      return;
    }

    const commentToVote = rawComments.find((c) => c._id === commentId);
    const currentVotes = (commentToVote?.upvotes || []).map((id: any) =>
      typeof id === 'object' && id?._id ? id._id.toString() : id.toString()
    );
    const hasVoted = currentVotes.includes(currentUserId);

    if (!hasVoted) {
      setFloatingRewardCommentId(commentId);
      setTimeout(() => setFloatingRewardCommentId(null), 950);
      window.dispatchEvent(new Event('wallet:update'));
    }

    // Optimistic UI update
    setRawComments((prev) =>
      prev.map((c) => {
        if (c._id !== commentId) return c;
        const votes = (c.upvotes || []).map((id: any) =>
          typeof id === 'object' && id?._id ? id._id.toString() : id.toString()
        );
        const voted = votes.includes(currentUserId);
        const newVotes = voted
          ? votes.filter((id) => id !== currentUserId)
          : [...votes, currentUserId];
        return {
          ...c,
          upvotes: newVotes,
        };
      })
    );

    try {
      const res = await api.post(`/comments/${commentId}/upvote`);
      if (res.data?.upvotes) {
        setRawComments((prev) =>
          prev.map((c) => (c._id === commentId ? { ...c, upvotes: res.data.upvotes } : c))
        );
      }
    } catch (err) {
      // Revert from server on failure
      fetchComments();
    }
  };

  const userInitials = (currentUser?.username || 'U').slice(0, 2).toUpperCase();

  return (
    <div
      id={`inline-comments-section-${postId}`}
      className="-mx-5 -mb-5 mt-4 p-4 rounded-b-2xl border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 backdrop-blur-sm space-y-4"
    >
      {/* Add a comment input field */}
      <form onSubmit={handleAddComment} className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-rose-500 to-purple-600 text-xs font-bold text-white shadow-sm shadow-rose-500/20">
          {userInitials}
        </div>
        <div className="relative flex-1">
          <input
            id={`comment-input-${postId}`}
            type="text"
            disabled={isLocked && !isTargetedExpert}
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            placeholder={
              isLocked && !isTargetedExpert
                ? `Awaiting targeted expert response... unlocks in ${hoursRemaining} hours.`
                : isLocked && isTargetedExpert
                  ? "You are the targeted expert! Share your response..."
                  : "Add a comment..."
            }
            className={cn(
              "w-full rounded-xl border border-zinc-200 bg-white py-2 pl-3.5 pr-24 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-100 shadow-sm transition-all",
              isLocked && isTargetedExpert && "ring-2 ring-rose-500 animate-pulse border-rose-500 bg-rose-50/20 dark:bg-rose-500/10",
              isLocked && !isTargetedExpert && "opacity-60 bg-zinc-100 dark:bg-zinc-800/50 cursor-not-allowed text-zinc-500 dark:text-zinc-400"
            )}
          />
          <button
            id={`comment-submit-btn-${postId}`}
            type="submit"
            disabled={isSubmitting || !bodyText.trim() || (isLocked && !isTargetedExpert)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1 text-xs font-bold text-white shadow-sm shadow-rose-600/20 hover:bg-rose-500 disabled:opacity-40 disabled:pointer-events-none transition-all duration-150"
          >
            {isSubmitting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <>
                <span>Post</span>
                <Send className="h-3 w-3" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-4 text-xs text-zinc-400 dark:text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
          <span>Loading comments...</span>
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="flex items-center justify-between rounded-lg bg-red-500/10 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchComments}
            className="font-bold underline hover:text-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && topLevelComments.length === 0 && (
        <div className="py-4 text-center">
          <MessageCircle className="mx-auto h-5 w-5 text-zinc-300 dark:text-zinc-600" />
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500 font-medium">
            No comments yet. Be the first to share your thoughts!
          </p>
        </div>
      )}

      {/* One-Level Deep Comment Thread */}
      {!isLoading && !error && topLevelComments.length > 0 && (
        <div className="space-y-4 pt-1">
          {topLevelComments.map((topComment) => {
            const replies = repliesByParentId[topComment._id] || [];
            return (
              <div key={topComment._id} className="space-y-2.5">
                {/* Main Top-Level Comment */}
                <CommentCard
                  comment={topComment}
                  isTopLevel={true}
                  currentUserId={currentUserId}
                  isReplying={activeReplyId === topComment._id}
                  onToggleReply={handleToggleReply}
                  onUpvote={handleToggleUpvote}
                  showReward={floatingRewardCommentId === topComment._id}
                  replyText={replyText}
                  setReplyText={setReplyText}
                  isSubmittingReply={isSubmittingReply}
                  onReplySubmit={handleReplySubmit}
                />

                {/* Specific Replies directly underneath (strictly 1-level) */}
                {replies.length > 0 && (
                  <div className="ml-10 space-y-2.5 border-l-2 border-zinc-200 dark:border-zinc-800 pl-3.5">
                    {replies.map((reply) => (
                      <CommentCard
                        key={reply._id}
                        comment={reply}
                        isTopLevel={false}
                        currentUserId={currentUserId}
                        onUpvote={handleToggleUpvote}
                        showReward={floatingRewardCommentId === reply._id}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
