import { FormEvent, useEffect, useState } from 'react';
import { Loader2, Send, CornerDownRight, ChevronRight, MessageCircle } from 'lucide-react';
import api from '../lib/api';
import { Button } from './UIComponents';
import { cn } from '../lib/cn';
import { Post } from '../types';

export interface CommentNode {
  _id: string;
  postId: string;
  authorId: {
    _id: string;
    username: string;
    reputationScore: number;
    walletBalance?: number;
  };
  parentId: string | null;
  body: string;
  path: string;
  depth: number;
  status: 'approved' | 'quarantined';
  isAccepted?: boolean;
  createdAt: string;
  children: CommentNode[];
}

function buildCommentTree(flatComments: any[]): CommentNode[] {
  const commentMap: Record<string, CommentNode> = {};
  const roots: CommentNode[] = [];

  // Initialize all nodes
  flatComments.forEach((c) => {
    commentMap[c._id] = { ...c, children: [] };
  });

  // Assign children to parents
  flatComments.forEach((c) => {
    const node = commentMap[c._id];
    if (c.parentId && commentMap[c.parentId]) {
      commentMap[c.parentId].children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

interface CommentNodeItemProps {
  comment: CommentNode;
  postId: string;
  onRefresh: () => Promise<void>;
  currentUser: any;
}

function CommentNodeItem({ comment, postId, onRefresh, currentUser }: CommentNodeItemProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSubmitReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await api.post('/comments', {
        postId,
        parentId: comment._id,
        body: replyText.trim(),
      });

      if (response.data.status === 'quarantined') {
        alert('Your reply was flagged by the screening engine and quarantined for verification.');
      }

      setReplyText('');
      setIsReplying(false);
      await onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to post reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const countTotalReplies = (node: CommentNode): number => {
    let count = node.children.length;
    node.children.forEach((child) => {
      count += countTotalReplies(child);
    });
    return count;
  };

  if (isCollapsed) {
    const totalReplies = countTotalReplies(comment);
    return (
      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 dark:border-white/5 dark:bg-white/5">
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          <ChevronRight className="h-4 w-4" />
          <span>Show comment from {comment.authorId?.username || 'Anonymous'} ({totalReplies} {totalReplies === 1 ? 'reply' : 'replies'})</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {/* Left Collapser Thread Line */}
      <div className="flex flex-col items-center">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-rose-500 to-purple-600 text-xs font-bold text-white shadow-sm ring-1 ring-white/10">
          {(comment.authorId?.username || 'U').slice(0, 2).toUpperCase()}
        </div>
        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          title="Collapse thread"
          className="w-0.5 flex-1 bg-zinc-200 dark:bg-zinc-800 hover:bg-rose-500 my-1 cursor-pointer transition-colors"
        />
      </div>

      <div className="flex-1 min-w-0 pb-3">
        {/* Author Header */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
            {comment.authorId?.username || 'Anonymous'}
          </span>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
            {comment.authorId?.reputationScore ?? 0} rep • {new Date(comment.createdAt).toLocaleString()}
          </span>
        </div>

        {/* Body */}
        <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
          {comment.body}
        </p>

        {/* Footer Actions */}
        <div className="mt-1.5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsReplying((prev) => !prev)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 cursor-pointer transition-colors"
          >
            <CornerDownRight className="h-3 w-3" />
            {isReplying ? 'Cancel' : 'Reply'}
          </button>
        </div>

        {/* Reply form */}
        {isReplying && (
          <form onSubmit={handleSubmitReply} className="mt-2.5 max-w-xl space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
            <textarea
              required
              rows={2}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to ${comment.authorId?.username || 'comment'}...`}
              className="w-full rounded-lg border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 focus:outline-none transition-all dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setIsReplying(false)}
                disabled={isSubmitting}
                className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                isLoading={isSubmitting}
                icon={<Send className="h-3 w-3" />}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
              >
                Reply
              </Button>
            </div>
          </form>
        )}

        {/* Recursive Children comments */}
        {comment.children && comment.children.length > 0 && (
          <div className="mt-3.5 space-y-4 pl-1">
            {comment.children.map((child) => (
              <CommentNodeItem
                key={child._id}
                comment={child}
                postId={postId}
                onRefresh={onRefresh}
                currentUser={currentUser}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommentSection({ postId, post }: { postId: string; post?: Post }) {
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Comment Input
  const [bodyText, setBodyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentUser] = useState<any>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const currentUserId = currentUser?.id || currentUser?._id;
  const isLocked = Boolean(post?.exclusiveUntil && new Date(post.exclusiveUntil) > new Date());
  const expertId = typeof post?.targetedExpertId === 'object' && (post?.targetedExpertId as any)?._id
    ? (post?.targetedExpertId as any)._id
    : post?.targetedExpertId;
  const isTargetedExpert = Boolean(currentUser && expertId && (currentUserId === expertId.toString()));
  const hoursRemaining = post?.exclusiveUntil
    ? Math.max(1, Math.ceil((new Date(post.exclusiveUntil).getTime() - Date.now()) / (1000 * 60 * 60)))
    : 0;

  const loadComments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/comments/post/${postId}`);
      // Parse flat comments array into hierarchical comment tree
      const commentTree = buildCommentTree(response.data);
      setComments(commentTree);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Could not load comments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [postId]);

  const handleSubmitComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!bodyText.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await api.post('/comments', {
        postId,
        body: bodyText.trim(),
      });

      if (response.data.status === 'quarantined') {
        alert('Your comment was flagged by the screening engine and quarantined for verification.');
      }

      setBodyText('');
      await loadComments();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to submit comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to count total comments in hierarchical tree
  const countAllComments = (nodes: CommentNode[]): number => {
    let count = nodes.length;
    nodes.forEach((node) => {
      count += countAllComments(node.children);
    });
    return count;
  };

  const totalCount = countAllComments(comments);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <MessageCircle className="h-4.5 w-4.5 text-rose-600 dark:text-rose-500" />
        <span>{totalCount} {totalCount === 1 ? 'Comment' : 'Comments'}</span>
      </div>

      {/* Top Level Comment Form - High contrast dual theme with solid surface, subtle border, and rose focus */}
      <form onSubmit={handleSubmitComment} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/40 shadow-sm">
        <textarea
          required
          rows={3}
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
            "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 focus:outline-none shadow-sm transition-all dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500",
            isLocked && isTargetedExpert && "ring-2 ring-rose-500 animate-pulse border-rose-500 bg-rose-50/20 dark:bg-rose-500/10",
            isLocked && !isTargetedExpert && "opacity-60 bg-zinc-100 dark:bg-zinc-800/50 cursor-not-allowed text-zinc-500 dark:text-zinc-400"
          )}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isLocked && !isTargetedExpert}
            isLoading={isSubmitting}
            icon={<Send className="h-4 w-4" />}
            className="bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-sm shadow-rose-600/20 disabled:opacity-40"
          >
            Comment
          </Button>
        </div>
      </form>

      {/* Comments List */}
      {isLoading && (
        <div className="flex items-center justify-center py-8 gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <Loader2 className="h-4.5 w-4.5 animate-spin text-rose-500" />
          <span>Loading comments...</span>
        </div>
      )}

      {!isLoading && error && (
        <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 text-center py-4">{error}</p>
      )}

      {!isLoading && !error && comments.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">
          No comments yet. Start the conversation!
        </p>
      )}

      {!isLoading && !error && comments.length > 0 && (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentNodeItem
              key={comment._id}
              comment={comment}
              postId={postId}
              onRefresh={loadComments}
              currentUser={currentUser}
            />
          ))}
        </div>
      )}
    </div>
  );
}
