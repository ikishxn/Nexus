import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  FileText,
  Globe,
  User as UserIcon,
  ArrowRight,
  Loader2,
  Hash,
  CornerDownLeft,
} from 'lucide-react';
import api from '../lib/api';
import { cn } from '../lib/cn';
import { useDebounce } from '../hooks/useDebounce';

interface SearchPost {
  _id: string;
  title: string;
  category: string;
  voteScore: number;
  commentCount: number;
  author?: {
    _id?: string;
    username?: string;
    reputationScore?: number;
  };
}

interface SearchRealm {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  themeColor: string;
  memberCount: number;
}

interface SearchUser {
  _id: string;
  username: string;
  reputationScore: number;
  badges?: string[];
}

interface SearchResults {
  posts: SearchPost[];
  realms: SearchRealm[];
  users: SearchUser[];
}

type ResultItem =
  | { type: 'realm'; data: SearchRealm; route: string; label: string; sub: string }
  | { type: 'post'; data: SearchPost; route: string; label: string; sub: string }
  | { type: 'user'; data: SearchUser; route: string; label: string; sub: string };

const REALM_THEME_COLORS: Record<string, string> = {
  rose: 'bg-rose-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  indigo: 'bg-indigo-500',
  violet: 'bg-violet-500',
  sky: 'bg-sky-500',
};

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({ posts: [], realms: [], users: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const debouncedQuery = useDebounce(query, 300);

  // Focus input automatically whenever opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults({ posts: [], realms: [], users: [] });
      setSelectedIndex(0);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Execute debounced search against /search?q=
  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (!trimmed) {
      setResults({ posts: [], realms: [], users: [] });
      setIsLoading(false);
      return;
    }

    let isSubscribed = true;
    setIsLoading(true);

    api
      .get<SearchResults>('/search', { params: { q: trimmed } })
      .then((res) => {
        if (isSubscribed) {
          setResults({
            posts: res.data?.posts || [],
            realms: res.data?.realms || [],
            users: res.data?.users || [],
          });
          setSelectedIndex(0);
        }
      })
      .catch((err) => {
        console.error('CommandPalette search error:', err);
        if (isSubscribed) {
          setResults({ posts: [], realms: [], users: [] });
        }
      })
      .finally(() => {
        if (isSubscribed) {
          setIsLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [debouncedQuery]);

  // Flatten items for linear index keyboard navigation
  const flatItems: ResultItem[] = useMemo(() => {
    const items: ResultItem[] = [];

    results.realms.forEach((r) => {
      items.push({
        type: 'realm',
        data: r,
        route: `/n/${r.name}`,
        label: r.displayName || r.name,
        sub: `n/${r.name} · ${r.memberCount || 1} members`,
      });
    });

    results.posts.forEach((p) => {
      items.push({
        type: 'post',
        data: p,
        route: `/post/${p._id}`,
        label: p.title,
        sub: `by ${p.author?.username || 'anonymous'} · ${p.voteScore || 0} votes · ${p.commentCount || 0} comments`,
      });
    });

    results.users.forEach((u) => {
      items.push({
        type: 'user',
        data: u,
        route: `/profile/${u._id}`,
        label: u.username,
        sub: `${(u.reputationScore || 0).toLocaleString()} reputation`,
      });
    });

    return items;
  }, [results]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-selected="true"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleSelect = useCallback(
    (item: ResultItem) => {
      onClose();
      navigate(item.route);
    },
    [navigate, onClose]
  );

  // Key navigation handler inside modal
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (flatItems.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % flatItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = flatItems[selectedIndex];
        if (selected) {
          handleSelect(selected);
        }
      }
    },
    [flatItems, selectedIndex, handleSelect, onClose]
  );

  if (!isOpen) return null;

  const totalResultsCount = flatItems.length;
  const hasSearched = debouncedQuery.trim().length > 0;
  let runningIndex = 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col"
        onKeyDown={handleKeyDown}
      >
        {/* Top Search Input Box - Raycast / Linear Fluid Style */}
        <div className="flex items-center gap-3.5 p-4 sm:p-5 border-b border-zinc-800/50 bg-transparent">
          {isLoading ? (
            <Loader2 className="h-6 w-6 shrink-0 animate-spin text-rose-500" />
          ) : (
            <Search className="h-6 w-6 shrink-0 text-zinc-500" strokeWidth={2} />
          )}

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Nexus..."
            className="flex-1 bg-transparent text-xl sm:text-2xl font-normal text-zinc-100 placeholder:text-zinc-500 border-none outline-none focus:outline-none focus:ring-0"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />

          <div className="flex items-center gap-2 shrink-0">
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors cursor-pointer"
                title="Clear query"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] font-mono font-medium text-zinc-400 select-none">
              ESC
            </kbd>
          </div>
        </div>

        {/* Results Container */}
        <div
          ref={listRef}
          className="max-h-[60vh] overflow-y-auto overscroll-contain p-3 space-y-4 themed-scrollbar"
        >
          {/* Initial Blank State - Highly Muted & Minimal */}
          {!hasSearched && (
            <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
              <Search className="h-7 w-7 text-zinc-600 mb-3" strokeWidth={1.75} />
              <p className="text-sm text-zinc-500">
                Type to search realms, discussions, and creators.
              </p>
            </div>
          )}

          {/* Empty Search State */}
          {hasSearched && !isLoading && totalResultsCount === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Hash className="h-7 w-7 text-zinc-600 mb-2.5" strokeWidth={1.75} />
              <p className="text-sm font-medium text-zinc-400">No results found for &ldquo;{debouncedQuery}&rdquo;</p>
              <p className="text-xs text-zinc-500 mt-1">
                Try searching realms, discussions, and creators with alternate keywords.
              </p>
            </div>
          )}

          {/* Realms Section */}
          {results.realms.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <Globe className="h-3.5 w-3.5 text-zinc-500" />
                <span>Realms</span>
                <span className="ml-auto text-[10px] font-normal text-zinc-600">
                  {results.realms.length}
                </span>
              </div>
              <div className="space-y-1 mt-1.5">
                {results.realms.map((realm) => {
                  const currentIndex = runningIndex++;
                  const isSelected = selectedIndex === currentIndex;
                  const themeDotClass = REALM_THEME_COLORS[realm.themeColor] || 'bg-rose-500';

                  return (
                    <div
                      key={realm._id}
                      data-selected={isSelected}
                      onClick={() =>
                        handleSelect({
                          type: 'realm',
                          data: realm,
                          route: `/n/${realm.name}`,
                          label: realm.displayName,
                          sub: `n/${realm.name}`,
                        })
                      }
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      className={cn(
                        'group relative flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg cursor-pointer transition-colors duration-150',
                        isSelected
                          ? 'bg-zinc-800/50 text-zinc-100'
                          : 'hover:bg-zinc-800/30 text-zinc-400'
                      )}
                    >
                      {isSelected && (
                        <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-rose-500" />
                      )}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            'h-7 w-7 shrink-0 rounded-md flex items-center justify-center shadow-sm',
                            themeDotClass
                          )}
                        >
                          <Globe className="h-3.5 w-3.5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className={cn(
                            'text-sm font-medium truncate transition-colors',
                            isSelected ? 'text-zinc-100' : 'text-zinc-300 group-hover:text-zinc-200'
                          )}>
                            {realm.displayName || realm.name}
                          </p>
                          <p className="text-[11px] text-zinc-500 truncate">
                            n/{realm.name} · {(realm.memberCount || 1).toLocaleString()} members
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isSelected && (
                          <span className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-400 font-normal animate-in fade-in">
                            Jump to Realm <CornerDownLeft className="h-3 w-3 text-rose-500" />
                          </span>
                        )}
                        <ArrowRight
                          className={cn(
                            'h-4 w-4 transition-transform',
                            isSelected ? 'text-rose-500 translate-x-0.5' : 'text-zinc-600'
                          )}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Discussions (Posts) Section */}
          {results.posts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <FileText className="h-3.5 w-3.5 text-zinc-500" />
                <span>Discussions</span>
                <span className="ml-auto text-[10px] font-normal text-zinc-600">
                  {results.posts.length}
                </span>
              </div>
              <div className="space-y-1 mt-1.5">
                {results.posts.map((post) => {
                  const currentIndex = runningIndex++;
                  const isSelected = selectedIndex === currentIndex;

                  return (
                    <div
                      key={post._id}
                      data-selected={isSelected}
                      onClick={() =>
                        handleSelect({
                          type: 'post',
                          data: post,
                          route: `/post/${post._id}`,
                          label: post.title,
                          sub: `by ${post.author?.username || 'anonymous'}`,
                        })
                      }
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      className={cn(
                        'group relative flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg cursor-pointer transition-colors duration-150',
                        isSelected
                          ? 'bg-zinc-800/50 text-zinc-100'
                          : 'hover:bg-zinc-800/30 text-zinc-400'
                      )}
                    >
                      {isSelected && (
                        <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-rose-500" />
                      )}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            'h-7 w-7 shrink-0 rounded-md bg-zinc-900 border border-zinc-800/80 flex items-center justify-center transition-colors',
                            isSelected ? 'text-rose-500 border-rose-500/20' : 'text-zinc-500'
                          )}
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className={cn(
                            'text-sm font-medium truncate transition-colors',
                            isSelected ? 'text-zinc-100' : 'text-zinc-300 group-hover:text-zinc-200'
                          )}>
                            {post.title}
                          </p>
                          <p className="text-[11px] text-zinc-500 truncate">
                            by {post.author?.username || 'anonymous'} · {post.voteScore || 0} votes ·{' '}
                            {post.commentCount || 0} comments
                            {post.category ? ` · ${post.category}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isSelected && (
                          <span className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-400 font-normal animate-in fade-in">
                            View Discussion <CornerDownLeft className="h-3 w-3 text-rose-500" />
                          </span>
                        )}
                        <ArrowRight
                          className={cn(
                            'h-4 w-4 transition-transform',
                            isSelected ? 'text-rose-500 translate-x-0.5' : 'text-zinc-600'
                          )}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Users Section */}
          {results.users.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <UserIcon className="h-3.5 w-3.5 text-zinc-500" />
                <span>Creators</span>
                <span className="ml-auto text-[10px] font-normal text-zinc-600">
                  {results.users.length}
                </span>
              </div>
              <div className="space-y-1 mt-1.5">
                {results.users.map((u) => {
                  const currentIndex = runningIndex++;
                  const isSelected = selectedIndex === currentIndex;

                  return (
                    <div
                      key={u._id}
                      data-selected={isSelected}
                      onClick={() =>
                        handleSelect({
                          type: 'user',
                          data: u,
                          route: `/profile/${u._id}`,
                          label: u.username,
                          sub: `${u.reputationScore} reputation`,
                        })
                      }
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      className={cn(
                        'group relative flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg cursor-pointer transition-colors duration-150',
                        isSelected
                          ? 'bg-zinc-800/50 text-zinc-100'
                          : 'hover:bg-zinc-800/30 text-zinc-400'
                      )}
                    >
                      {isSelected && (
                        <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-rose-500" />
                      )}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-tr from-rose-600 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-white/10 select-none">
                          {u.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className={cn(
                            'text-sm font-medium truncate transition-colors',
                            isSelected ? 'text-zinc-100' : 'text-zinc-300 group-hover:text-zinc-200'
                          )}>
                            {u.username}
                          </p>
                          <p className="text-[11px] text-zinc-500 truncate">
                            {(u.reputationScore || 0).toLocaleString()} reputation
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isSelected && (
                          <span className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-400 font-normal animate-in fade-in">
                            View Profile <CornerDownLeft className="h-3 w-3 text-rose-500" />
                          </span>
                        )}
                        <ArrowRight
                          className={cn(
                            'h-4 w-4 transition-transform',
                            isSelected ? 'text-rose-500 translate-x-0.5' : 'text-zinc-600'
                          )}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="flex items-center justify-between border-t border-zinc-800/50 bg-zinc-950 px-4 py-2.5 text-[11px] text-zinc-500">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
                ↑
              </kbd>
              <kbd className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
                ↓
              </kbd>
              <span>to navigate</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
                ↵
              </kbd>
              <span>to select</span>
            </span>
          </div>
          <span className="inline-flex items-center gap-1">
            <kbd className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
              ESC
            </kbd>
            <span>to close</span>
          </span>
        </div>
      </div>
    </div>
  );
}
