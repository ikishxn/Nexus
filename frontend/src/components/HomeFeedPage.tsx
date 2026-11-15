import { useState, useEffect } from 'react';
import { 
  Inbox, LayoutGrid, Laptop, Film, Utensils, Shirt, Atom, 
  Music, BookOpen, Briefcase, Brain, Scroll, HeartPulse, HelpCircle 
} from 'lucide-react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { usePosts } from '../lib/hooks';
import FeedPost from './FeedPost';
import RightSidebar from './RightSidebar';
import { cn } from '../lib/cn';

const CATEGORY_TABS = [
  { label: 'All Topics', value: 'ALL', icon: LayoutGrid },
  { label: 'Technology', value: 'technology', icon: Laptop },
  { label: 'Movies', value: 'movies', icon: Film },
  { label: 'Food & Cooking', value: 'food_cooking', icon: Utensils },
  { label: 'Fashion & Style', value: 'fashion_style', icon: Shirt },
  { label: 'Science', value: 'science', icon: Atom },
  { label: 'Music', value: 'music', icon: Music },
  { label: 'Books', value: 'books', icon: BookOpen },
  { label: 'Business', value: 'business', icon: Briefcase },
  { label: 'Psychology', value: 'psychology', icon: Brain },
  { label: 'History', value: 'history', icon: Scroll },
  { label: 'Health', value: 'health', icon: HeartPulse },
  { label: 'General', value: 'General', icon: HelpCircle },
];

function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-surface-raised"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-zinc-100 dark:bg-white/10" />
            <div className="space-y-2">
              <div className="h-3 w-24 rounded bg-zinc-100 dark:bg-white/10" />
              <div className="h-2.5 w-16 rounded bg-zinc-100 dark:bg-white/10" />
            </div>
          </div>
          <div className="mt-4 h-4 w-2/3 rounded bg-zinc-100 dark:bg-white/10" />
          <div className="mt-2 h-3 w-full rounded bg-zinc-100 dark:bg-white/10" />
          <div className="mt-1.5 h-3 w-5/6 rounded bg-zinc-100 dark:bg-white/10" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onCreatePost }: { onCreatePost: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border-dashed border-2 border-zinc-300 dark:border-zinc-800 py-20 px-6 text-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-50/50 via-transparent to-transparent dark:from-rose-950/10 transition-all duration-200">
      <Inbox className="h-9 w-9 text-zinc-300 dark:text-zinc-600" />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No posts found</p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Be the first to create a post and start a discussion!
        </p>
      </div>
      <button
        type="button"
        onClick={onCreatePost}
        className="mt-2 inline-flex items-center justify-center font-bold px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 text-xs"
      >
        Create New Post
      </button>
    </div>
  );
}

interface HomeFeedPageProps {
  onViewComments: (postId: string) => void;
  onRequestChat: (postId: string, preview: string) => void;
}

