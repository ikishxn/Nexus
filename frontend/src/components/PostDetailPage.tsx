import { useState, FormEvent, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  ArrowLeft, Coins, CheckCircle, Volume2, 
  Send, Loader2, Paperclip, Mic, Clipboard, Check, ArrowBigUp, ArrowBigDown, Trash2, MoreVertical, Lock
} from 'lucide-react';
import { usePostDetails } from '../lib/hooks';
import api from '../lib/api';
import { cn } from '../lib/cn';
import { Button } from './UIComponents';
import MediaDropzone from './MediaDropzone';
import VoiceRecorder from './VoiceRecorder';
import CommentSection from './CommentSection';
import { Post } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface AnswerItem {
  _id: string;
  postId: string;
  author: {
    _id: string;
    username: string;
    reputationScore: number;
    reputationXp?: number;
    badges?: string[];
  };
  text?: string;
  audioNoteUrl?: string;
  mediaUrls: string[];
  isAccepted: boolean;
  aiBotScore: number;
  status: string;
  createdAt: string;
}

interface AnswerNodeProps {
  answer: AnswerItem;
  post: Post;
  currentUser: any;
  onAccept: (answerId: string) => Promise<void>;
}

function AnswerNodeItem({ answer, post, currentUser, onAccept }: AnswerNodeProps) {
  const currentUserIdStr = (currentUser as any)?.id || (currentUser as any)?.userId || (currentUser as any)?._id;
  const isPostAuthor = post.author && (post.author._id === currentUserIdStr);
  const isAnswerAuthor = answer.author && (answer.author._id === currentUserIdStr);
  
  const showAcceptButton = 
    post.bountyStatus === 'active' && 
    currentUser && 
    isPostAuthor && 
    !isAnswerAuthor &&
    !answer.isAccepted;

  const isAnswerAccepted = answer.isAccepted || post.acceptedAnswer === answer._id;
  const isHumanVerified = answer.aiBotScore < 30;

  return (
    <div className={cn(
      'rounded-xl border border-zinc-200 bg-white p-4 transition-all dark:border-zinc-800 dark:bg-zinc-900/40 shadow-sm',
      isAnswerAccepted && 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10'
    )}>
      <div className="flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-rose-500 to-purple-600 text-xs font-bold text-white shadow-sm ring-1 ring-white/10">
          {answer.author.username.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {answer.author.username}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {answer.author.reputationScore} rep
            </span>
            
            {isHumanVerified && (
              <span className="inline-flex items-center gap-0.5 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle className="h-2.5 w-2.5" /> Human Verified
              </span>
            )}

            {isAnswerAccepted && (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <CheckCircle className="h-3 w-3" /> Accepted Answer
              </span>
            )}
          </div>

          {answer.text && (
            <p className="mt-2 text-sm text-zinc-800 dark:text-zinc-300 leading-relaxed">
              {answer.text}
            </p>
          )}

          {answer.audioNoteUrl && (
            <div className="mt-2.5 flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-900 max-w-md">
              <Volume2 className="h-4 w-4 text-rose-500" />
              <audio src={answer.audioNoteUrl} controls className="h-8 flex-1" />
            </div>
          )}

          {answer.mediaUrls && answer.mediaUrls.length > 0 && (
            <div className="mt-3 flex gap-2 flex-wrap">
              {answer.mediaUrls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block max-w-[120px] rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-zinc-50 dark:bg-zinc-900">
                  <img src={url} alt="Attached screenshot" className="aspect-square w-full object-cover" />
                </a>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center gap-3">
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
              {new Date(answer.createdAt).toLocaleString()}
            </span>
            
            {showAcceptButton && (
              <button
                type="button"
                onClick={() => onAccept(answer._id)}
                className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors cursor-pointer"
              >
                <Check className="h-3 w-3" />
                Accept & Pay Bounty
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface PostDetailPageProps {
  postId: string;
  onBack: () => void;
}

export default function PostDetailPage({ postId, onBack }: PostDetailPageProps) {
  const { post, answers, isLoading, error, mutate } = usePostDetails(postId);
  const { setPostCategory } = useTheme();

  useEffect(() => {
    if (post?.category) {
      setPostCategory(post.category);
    }
    return () => {
      setPostCategory(null);
    };
  }, [post?.category, setPostCategory]);

  // Submit Answer states
  const [text, setText] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [audioNoteUrl, setAudioNoteUrl] = useState<string | null>(null);
  
  const [showAttachImage, setShowAttachImage] = useState(false);
  const [showAttachVoice, setShowAttachVoice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
 
  // Voting state
  const [voteScore, setVoteScore] = useState(0);
  const [myVote, setMyVote] = useState<'up' | 'down' | null>(null);
  const [showFloatReward, setShowFloatReward] = useState(false);
 
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (post) {
      setVoteScore(post.voteScore || 0);
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        const userId = user.id || user._id;
        const hasUp = post.upvotes?.some((id: any) => (id.toString() === userId || id._id === userId));
        if (hasUp) {
          setMyVote('up');
        } else {
          const hasDown = post.downvotes?.some((id: any) => (id.toString() === userId || id._id === userId));
          setMyVote(hasDown ? 'down' : null);
        }
      } else {
        setMyVote(null);
      }
    }
  }, [post]);

  const handleVote = async (type: 'up' | 'down') => {
    if (!post) return;
    try {
      if (type === 'up' && myVote !== 'up') {
        setShowFloatReward(true);
        setTimeout(() => setShowFloatReward(false), 950);
      }

      const endpoint = `/posts/${post._id}/${type === 'up' ? 'upvote' : 'downvote'}`;
      const response = await api.post(endpoint);
      const updatedPost = response.data;
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
      await mutate();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || `Failed to ${type}vote`);
    }
  };

  // Storage syncing handled by global AuthProvider

  const handleCopyCode = async () => {
    if (!post?.content?.codeSnippet) return;
    await navigator.clipboard.writeText(post.content.codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAcceptAnswer = async (answerId: string) => {
    try {
      await api.post(`/answers/${answerId}/accept`);
      
      const userProfile = await api.get('/auth/me').catch(() => null);
      if (userProfile) {
        localStorage.setItem('user', JSON.stringify(userProfile.data));
        window.dispatchEvent(new Event('storage'));
      }

      await mutate();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to accept answer');
    }
  };

  const handleDeletePost = async () => {
    if (!post) return;
    try {
      await api.delete(`/posts/${post._id}`);
      onBack();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to delete post');
    }
  };

  const handleSubmitAnswer = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !audioNoteUrl && mediaUrls.length === 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/answers', {
        postId,
        text: text.trim() || undefined,
        audioNoteUrl: audioNoteUrl || undefined,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
      });

      if (response.data.status === 'quarantined') {
        alert('Your submission was flagged by our bot screening engine and quarantined for verification.');
      }

      setText('');
      setMediaUrls([]);
      setAudioNoteUrl(null);
      setShowAttachImage(false);
      setShowAttachVoice(false);
      await mutate();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-60 items-center justify-center gap-2 text-sm text-slate-400 dark:text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
        Loading thread details...
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-3xl mx-auto w-full pt-8 pb-24 px-4 space-y-4 animate-in fade-in">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900 px-3 py-2 rounded-lg transition-colors w-fit -ml-3 mb-6 font-medium cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Feed</span>
        </button>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-8 text-center space-y-3 shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
            <Coins className="h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Thread Not Found
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            {error && error.includes('not found')
              ? 'This post could not be located. It may have been removed or this bounty card was a placeholder.'
              : error || 'The requested post does not exist or has been removed.'}
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={onBack}
            className="mt-2 bg-rose-600 hover:bg-rose-500 text-white font-bold"
          >
            Explore Active Discussions
          </Button>
        </div>
      </div>
    );
  }

  const isLocked = Boolean(post?.exclusiveUntil && new Date(post.exclusiveUntil) > new Date());
  const expertId = typeof post?.targetedExpertId === 'object' && (post?.targetedExpertId as any)?._id
    ? (post?.targetedExpertId as any)._id
    : post?.targetedExpertId;
  const currentUserIdStr = (currentUser as any)?.id || (currentUser as any)?.userId || (currentUser as any)?._id;
  const isTargetedExpert = Boolean(currentUserIdStr && expertId && (currentUserIdStr === expertId.toString()));
  const hoursRemaining = post?.exclusiveUntil
    ? Math.max(1, Math.ceil((new Date(post.exclusiveUntil).getTime() - Date.now()) / (1000 * 60 * 60)))
    : 0;

  return (
    <>
      <Helmet>
        <title>{post.title} | Nexus</title>
        <meta property="og:title" content={`Nexus: ${post.title}`} />
        <meta property="og:description" content={post.content?.text?.slice(0, 160) || 'Explore this discussion on Nexus.'} />
        {post.content?.mediaUrls?.[0] && (
          <meta property="og:image" content={post.content.mediaUrls[0]} />
        )}
      </Helmet>
      <div className="max-w-3xl mx-auto w-full pt-8 pb-24 px-4">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900 px-3 py-2 rounded-lg transition-colors w-fit -ml-3 mb-6 font-medium cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Feed</span>
          </button>

          {post.author && (currentUser?.id === post.author._id || currentUser?._id === post.author._id) && (
            <div className="relative mb-6">
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-2 text-zinc-500 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-800"
                title="Post options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-1 w-36 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl py-1 z-30">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDropdown(false);
                      setShowConfirmModal(true);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Post
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Post - Sitting naturally on global background without card borders */}
        <article className="w-full">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-rose-500 to-purple-600 text-sm font-bold text-white shadow-sm ring-1 ring-white/10">
                {post.author.username.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {post.author.username}
                </p>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {post.author.reputationScore} rep • {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              <span className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border',
                post.postType === 'question'
                  ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20'
                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
              )}>
                {post.postType === 'question' ? 'Q&A' : 'Discussion'}
              </span>

              {post.bountyStatus === 'active' && post.bountyAmount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400 shadow-sm shadow-amber-500/20">
                  <Coins className="h-3.5 w-3.5" />
                  {post.bountyAmount} cr Bounty
                </span>
              )}

              {post.exclusiveUntil && new Date(post.exclusiveUntil) > new Date() && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400 shadow-sm shadow-amber-500/20">
                  <Lock className="h-3.5 w-3.5 text-amber-500" />
                  Locked for @{typeof post.targetedExpertId === 'object' && post.targetedExpertId ? (post.targetedExpertId as any).username : 'expert'}
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300">
                {post.category}
              </span>
            </div>
          </div>

          {/* High contrast title in both light (zinc-900) and dark (zinc-50) */}
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-4 mt-6 leading-tight tracking-tight">
            {post.title}
          </h1>

          {/* Post Content with proper dark/light contrast */}
          <div className="text-base leading-relaxed text-zinc-800 dark:text-zinc-300 space-y-4">
            {post.content.text && (
              <p className="whitespace-pre-wrap text-zinc-800 dark:text-zinc-300 leading-relaxed">{post.content.text}</p>
            )}

            {post.category === 'technology' && post.content.codeSnippet && (
              <div className="relative group overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/90 mt-4">
                <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-100/80 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-500 dark:text-zinc-400">Code Snippet</span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="rounded p-1 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                    title="Copy code"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Clipboard className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <pre className="max-h-80 overflow-auto p-4 text-xs font-mono text-zinc-800 dark:text-zinc-200">
                  <code>{post.content.codeSnippet}</code>
                </pre>
              </div>
            )}

            {/* Media Framing: forced full width without nested gray padding */}
            {post.content.mediaUrls && post.content.mediaUrls.length > 0 && (
              <div className="space-y-4 mt-4">
                {post.content.mediaUrls.map((url: string, i: number) => {
                  const isAudio =
                    url.match(/\.(mp3|wav|ogg|m4a|webm)($|\?)/i) ||
                    url.includes('video/upload') ||
                    url.includes('raw/upload');
                  return isAudio ? (
                    <div
                      key={i}
                      className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/80 p-3"
                    >
                      <Volume2 className="h-4 w-4 text-rose-500" />
                      <audio src={url} controls className="h-8 flex-1" />
                    </div>
                  ) : (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded-xl group"
                    >
                      <img
                        src={url}
                        alt={`Attachment ${i + 1}`}
                        className="w-full max-h-[500px] object-cover rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm mt-4"
                      />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Bar / Vote Container */}
          <div className="mt-8 flex items-center justify-between">
            <div className="relative flex items-center bg-zinc-100 dark:bg-zinc-900 rounded-full p-1 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              {showFloatReward && (
                <span className="absolute -top-6 left-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400 drop-shadow animate-float-fade z-30 select-none">
                  +1 cr
                </span>
              )}
              <button
                type="button"
                onClick={() => handleVote('up')}
                className={cn(
                  'p-1.5 rounded-full transition-all hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer',
                  myVote === 'up' && 'text-rose-600 dark:text-rose-500 hover:text-rose-500'
                )}
                title="Upvote (+1 cr reward to author)"
              >
                <ArrowBigUp className={cn('h-5 w-5', myVote === 'up' && 'fill-current')} />
              </button>
              <span className={cn(
                'px-2.5 text-xs font-bold min-w-[24px] text-center',
                myVote === 'up' ? 'text-rose-600 dark:text-rose-500' : myVote === 'down' ? 'text-sky-600 dark:text-sky-400' : 'text-zinc-800 dark:text-zinc-200'
              )}>
                {voteScore}
              </span>
              <button
                type="button"
                onClick={() => handleVote('down')}
                className={cn(
                  'p-1.5 rounded-full transition-all hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer',
                  myVote === 'down' && 'text-sky-600 dark:text-sky-400 hover:text-sky-500'
                )}
                title="Downvote"
              >
                <ArrowBigDown className={cn('h-5 w-5', myVote === 'down' && 'fill-current')} />
              </button>
            </div>
          </div>
        </article>

        {/* Visual Break / Divider */}
        <div className="w-full h-px bg-zinc-200 dark:bg-zinc-800 my-8"></div>

        {/* Header */}
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">Discussion</h3>

        {/* Discussion Section */}
        {post.postType === 'question' ? (
          <div className="space-y-6">
            {/* Answers List */}
            {answers && answers.length > 0 ? (
              <div className="space-y-4">
                {answers.map((answer: any) => (
                  <AnswerNodeItem
                    key={answer._id}
                    answer={answer}
                    post={post}
                    currentUser={currentUser}
                    onAccept={handleAcceptAnswer}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-6">
                No answers yet. Weigh in below to help out!
              </p>
            )}

            {/* Answer Form */}
            <form onSubmit={handleSubmitAnswer} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/40 shadow-sm">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-200">
                Your Answer
              </h4>
              
              <textarea
                disabled={isLocked && !isTargetedExpert}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  isLocked && !isTargetedExpert
                    ? `Awaiting targeted expert response... unlocks in ${hoursRemaining} hours.`
                    : isLocked && isTargetedExpert
                      ? "You are the targeted expert! Share your answer..."
                      : "Add a comment..."
                }
                rows={4}
                className={cn(
                  "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 focus:outline-none shadow-sm transition-all dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500",
                  isLocked && isTargetedExpert && "ring-2 ring-rose-500 animate-pulse border-rose-500 bg-rose-50/20 dark:bg-rose-500/10",
                  isLocked && !isTargetedExpert && "opacity-60 bg-zinc-100 dark:bg-zinc-800/50 cursor-not-allowed text-zinc-500 dark:text-zinc-400"
                )}
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isLocked && !isTargetedExpert}
                  onClick={() => setShowAttachImage(p => !p)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
                    showAttachImage 
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20' 
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
                  )}
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  Attach Screenshots
                </button>

                <button
                  type="button"
                  disabled={isLocked && !isTargetedExpert}
                  onClick={() => setShowAttachVoice(p => !p)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
                    showAttachVoice 
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20' 
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
                  )}
                >
                  <Mic className="h-3.5 w-3.5" />
                  Record Audio Note
                </button>
              </div>

              {showAttachImage && (
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <MediaDropzone value={mediaUrls} onChange={setMediaUrls} />
                </div>
              )}

              {showAttachVoice && (
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <VoiceRecorder value={audioNoteUrl || undefined} onChange={setAudioNoteUrl} />
                </div>
              )}

              <div className="flex items-center justify-end border-t border-zinc-200 dark:border-zinc-800 pt-4">
                <Button
                  type="submit"
                  disabled={isLocked && !isTargetedExpert}
                  isLoading={isSubmitting}
                  icon={<Send className="h-4 w-4" />}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold disabled:opacity-40"
                >
                  Submit Answer
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <CommentSection postId={post._id} post={post} />
        )}
      </div>
 
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
                onClick={() => {
                  setShowConfirmModal(false);
                  handleDeletePost();
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
