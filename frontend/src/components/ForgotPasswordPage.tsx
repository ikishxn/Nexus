import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Network, Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send password reset link');
      }

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-zinc-950 px-4 py-12 overflow-hidden select-none">
      {/* Background radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-rose-900/25 via-zinc-950 to-zinc-950" />
      
      {/* Blurred mesh lights */}
      <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-rose-600/10 blur-[100px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-purple-600/10 blur-[100px] animate-pulse pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-60 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur-xl">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-600 shadow-lg shadow-rose-600/25">
            <Network className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-tight text-white text-center">
            Reset Password
          </h2>
          <p className="mt-1.5 text-sm text-zinc-400 text-center">
            Enter your account email to receive a secure recovery link
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2.5 rounded-2xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs font-semibold text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-3" />
              <h3 className="text-base font-bold text-white mb-1">Check your inbox</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                If an account exists for <strong className="text-emerald-300">{email}</strong>, we have sent instructions to reset your password. The link expires in 1 hour.
              </p>
            </div>

            <Link
              to="/auth"
              className="w-full h-11 inline-flex items-center justify-center font-bold px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all text-sm gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 h-11 inline-flex items-center justify-center font-bold px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 disabled:bg-rose-600/50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5 active:scale-98 text-sm gap-2"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <Link
                to="/auth"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
