import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Layout from './components/Layout';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import HomeFeedPage from './components/HomeFeedPage';
import CreatePostPage from './components/CreatePostPage';
import PostDetailPage from './components/PostDetailPage';
import ChatDrawer from './components/ChatDrawer';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ChatContext } from './types';
import AdminLayout from './components/AdminLayout';
import WalletDashboard from './components/WalletDashboard';
import UserProfilePage from './components/UserProfilePage';
import RealmPage from './components/RealmPage';
import CommandPalette from './components/CommandPalette';

function PostDetailWrapper({ onBack }: { onBack: () => void }) {
  const { id } = useParams<{ id: string }>();
  return <PostDetailPage postId={id || ''} onBack={onBack} />;
}

function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || user?.role !== 'ADMIN') {
        navigate('/');
      }
    }
  }, [user, isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-rose-500 border-t-transparent" />
      </div>
    );
  }

  return isAuthenticated && user?.role === 'ADMIN' ? <>{children}</> : null;
}

function AppContent() {
  const { resolvedTheme, setThemeMode } = useTheme();
  const landingTheme = resolvedTheme === 'dark' ? 'dark' : 'light';
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  const [chatContext, setChatContext] = useState<ChatContext | null>(null);
  const [feedKey, setFeedKey] = useState(0);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global ⌘K / Ctrl+K listener for Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNewPostClick = () => {
    if (!isAuthenticated) {
      navigate('/auth');
    } else {
      navigate('/create');
    }
  };

  const socketUserId = user?.id || user?._id || 'guest';
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (isAdminRoute) {
    return (
      <Routes>
        <Route 
          path="/admin/*"
          element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }
        />
      </Routes>
    );
  }

  return (
    <Layout 
      onNewPostClick={handleNewPostClick}
      onOpenSearch={() => setIsCommandPaletteOpen(true)}
    >
      <div className="min-h-[70vh]">
        <Routes>
          <Route 
            path="/auth"
            element={<AuthPage />}
          />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <HomeFeedPage
                  key={feedKey}
                  onViewComments={(postId) => navigate(`/post/${postId}`)}
                  onRequestChat={(postId, preview) =>
                    setChatContext({ kind: 'post', contextRef: postId, preview })
                  }
                />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/create" 
            element={
              <ProtectedRoute>
                <CreatePostPage
                  onCancel={() => navigate('/')}
                  onSuccess={(createdPost) => {
                    navigate('/', { state: { newPost: createdPost, timestamp: Date.now() } });
                    setFeedKey((prev) => prev + 1);
                  }}
                />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/post/:id" 
            element={<PostDetailWrapper onBack={() => navigate('/')} />} 
          />
          <Route 
            path="/posts/:id" 
            element={<PostDetailWrapper onBack={() => navigate('/')} />} 
          />
          <Route 
            path="/wallet" 
            element={
              <ProtectedRoute>
                <WalletDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <UserProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile/:userId" 
            element={
              <ProtectedRoute>
                <UserProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/n/:realmName"
            element={
              <ProtectedRoute>
                <RealmPage />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/landing" 
            element={
              <LandingPage
                theme={landingTheme}
                onToggleTheme={() => setThemeMode(resolvedTheme === 'dark' ? 'light' : 'dark')}
                onGetStarted={() => navigate('/')}
              />
            } 
          />
        </Routes>
      </div>

      <ChatDrawer 
        context={chatContext} 
        currentUserId={socketUserId} 
        onClose={() => setChatContext(null)} 
      />

      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
      />
    </Layout>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <Router>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <AppContent />
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </Router>
    </HelmetProvider>
  );
}
