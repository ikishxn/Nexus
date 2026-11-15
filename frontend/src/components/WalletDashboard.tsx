import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Wallet,
  Coins,
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
  History,
  Loader2,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Button } from './UIComponents';
import { cn } from '../lib/cn';

export interface LedgerTransaction {
  _id: string;
  userId: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'BOUNTY_EARNED' | 'BOUNTY_PAID' | 'UPVOTE_EARNED';
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  gatewayReferenceId?: string;
  description?: string;
  createdAt: string;
}

const CREDIT_TIERS = [
  { credits: 500, priceUsd: 5.0, label: 'Starter', bonus: '' },
  { credits: 1200, priceUsd: 10.0, label: 'Popular', bonus: '+20% Bonus' },
  { credits: 3000, priceUsd: 25.0, label: 'Pro', bonus: '+25% Bonus' },
  { credits: 6500, priceUsd: 50.0, label: 'Architect', bonus: '+30% Bonus' },
];

export default function WalletDashboard() {
  const { user, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Buy Credits Modal state
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<number>(1200);
  const [customCredits, setCustomCredits] = useState<string>('');
  const [isProcessingBuy, setIsProcessingBuy] = useState(false);

  // Cash Out Modal state
  const [showCashOutModal, setShowCashOutModal] = useState(false);
  const [cashOutAmount, setCashOutAmount] = useState<number>(5000);
  const [payoutMethod, setPayoutMethod] = useState<'stripe_connect' | 'paypal' | 'bank_wire'>('stripe_connect');
  const [payoutAccount, setPayoutAccount] = useState<string>('');
  const [isProcessingCashOut, setIsProcessingCashOut] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();

  const walletBalance = user?.walletBalance ?? 0;
  const canCashOut = walletBalance >= 5000;
  const fiatValuation = (walletBalance / 100).toFixed(2);

  const fetchTransactions = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await api.get('/payments/transactions');
      setTransactions(res.data || []);
    } catch (err: any) {
      console.error('Failed to load transaction history', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Handle redirect back from Stripe Test Checkout (?success=true or ?canceled=true)
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setFeedbackMsg({
        text: 'Payment successful! Your Nexus Credits have been deposited into your wallet.',
        type: 'success',
      });
      refreshUser();
      fetchTransactions();
      window.dispatchEvent(new Event('wallet:update'));
      searchParams.delete('success');
      setSearchParams(searchParams, { replace: true });
    } else if (searchParams.get('canceled') === 'true') {
      setFeedbackMsg({
        text: 'Checkout session was canceled. No charges were made.',
        type: 'error',
      });
      searchParams.delete('canceled');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleBuyCredits = async () => {
    const creditsToBuy = customCredits ? Number(customCredits) : selectedTier;
    if (!creditsToBuy || creditsToBuy < 100) {
      alert('Minimum purchase is 100 credits ($1.00 USD)');
      return;
    }

    setIsProcessingBuy(true);
    try {
      const response = await api.post('/payments/buy', {
        amount: creditsToBuy,
        credits: creditsToBuy,
      });

      // Redirect Logic: Redirect the user to the payment gateway session URL
      if (response.data?.url) {
        window.location.href = response.data.url;
        return;
      }
      
      setShowBuyModal(false);
      setCustomCredits('');
      setFeedbackMsg({
        text: `Successfully added ${creditsToBuy.toLocaleString()} cr to your wallet!`,
        type: 'success',
      });
      setTimeout(() => setFeedbackMsg(null), 5000);

      await refreshUser();
      await fetchTransactions();
      window.dispatchEvent(new Event('wallet:update'));
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Payment failed');
    } finally {
      setIsProcessingBuy(false);
    }
  };

  const handleCashOut = async () => {
    if (cashOutAmount < 5000) {
      alert('Minimum cash-out is 5,000 cr ($50.00 USD)');
      return;
    }
    if (cashOutAmount > walletBalance) {
      alert('Cash-out amount cannot exceed your available balance.');
      return;
    }
    if (!payoutAccount.trim()) {
      alert('Please enter your payout account (email, Stripe ID, or IBAN).');
      return;
    }

    setIsProcessingCashOut(true);
    try {
      await api.post('/payments/cash-out', {
        amount: cashOutAmount,
        payoutMethod,
        payoutAccount: payoutAccount.trim(),
      });

      setShowCashOutModal(false);
      setPayoutAccount('');
      setFeedbackMsg({
        text: `Cash-out request of ${cashOutAmount.toLocaleString()} cr ($${(cashOutAmount / 100).toFixed(
          2
        )} USD) submitted to ${payoutMethod}!`,
        type: 'success',
      });
      setTimeout(() => setFeedbackMsg(null), 5000);

      await refreshUser();
      await fetchTransactions();
      window.dispatchEvent(new Event('wallet:update'));
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Cash-out failed');
    } finally {
      setIsProcessingCashOut(false);
    }
  };

  const getBadgeStyle = (type: LedgerTransaction['type']) => {
    switch (type) {
      case 'DEPOSIT':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'WITHDRAWAL':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'BOUNTY_EARNED':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'BOUNTY_PAID':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'UPVOTE_EARNED':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20';
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-8 animate-in slide-in-from-top-2">
      {/* Toast Alert Feedback */}
      {feedbackMsg && (
        <div
          className={cn(
            'flex items-center justify-between rounded-xl p-4 text-xs font-semibold shadow-lg backdrop-blur-sm transition-all',
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
          )}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Prominent Wallet Card */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-b from-white via-zinc-50/60 to-white dark:from-zinc-900/90 dark:via-zinc-900/50 dark:to-zinc-900/90 p-8 shadow-panel backdrop-blur-md">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-rose-600/10 dark:bg-rose-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-600/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20">
                <Wallet className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Nexus Fiat & Reward Treasury
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                <ShieldCheck className="h-3 w-3" />
                Ledger Backed
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black tracking-tight text-zinc-900 dark:text-white font-mono">
                  {walletBalance.toLocaleString()}
                </span>
                <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">cr</span>
              </div>
              <p className="mt-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Estimated Fiat Value:{' '}
                <span className="font-bold text-zinc-900 dark:text-zinc-200">${fiatValuation} USD</span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500"> (100 cr = $1.00 USD)</span>
              </p>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowBuyModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-rose-600/25 hover:bg-rose-500 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
            >
              <Coins className="h-4 w-4 text-amber-300" />
              <span>Buy Credits</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCashOutModal(true)}
              disabled={!canCashOut}
              title={
                canCashOut
                  ? 'Withdraw credits to fiat via Stripe Connect'
                  : 'Minimum 5,000 cr required to cash out ($50.00 USD)'
              }
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-bold transition-all duration-200 cursor-pointer',
                canCashOut
                  ? 'border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-750 shadow-sm'
                  : 'border-zinc-200 bg-zinc-100/70 text-zinc-400 opacity-60 pointer-events-none dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-600'
              )}
            >
              <ArrowUpRight className="h-4 w-4" />
              <span>Cash Out</span>
            </button>
          </div>
        </div>

        {/* Quick Requirement Note for Cash Out */}
        {!canCashOut && (
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-100/60 dark:bg-zinc-800/30 px-3.5 py-2 text-xs text-zinc-500 dark:text-zinc-400">
            <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
            <span>
              Cash-out unlocks once your wallet reaches <strong>5,000 cr</strong> ($50.00 USD). You currently need{' '}
              <strong className="text-zinc-900 dark:text-zinc-200">
                {(5000 - walletBalance).toLocaleString()} cr
              </strong>{' '}
              more.
            </span>
          </div>
        )}
      </div>

      {/* Transaction History Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              Immutable Financial Ledger
            </h2>
            <span className="rounded-full bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 font-mono">
              {transactions.length}
            </span>
          </div>

          <button
            type="button"
            onClick={fetchTransactions}
            title="Refresh Ledger"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isLoadingHistory && 'animate-spin')} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Ledger Table */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-800/40 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Gateway Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {isLoadingHistory ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-400">
                      <div className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
                        <span>Querying financial ledger...</span>
                      </div>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-400 dark:text-zinc-500">
                      <Coins className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-700 mb-2" />
                      <p className="font-semibold text-sm">No transaction records found</p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Earn credits through answers, bounties, upvotes, or click "Buy Credits" to begin.
                      </p>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const isPositive = tx.amount > 0;
                    return (
                      <tr
                        key={tx._id}
                        className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors font-medium"
                      >
                        <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold',
                              getBadgeStyle(tx.type)
                            )}
                          >
                            {tx.type}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 max-w-xs truncate">
                          {tx.description || `${tx.type} transaction`}
                        </td>

                        <td
                          className={cn(
                            'px-4 py-3 text-right font-bold font-mono whitespace-nowrap text-sm',
                            isPositive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          )}
                        >
                          {isPositive ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()}{' '}
                          <span className="text-xs font-normal opacity-80">{tx.currency || 'cr'}</span>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
                              tx.status === 'COMPLETED'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : tx.status === 'PENDING'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            )}
                          >
                            {tx.status}
                          </span>
                        </td>

                        <td className="px-4 py-3 font-mono text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                          {tx.gatewayReferenceId ? (
                            <div className="flex items-center gap-1.5">
                              <span className="max-w-[120px] truncate" title={tx.gatewayReferenceId}>
                                {tx.gatewayReferenceId}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(tx.gatewayReferenceId!)}
                                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                                title="Copy reference ID"
                              >
                                {copiedId === tx.gatewayReferenceId ? (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-zinc-400 italic">Internal</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Buy Credits Modal */}
      {showBuyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setShowBuyModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
                  <CreditCard className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    Purchase Nexus Credits
                  </h3>
                  <p className="text-xs text-zinc-500">Fast checkout powered by Stripe / Razorpay</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBuyModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                ✕
              </button>
            </div>

            {/* Credit Packages Grid */}
            <div className="grid grid-cols-2 gap-3">
              {CREDIT_TIERS.map((tier) => {
                const isSelected = selectedTier === tier.credits && !customCredits;
                return (
                  <button
                    key={tier.credits}
                    type="button"
                    onClick={() => {
                      setSelectedTier(tier.credits);
                      setCustomCredits('');
                    }}
                    className={cn(
                      'relative flex flex-col items-start rounded-2xl border p-4 text-left transition-all cursor-pointer',
                      isSelected
                        ? 'border-rose-600 bg-rose-50/50 dark:border-rose-500 dark:bg-rose-500/10 shadow-md ring-1 ring-rose-500'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 hover:border-zinc-300 dark:hover:border-zinc-700'
                    )}
                  >
                    {tier.bonus && (
                      <span className="absolute top-2 right-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                        {tier.bonus}
                      </span>
                    )}
                    <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                      {tier.label}
                    </span>
                    <span className="text-xl font-black text-zinc-900 dark:text-white font-mono mt-1">
                      {tier.credits.toLocaleString()} cr
                    </span>
                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-2">
                      ${tier.priceUsd.toFixed(2)} USD
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom credits input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Or enter custom credit amount:
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="100"
                  step="50"
                  value={customCredits}
                  onChange={(e) => setCustomCredits(e.target.value)}
                  placeholder="e.g. 2500"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-3.5 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                  cr
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 p-3 text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
              <span>Total Payable:</span>
              <span className="font-bold text-sm text-zinc-900 dark:text-white font-mono">
                $
                {customCredits
                  ? (Number(customCredits) / 100).toFixed(2)
                  : (selectedTier / 100).toFixed(2)}{' '}
                USD
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowBuyModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleBuyCredits}
                disabled={isProcessingBuy}
                className="gap-2"
              >
                {isProcessingBuy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    <span>Confirm & Pay</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cash Out Modal */}
      {showCashOutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setShowCashOutModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20">
                  <ArrowUpRight className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    Cash Out to Fiat
                  </h3>
                  <p className="text-xs text-zinc-500">Stripe Connect & Direct Bank Transfer</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCashOutModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Cash-out Amount (min 5,000 cr):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="5000"
                    max={walletBalance}
                    step="500"
                    value={cashOutAmount}
                    onChange={(e) => setCashOutAmount(Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-3.5 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                    cr (${(cashOutAmount / 100).toFixed(2)} USD)
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-zinc-400 pt-1">
                  <span>Available: {walletBalance.toLocaleString()} cr</span>
                  <button
                    type="button"
                    onClick={() => setCashOutAmount(walletBalance)}
                    className="text-rose-600 dark:text-rose-400 font-bold hover:underline"
                  >
                    Use Max
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Payout Method:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'stripe_connect', label: 'Stripe Connect' },
                    { id: 'paypal', label: 'PayPal' },
                    { id: 'bank_wire', label: 'Bank Wire' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPayoutMethod(m.id as any)}
                      className={cn(
                        'rounded-xl border py-2 text-center text-xs font-bold transition-all',
                        payoutMethod === m.id
                          ? 'border-rose-600 bg-rose-50 text-rose-600 dark:border-rose-500 dark:bg-rose-500/10 dark:text-rose-400'
                          : 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Payout Account / Email / IBAN:
                </label>
                <input
                  type="text"
                  required
                  value={payoutAccount}
                  onChange={(e) => setPayoutAccount(e.target.value)}
                  placeholder={
                    payoutMethod === 'stripe_connect'
                      ? 'acct_1XXXXXXXXXXXXX or Stripe email'
                      : payoutMethod === 'paypal'
                      ? 'paypal@domain.com'
                      : 'IBAN / Routing & Account No'
                  }
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 px-3.5 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowCashOutModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCashOut}
                disabled={isProcessingCashOut || cashOutAmount < 5000 || cashOutAmount > walletBalance}
                className="gap-2 bg-amber-600 hover:bg-amber-500 shadow-amber-600/20 text-white"
              >
                {isProcessingCashOut ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Executing Withdrawal...</span>
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="h-4 w-4" />
                    <span>Confirm Cash Out</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
