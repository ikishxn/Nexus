import { ReactNode, useEffect, useState, useRef } from 'react';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Network,
  Moon,
  Sun,
  Github,
  Twitter,
  Coins,
  Search,
  Sparkles,
  Menu,
  X,
  Home,
  LayoutGrid,
  Plus,
  User,
  TrendingUp,
  Laptop,
  Film,
  Utensils,
  Shirt,
  Atom,
  Music,
  BookOpen,
  Briefcase,
  Brain,
  Scroll,
  HeartPulse,
  HelpCircle,
  Bell,
  Flame,
  MessageSquare,
  Target,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications, NotificationItem, NotificationType } from '../context/NotificationContext';
import { cn } from '../lib/cn';
import { Button } from './UIComponents';
import { useTheme, ThemeMode } from '../context/ThemeContext';

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
  { label: 'General', value: 'general', icon: HelpCircle },
];

const TRENDING_TAGS = [
  { tag: '#Technology', category: 'technology' },
  { tag: '#AI', category: 'science' },
  { tag: '#Startups', category: 'business' },
  { tag: '#Design', category: 'fashion_style' },
  { tag: '#NextJS', category: 'technology' },
  { tag: '#WebDev', category: 'technology' },
];

const NAV_LINKS = [
  { label: 'Feed', to: '/' },
  { label: 'Technology', to: '/?category=technology' },
  { label: 'Science', to: '/?category=science' },
  { label: 'Business', to: '/?category=business' },
  { label: 'General', to: '/?category=general' },
] as const;

