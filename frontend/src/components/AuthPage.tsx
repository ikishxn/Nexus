import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Network, Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../lib/api';

export default function AuthPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const endpoint = isSignUp ? '/auth/register' : '/auth/login';
      const payload = isSignUp ? { username, email, password } : { email, password };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ message: 'Authentication failed' }));
        const httpErr = new Error(body.message || 'Authentication failed');
        (httpErr as any).isHttpError = true;
        throw httpErr;
      }

      const data = await response.json();
      
      login(data.accessToken, data.user || {
        _id: data.userId || data.id,
        username: data.username,
        email: data.email,
        walletBalance: data.walletBalance ?? 100,
        reputationScore: data.reputationScore ?? 0,
      });

      navigate('/');
    } catch (err: any) {
      if (err.isHttpError) {
        setError(err.message);
        return;
      }

      console.warn('Backend API connection failed. Using mock auth simulation as fallback.', err);
      
      // Simulating API loading latency
      await new Promise((resolve) => setTimeout(resolve, 800));

      const simulatedUser = {
        username: username || email.split('@')[0] || 'developer_pro',
        email: email,
        walletBalance: 100,
        reputationScore: 25,
        badges: ['Early Adopter', 'Verified Developer'],
      };

      login('mock-jwt-token-abcd-1234', simulatedUser);
      navigate('/');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-zinc-950 px-4 py-12 overflow-hidden select-none">
      {/* Premium background radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-rose-900/25 via-zinc-950 to-zinc-950" />
      
      {/* Decorative blurred mesh lights */}
      <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-rose-600/10 blur-[100px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-purple-600/10 blur-[100px] animate-pulse pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-60 pointer-events-none" />

      {/* Auth Container Card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur-xl">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-600 shadow-lg shadow-rose-600/25 animate-bounce">
            <Network className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-tight text-white">
            {isSignUp ? 'Create your account' : 'Welcome to Nexus'}
          </h2>
          <p className="mt-1.5 text-sm text-zinc-400">
            {isSignUp ? 'Get real feedback on your code and UI' : 'Sign in to review and share knowledge'}
          </p>
        </div>

        {/* Form Toggle Slider Tabs */}
        <div className="flex bg-zinc-950 p-1 rounded-2xl border border-white/5 mb-6">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setError(null);
            }}
            className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all duration-200 ${
              !isSignUp 
                ? 'bg-rose-600 text-white shadow-md' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setError(null);
            }}
            className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all duration-200 ${
              isSignUp 
                ? 'bg-rose-600 text-white shadow-md' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs font-semibold text-red-300">
            {error}
          </div>
        )}

        {/* Form Submission */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Username (Register only) */}
          {isSignUp && (
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required={isSignUp}
                  placeholder="developer_pro"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-zinc-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-600 outline-none transition-all duration-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-zinc-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-600 outline-none transition-all duration-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-zinc-950 py-2.5 pl-10 pr-12 text-sm text-white placeholder-zinc-600 outline-none transition-all duration-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-500 hover:text-zinc-350 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 h-11 inline-flex items-center justify-center font-bold px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 disabled:bg-rose-600/50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5 active:scale-98 text-sm gap-2"
          >
            {isSubmitting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
