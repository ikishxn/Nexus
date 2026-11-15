import { useState, useRef, useEffect } from 'react';
import { X, Coins, AlertTriangle, CheckCircle2, Loader2, Globe } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { cn } from '../lib/cn';

const REALM_MINT_FEE = 5000;

const THEME_COLORS = [
  { value: 'rose',    label: 'Rose',    bg: 'bg-rose-500',    ring: 'ring-rose-500' },
  { value: 'emerald', label: 'Emerald', bg: 'bg-emerald-500', ring: 'ring-emerald-500' },
  { value: 'amber',   label: 'Amber',   bg: 'bg-amber-500',   ring: 'ring-amber-500' },
  { value: 'indigo',  label: 'Indigo',  bg: 'bg-indigo-500',  ring: 'ring-indigo-500' },
  { value: 'violet',  label: 'Violet',  bg: 'bg-violet-500',  ring: 'ring-violet-500' },
  { value: 'sky',     label: 'Sky',     bg: 'bg-sky-500',     ring: 'ring-sky-500' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (realmName: string) => void;
}

export default function CreateRealmModal({ isOpen, onClose, onSuccess }: Props) {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [themeColor, setThemeColor] = useState('rose');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const backdropRef = useRef<HTMLDivElement>(null);

  const hasEnoughBalance = (user?.walletBalance ?? 0) >= REALM_MINT_FEE;

  // Auto-format name: lowercase, replace spaces/special chars with underscore
  const handleNameChange = (val: string) => {
    const formatted = val
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
    setName(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasEnoughBalance || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);

    try {
      await api.post('/realms', { name, displayName, description, themeColor });
      await refreshUser();
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.(name);
        navigate(`/n/${name}`);
        onClose();
      }, 1200);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to mint realm';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      setName(''); setDisplayName(''); setDescription('');
      setThemeColor('rose'); setError(null); setSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 dark:bg-rose-500 shadow-sm shadow-rose-600/20">
              <Globe className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Mint a New Realm</h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Create your own community space</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Cost Warning Banner */}
        <div className={cn(
          'flex items-center gap-2.5 px-6 py-3 text-xs font-semibold',
          hasEnoughBalance
            ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-b border-amber-100 dark:border-amber-500/20'
            : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-b border-red-100 dark:border-red-500/20'
        )}>
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>
            Minting a Realm requires a <strong>5,000 cr network fee.</strong>{' '}
            Your balance: <strong>{(user?.walletBalance ?? 0).toLocaleString()} cr</strong>
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Realm Name */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Realm Name <span className="text-zinc-400 font-normal">(slug, no spaces)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">n/</span>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="mern_stack"
                maxLength={32}
                required
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 py-2.5 pl-8 pr-3 text-sm font-mono text-zinc-900 dark:text-zinc-100 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
              />
            </div>
            <p className="mt-1 text-[10px] text-zinc-400">Only lowercase letters, numbers, underscores. Auto-formatted.</p>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="MERN Stack Developers"
              maxLength={60}
              required
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 py-2.5 px-3 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Description <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this realm about?"
              maxLength={500}
              rows={3}
              className="w-full resize-none rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 py-2.5 px-3 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
            />
            <p className="mt-1 text-[10px] text-zinc-400 text-right">{description.length}/500</p>
          </div>

          {/* Theme Color Picker */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">Theme Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {THEME_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setThemeColor(color.value)}
                  title={color.label}
                  className={cn(
                    'h-7 w-7 rounded-full transition-all ring-offset-2 dark:ring-offset-zinc-950',
                    color.bg,
                    themeColor === color.value ? `ring-2 ${color.ring} scale-110` : 'ring-0 opacity-70 hover:opacity-100 hover:scale-105'
                  )}
                />
              ))}
              <span className="ml-1 text-xs font-semibold text-zinc-500 capitalize">{themeColor}</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-xs font-semibold text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-4 py-3 flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              Realm minted! Redirecting…
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            {!hasEnoughBalance ? (
              <div className="flex-1 flex items-center gap-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 px-4 py-2.5">
                <Coins className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                  Insufficient balance.{' '}
                  <Link to="/wallet" onClick={onClose} className="font-bold text-rose-600 dark:text-rose-400 hover:underline">
                    Buy Credits →
                  </Link>
                </span>
              </div>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || !name || !displayName || success}
                className={cn(
                  'flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-200',
                  isSubmitting || !name || !displayName || success
                    ? 'bg-zinc-300 dark:bg-zinc-700 cursor-not-allowed shadow-none'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20 hover:-translate-y-0.5 active:scale-95'
                )}
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Minting…</>
                ) : (
                  <><Coins className="h-4 w-4 text-amber-300" /> Mint Realm · 5,000 cr</>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