function ThemeToggle() {
  const { themeMode, setThemeMode } = useTheme();

  const options: { mode: ThemeMode; label: string; icon: any }[] = [
    { mode: 'light', label: 'Light Theme', icon: Sun },
    { mode: 'dark', label: 'Dark Theme', icon: Moon },
    { mode: 'contextual', label: 'Contextual Dual-Theme', icon: Sparkles },
  ];

  return (
    <div className="flex items-center gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-white/5 transition-all duration-300">
      {options.map((opt) => {
        const isActive = themeMode === opt.mode;
        const Icon = opt.icon;
        return (
          <button
            key={opt.mode}
            type="button"
            onClick={() => setThemeMode(opt.mode)}
            title={opt.label}
            aria-label={opt.label}
            aria-pressed={isActive}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-350 ease-in-out',
              isActive
                ? 'bg-white text-rose-600 shadow-sm dark:bg-white/10 dark:text-rose-400 scale-105'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:scale-102'
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}

function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.read) {
      await markAsRead(notif._id);
    }
    setIsOpen(false);
    const targetPostId =
      typeof notif.postId === 'object' && notif.postId !== null ? notif.postId._id : notif.postId;
    if (targetPostId) {
      navigate(`/posts/${targetPostId}`);
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const now = new Date();
      const past = new Date(dateStr);
      const diffMs = now.getTime() - past.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return past.toLocaleDateString();
    } catch {
      return '';
    }
  };

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case 'UPVOTE':
        return <Flame className="h-4 w-4 text-rose-500" />;
      case 'REPLY':
        return <MessageSquare className="h-4 w-4 text-sky-500" />;
      case 'BOUNTY_CLAIMED':
        return <Coins className="h-4 w-4 text-amber-500" />;
      case 'DEBATE_CHALLENGE':
        return <Sparkles className="h-4 w-4 text-purple-500" />;
      case 'TARGETED_BOUNTY':
        return <Target className="h-4 w-4 text-rose-500 animate-pulse" />;
      default:
        return <Bell className="h-4 w-4 text-rose-500" />;
    }
  };

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 shadow-sm transition-all hover:bg-zinc-100 hover:text-zinc-900 dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white cursor-pointer"
        aria-label="Notifications"
        title={hasUnread ? `Notifications (${unreadCount} unread)` : 'Notifications'}
      >
        <Bell className="h-4 w-4" />
        {notifications.some((n) => !n.read) && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-zinc-900 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-zinc-200/80 bg-white/95 p-0 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/95 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800/80">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsRead()}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition-colors cursor-pointer"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800/50 mb-3 text-zinc-400">
                  <Bell className="h-6 w-6 opacity-60" />
                </div>
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No notifications yet</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  When you receive upvotes, replies, or bounties, they'll show up here.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const senderName = notif.senderId?.username || 'Someone';
                return (
                  <div
                    key={notif._id}
                    onClick={() => handleNotificationClick(notif)}
                    className={cn(
                      'flex items-start gap-3 p-3.5 transition-colors cursor-pointer text-left',
                      !notif.read
                        ? 'bg-rose-500/5 hover:bg-rose-500/10 dark:bg-rose-500/10 dark:hover:bg-rose-500/15'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40',
                    )}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                      {getIconForType(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-snug">
                        <span className="font-bold text-zinc-900 dark:text-white mr-1">
                          {senderName}
                        </span>
                        {notif.message || `${notif.type.toLowerCase().replace('_', ' ')} on your post`}
                      </p>
                      <span className="mt-1 block text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>
                    {!notif.read && (
                      <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-rose-500 shadow-sm" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 shrink-0">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 dark:bg-rose-500 shadow-md shadow-rose-600/20">
        <Network className="h-[18px] w-[18px] text-white" strokeWidth={2.25} />
      </span>
      <span className="text-[15px] font-bold tracking-tight text-zinc-900 dark:text-white">
        Nexus
      </span>
    </Link>
  );
}

interface HeaderProps {
  currentUser?: any;
  onSignInClick?: () => void;
  onSignOutClick?: () => void;
  onNewPostClick: () => void;
  onToggleMobileNav: () => void;
  onOpenSearch?: () => void;
}

function Header({ 
  onNewPostClick,
  onToggleMobileNav,
  onOpenSearch,
}: HeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-md',
        'dark:border-white/10 dark:bg-surface/80',
        'transition-colors duration-500 ease-in-out',
        'w-full max-w-[100vw] box-border overflow-hidden',
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4 w-full max-w-[100vw] box-border">
        <div className="flex items-center gap-2 md:gap-6 shrink-0 min-w-0">
          {/* Mobile Hamburger Menu Toggle */}
          <button
            type="button"
            onClick={onToggleMobileNav}
            aria-label="Open navigation menu"
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:text-rose-500 hover:border-rose-500/30 transition-colors cursor-pointer shrink-0"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Logo />
          <nav className="hidden lg:flex items-center gap-1 shrink-0">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-bold text-zinc-600',
                  'hover:bg-zinc-100 hover:text-zinc-900',
                  'dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white',
                  'transition-colors duration-500 ease-in-out',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Global Wide Search Bar - Command Palette Trigger */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex-1 min-w-0 max-w-md mx-2 sm:mx-4 relative hidden sm:flex items-center gap-2.5 rounded-full border border-zinc-200 bg-zinc-100/80 hover:bg-zinc-200/60 dark:border-zinc-800 dark:bg-zinc-900/90 dark:hover:bg-zinc-800/90 py-1.5 pl-3.5 pr-2.5 text-sm text-zinc-500 dark:text-zinc-400 hover:border-rose-500/40 dark:hover:border-rose-500/40 transition-all duration-200 shadow-inner group cursor-pointer shrink"
        >
          <Search className="h-4 w-4 text-zinc-400 group-hover:text-rose-500 transition-colors shrink-0" />
          <span className="flex-1 text-left text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors truncate">
            Search posts, realms, creators...
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <kbd className="bg-white/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 select-none group-hover:border-rose-500/30 group-hover:text-rose-500 transition-colors shadow-sm">
              ⌘ K
            </kbd>
          </div>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3 flex-shrink min-w-0">
          <div className="flex-shrink-0">
            <ThemeToggle />
          </div>
          {isAuthenticated && user && (
            <div className="flex-shrink-0">
              <NotificationBell />
            </div>
          )}
          <div className="hidden xs:block mx-0.5 sm:mx-1 h-5 w-px bg-zinc-200 dark:bg-white/10 flex-shrink-0" />
          
          {isAuthenticated && user ? (
            <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3 flex-shrink min-w-0">
              <Link
                to="/wallet"
                title={`Live Balance: ${user.walletBalance ?? 0} cr (Click to manage Wallet)`}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100/80 px-2.5 sm:px-3 py-1 text-xs font-bold text-zinc-800 shadow-sm transition-all hover:scale-105 hover:border-rose-400/50 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-200 dark:hover:border-rose-500/30 cursor-pointer flex-shrink-0"
              >
                <Coins className="h-3.5 w-3.5 text-amber-500 animate-pulse flex-shrink-0" />
                <span>{user.walletBalance ?? 0}</span>
                <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">cr</span>
              </Link>
              
              <Link
                to="/profile"
                title={`${user.username} - View Profile`}
                className="flex items-center gap-1.5 sm:gap-2 hover:opacity-85 transition-opacity cursor-pointer flex-shrink min-w-0"
              >
                <div className="hidden lg:block text-right leading-tight max-w-[100px] truncate">
                  <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{user.username}</p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
                    {user.totalReputation ?? user.reputationScore} rep
                  </p>
                </div>
   
                <div 
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-rose-500 to-purple-600 text-xs font-bold text-white shadow-sm ring-2 ring-white/10 select-none"
                >
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
              </Link>

              <div className="flex-shrink-0">
                <Button variant="ghost" size="sm" onClick={() => { logout(); navigate('/auth'); }} className="whitespace-nowrap px-2 sm:px-3">
                  Sign out
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-shrink-0">
              <Button variant="ghost" size="sm" onClick={() => navigate('/auth')} className="whitespace-nowrap px-2 sm:px-3">
                Sign in
              </Button>
            </div>
          )}

          <div className="flex-shrink-0">
            <Button variant="primary" size="sm" onClick={onNewPostClick} className="whitespace-nowrap px-2.5 sm:px-3">
              New post
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white dark:border-white/10 dark:bg-surface">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2">
            <Logo />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              Ship your work, then let other developers review it. Honest feedback on code, UI, and
              everything in between.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="#"
                aria-label="GitHub"
                className="text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-white"
              >
                <Github className="h-[18px] w-[18px]" />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-white"
              >
                <Twitter className="h-[18px] w-[18px]" />
              </a>
            </div>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                {column.title}
              </h4>
              <ul className="mt-3 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-zinc-600 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-white"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
 
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-zinc-100 pt-6 dark:border-white/10 sm:flex-row">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            © {new Date().getFullYear()} Nexus. All rights reserved.
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Built for developers, by developers.</p>
        </div>
      </div>
    </footer>
  );
}

const FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: ['Feed', 'Categories', 'Leaderboard', 'Changelog'],
  },
  {
    title: 'Community',
    links: ['Guidelines', 'Reputation', 'Moderation'],
  },
  {
    title: 'Company',
    links: ['About', 'Careers', 'Contact'],
  },
] as const;

function MobileDrawer({
  isOpen,
  onClose,
  onNewPostClick,
  onOpenSearch,
}: {
  isOpen: boolean;
  onClose: () => void;
  onNewPostClick: () => void;
  onOpenSearch?: () => void;
}) {
  const [searchParams] = useSearchParams();
  const rawCat = searchParams.get('category') || 'ALL';
  const activeCategory = rawCat.toUpperCase() === 'ALL' ? 'ALL' : rawCat.toLowerCase();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-out Sheet */}
      <div className="fixed inset-y-0 left-0 z-50 w-full max-w-xs bg-white dark:bg-zinc-950 p-5 shadow-2xl border-r border-zinc-200 dark:border-zinc-800 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-250">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <Logo />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Search - Command Palette Trigger */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSearch?.();
            }}
            className="w-full flex items-center justify-between gap-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 py-2.5 px-3.5 text-xs text-zinc-400 dark:text-zinc-500 hover:border-rose-500/40 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors text-left group"
          >
            <div className="flex items-center gap-2.5 truncate">
              <Search className="h-4 w-4 text-zinc-400 group-hover:text-rose-500 transition-colors shrink-0" />
              <span className="truncate">Search posts, realms...</span>
            </div>
            <kbd className="bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 shrink-0">
              ⌘K
            </kbd>
          </button>

          {/* Categories */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-1">
              Categories
            </h3>
            <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
              {CATEGORY_TABS.map((tab) => {
                const isActive = activeCategory === tab.value;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => {
                      if (tab.value === 'ALL') {
                        navigate('/');
                      } else {
                        navigate(`/?category=${tab.value}`);
                      }
                      onClose();
                    }}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold transition-all text-left',
                      isActive
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Trending Topics */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-1 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-rose-500" />
              Trending Topics
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {TRENDING_TAGS.map((topic) => (
                <button
                  key={topic.tag}
                  type="button"
                  onClick={() => {
                    navigate(`/?category=${topic.category}`);
                    onClose();
                  }}
                  className="cursor-pointer inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  {topic.tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3 mt-4">
          {isAuthenticated && user ? (
            <div className="flex items-center justify-between px-1">
              <Link
                to="/wallet"
                onClick={onClose}
                className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:text-rose-500"
              >
                <Coins className="h-4 w-4 text-amber-500" />
                <span>{user.walletBalance ?? 0} cr</span>
              </Link>
              <Link
                to="/profile"
                onClick={onClose}
                className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:text-rose-500"
              >
                <span>Profile</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/auth');
                  onClose();
                }}
                className="text-xs text-zinc-400 hover:text-rose-500"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              className="w-full justify-center"
              onClick={() => {
                navigate('/auth');
                onClose();
              }}
            >
              Sign In
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            className="w-full justify-center"
            onClick={() => {
              onClose();
              onNewPostClick();
            }}
          >
            New Post
          </Button>
        </div>
      </div>
    </div>
  );
}

function MobileBottomNav({
  onOpenMenu,
  onNewPostClick,
}: {
  onOpenMenu: () => void;
  onNewPostClick: () => void;
}) {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md px-4 py-2 flex items-center justify-around shadow-lg">
      <Link
        to="/"
        className={cn(
          'flex flex-col items-center gap-0.5 text-[10px] font-bold transition-colors',
          location.pathname === '/' ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-500 dark:text-zinc-400'
        )}
      >
        <Home className="h-5 w-5" />
        <span>Feed</span>
      </Link>

      <button
        type="button"
        onClick={onOpenMenu}
        className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 hover:text-rose-500 transition-colors"
      >
        <LayoutGrid className="h-5 w-5" />
        <span>Topics</span>
      </button>

      <button
        type="button"
        onClick={onNewPostClick}
        aria-label="Create new post"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-600 text-white shadow-md shadow-rose-600/30 hover:bg-rose-500 transition-transform active:scale-95 -mt-3 ring-4 ring-white dark:ring-zinc-950"
      >
        <Plus className="h-5 w-5" />
      </button>

      <Link
        to="/wallet"
        className={cn(
          'flex flex-col items-center gap-0.5 text-[10px] font-bold transition-colors',
          location.pathname === '/wallet' ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-500 dark:text-zinc-400'
        )}
      >
        <Coins className="h-5 w-5 text-amber-500" />
        <span>Wallet</span>
      </Link>

      <Link
        to="/profile"
        className={cn(
          'flex flex-col items-center gap-0.5 text-[10px] font-bold transition-colors',
          location.pathname.startsWith('/profile') ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-500 dark:text-zinc-400'
        )}
      >
        <User className="h-5 w-5" />
        <span>{user?.username ? user.username.slice(0, 5) : 'Profile'}</span>
      </Link>
    </nav>
  );
}

interface LayoutProps {
  children: ReactNode;
  currentUser?: any;
  onSignInClick?: () => void;
  onSignOutClick?: () => void;
  onNewPostClick: () => void;
  onOpenSearch?: () => void;
}

export default function Layout({ 
  children, 
  currentUser, 
  onSignInClick, 
  onSignOutClick, 
  onNewPostClick,
  onOpenSearch,
}: LayoutProps) {
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category');
  const { setPostCategory } = useTheme();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    setPostCategory(category);
  }, [category, setPostCategory]);

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-surface transition-colors duration-500 ease-in-out w-full max-w-[100vw] overflow-x-hidden box-border">
      <Header 
        currentUser={currentUser}
        onSignInClick={onSignInClick}
        onSignOutClick={onSignOutClick}
        onNewPostClick={onNewPostClick}
        onToggleMobileNav={() => setIsMobileNavOpen(true)}
        onOpenSearch={onOpenSearch}
      />
      <main className="container mx-auto flex-1 px-4 py-8 pb-24 md:pb-8">{children}</main>
      <Footer />

      {/* Mobile Navigation Drawer */}
      <MobileDrawer
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        onNewPostClick={onNewPostClick}
        onOpenSearch={onOpenSearch}
      />

      {/* Fixed Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        onOpenMenu={() => setIsMobileNavOpen(true)}
        onNewPostClick={onNewPostClick}
      />
    </div>
  );
}