export default function HomeFeedPage({ onViewComments, onRequestChat }: HomeFeedPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawCategory = searchParams.get('category') || 'ALL';
  const [selectedCategory, setSelectedCategory] = useState<string>(rawCategory);

  // Synchronize state when URL searchParams change
  useEffect(() => {
    setSelectedCategory(rawCategory);
  }, [rawCategory]);

  const searchQuery = searchParams.get('search') || '';
  const navigate = useNavigate();
  
  const [sortBy, setSortBy] = useState<'latest' | 'trending' | 'top-voted' | 'unanswered'>('latest');

  useEffect(() => {
    console.log(`[HomeFeedPage] Selected category changed to: ${selectedCategory}`);
  }, [selectedCategory]);

  const location = useLocation();

  // Custom hook usage with selectedCategory and sortBy
  const { posts, isLoading, error, mutate } = usePosts(selectedCategory, sortBy);
  const [localPosts, setLocalPosts] = useState<any[]>([]);

  // Reset local dynamic posts when selectedCategory changes to avoid showing previous category items
  useEffect(() => {
    setLocalPosts([]);
  }, [selectedCategory]);

  // Synchronize hook posts into local state
  useEffect(() => {
    if (posts) {
      setLocalPosts(posts);
    }
  }, [posts]);

  // Handle new post directly passed via navigation state
  useEffect(() => {
    const navState = location.state as { newPost?: any } | null;
    if (navState?.newPost && navState.newPost._id) {
      const newPost = navState.newPost;
      // Only prepend if it matches the current category or if viewing ALL
      const matchesCategory =
        selectedCategory.toUpperCase() === 'ALL' ||
        newPost.category?.toLowerCase() === selectedCategory.toLowerCase().trim();

      if (matchesCategory) {
        setLocalPosts((prev) => {
          if (prev.some((p) => p._id === newPost._id)) return prev;
          return [newPost, ...prev];
        });
      }
      // Clear navigation state so browser refresh doesn't duplicate
      navigate(location.pathname + location.search, { replace: true, state: {} });
      // Trigger feed re-fetch
      mutate();
    }
  }, [location.state, navigate, location.pathname, location.search, mutate, selectedCategory]);

  // Listen for global feed events
  useEffect(() => {
    const handleNewPost = (e: any) => {
      const newPost = e.detail;
      if (newPost && newPost._id) {
        const matchesCategory =
          selectedCategory.toUpperCase() === 'ALL' ||
          newPost.category?.toLowerCase() === selectedCategory.toLowerCase().trim();

        if (matchesCategory) {
          setLocalPosts((prev) => {
            if (prev.some((p) => p._id === newPost._id)) return prev;
            return [newPost, ...prev];
          });
        }
        mutate();
      }
    };

    const handleInvalidate = () => {
      mutate();
    };

    window.addEventListener('feed:new-post', handleNewPost);
    window.addEventListener('feed:invalidate', handleInvalidate);
    return () => {
      window.removeEventListener('feed:new-post', handleNewPost);
      window.removeEventListener('feed:invalidate', handleInvalidate);
    };
  }, [mutate, selectedCategory]);

  // Client-side filtering & sorting using local dynamic posts
  const activePostsList = localPosts.length > 0 ? localPosts : posts || [];
  const filteredPosts = activePostsList.filter((post) => {
    // 1. Strict category matching
    if (
      selectedCategory.toUpperCase() !== 'ALL' &&
      post.category?.toLowerCase() !== selectedCategory.toLowerCase().trim()
    ) {
      return false;
    }

    // 2. Search query matching
    if (!searchQuery) return true;
    const titleMatch = post.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const contentMatch = post.content?.text?.toLowerCase().includes(searchQuery.toLowerCase());
    const authorMatch = post.author?.username?.toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || contentMatch || authorMatch;
  });

  let processedPosts = [...filteredPosts];
  if (sortBy === 'latest') {
    processedPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (sortBy === 'trending') {
    processedPosts.sort((a, b) => {
      const scoreA = (a.commentCount || 0) + (a.voteScore || 0);
      const scoreB = (b.commentCount || 0) + (b.voteScore || 0);
      return scoreB - scoreA;
    });
  } else if (sortBy === 'top-voted') {
    processedPosts.sort((a, b) => (b.voteScore || 0) - (a.voteScore || 0));
  } else if (sortBy === 'unanswered') {
    processedPosts = processedPosts.filter((post) => (post.commentCount || 0) === 0);
    processedPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-12 items-start w-full">
      {/* Left Sidebar Navigation: Hidden on Mobile (<768px), visible on Tablet (md:col-span-4) & Desktop (lg:col-span-3) */}
      <aside className="hidden md:block md:col-span-4 lg:col-span-3 space-y-2 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <h2 className="px-3 text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Categories
        </h2>
        <nav className="space-y-1">
          {CATEGORY_TABS.map((tab) => {
            const isActive = selectedCategory.toLowerCase() === tab.value.toLowerCase();
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setSelectedCategory(tab.value);
                  if (tab.value === 'ALL') {
                    const searchVal = searchParams.get('search');
                    setSearchParams(searchVal ? { search: searchVal } : {});
                  } else {
                    const searchVal = searchParams.get('search');
                    setSearchParams(searchVal ? { category: tab.value, search: searchVal } : { category: tab.value });
                  }
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-bold transition-all duration-150',
                  isActive
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/10 dark:bg-rose-500'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/5'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Feed area: 100% width on Mobile, 8 cols on Tablet, 6 cols on Desktop */}
      <section className="col-span-1 md:col-span-8 lg:col-span-9 xl:col-span-6 w-full space-y-4">
        {/* Sort/Filter tabs */}
        <div className="flex border-b border-zinc-200 dark:border-white/10 pb-0.5 mb-6 gap-6 overflow-x-auto scrollbar-none">
          {(['latest', 'trending', 'top-voted', 'unanswered'] as const).map((tab) => {
            const isActive = sortBy === tab;
            const labels = {
              latest: 'Latest',
              trending: 'Trending',
              'top-voted': 'Top Voted',
              unanswered: 'Unanswered',
            };
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setSortBy(tab)}
                className={cn(
                  'pb-2.5 px-0.5 text-sm font-semibold transition-all duration-200 border-b-2 -mb-[2px] outline-none whitespace-nowrap',
                  isActive
                    ? 'border-rose-600 text-rose-600 dark:border-rose-500 dark:text-white font-bold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300'
                )}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {isLoading && <FeedSkeleton />}

        {!isLoading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}

        {!isLoading && !error && processedPosts.length === 0 && (
          <EmptyState onCreatePost={() => navigate('/create')} />
        )}

        {!isLoading && !error && processedPosts.length > 0 && (
          <div className="space-y-4">
            {processedPosts.map((post) => (
              <FeedPost
                key={post._id}
                post={post}
                onViewComments={onViewComments}
                onRequestChat={onRequestChat}
                onDeleteSuccess={mutate}
              />
            ))}
          </div>
        )}
      </section>

      {/* Right Sidebar (Engagement Zone): Hidden on Mobile & Tablet (<1280px), visible on Desktop (xl: 1280px+) */}
      <aside className="hidden xl:block xl:col-span-3 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <RightSidebar />
      </aside>
    </div>
  );
}
