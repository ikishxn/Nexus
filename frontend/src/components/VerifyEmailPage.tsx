import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Network, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { API_BASE_URL } from '../lib/api';

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState('Verifying your email address...');

  useEffect(() => {
    let isMounted = true;

    const verify = async () => {
      if (!token) {
        setIsLoading(false);
        setIsSuccess(false);
        setMessage('Missing email verification token.');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/verify-email/${token}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || 'Invalid or expired verification token.');
        }

        if (isMounted) {
          setIsSuccess(true);
          setMessage(data.message || 'Your email address has been successfully verified!');
        }
      } catch (err: any) {
        if (isMounted) {
          setIsSuccess(false);
          setMessage(err.message || 'Email verification failed. The link may have expired.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    verify();

    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-zinc-950 px-4 py-12 overflow-hidden select-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-rose-900/25 via-zinc-950 to-zinc-950" />
      <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-rose-600/10 blur-[100px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-purple-600/10 blur-[100px] animate-pulse pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-60 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur-xl text-center">
        <div className="flex flex-col items-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-600 shadow-lg shadow-rose-600/25">
            <Network className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-tight text-white">
            Email Verification
          </h2>
        </div>

        {isLoading ? (
          <div className="py-8 space-y-4">
            <div className="h-10 w-10 mx-auto animate-spin rounded-full border-3 border-rose-500 border-t-transparent" />
            <p className="text-sm font-semibold text-zinc-300">{message}</p>
          </div>
        ) : isSuccess ? (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">Account Activated!</h3>
              <p className="text-xs text-zinc-300 leading-relaxed">{message}</p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="w-full h-11 inline-flex items-center justify-center font-bold px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 transition-all text-sm gap-2"
            >
              <span>Sign In to Your Account</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300">
              <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">Verification Failed</h3>
              <p className="text-xs text-zinc-300 leading-relaxed">{message}</p>
            </div>

            <Link
              to="/auth"
              className="w-full h-11 inline-flex items-center justify-center font-bold px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all text-sm"
            >
              Back to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
