'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, TrendingUp, ShieldCheck, CheckCircle2, ArrowRight, Loader2, Sparkles, DollarSign } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';

interface StrategyPick {
  symbol: string;
  name_ar: string;
  name_en: string;
  market: string;
  current_price: number;
  currency: string;
  strategy_score: number;
  rank: number;
  key_metric?: string;
  allocation_pct?: number;
}

interface StrategyItem {
  id: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  cagr: number;
  sharpe: number;
  max_dd: number;
  top_picks: StrategyPick[];
}

interface ApplyStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ApplyStrategyModal({ isOpen, onClose, onSuccess }: ApplyStrategyModalProps) {
  const { language } = useApp();
  const isAr = language === 'ar';

  const [strategies, setStrategies] = useState<StrategyItem[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('value');
  const [loadingStrategies, setLoadingStrategies] = useState(false);
  const [applying, setApplying] = useState(false);
  const [capital, setCapital] = useState<string>('10000');

  useEffect(() => {
    if (!isOpen) return;

    async function loadStrategies() {
      try {
        setLoadingStrategies(true);
        const res = await fetch('/api/strategies');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.strategies) && data.strategies.length > 0) {
            setStrategies(data.strategies);
            if (!data.strategies.some((s: StrategyItem) => s.id === selectedStrategyId)) {
              setSelectedStrategyId(data.strategies[0].id);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load strategies:', err);
      } finally {
        setLoadingStrategies(false);
      }
    }

    loadStrategies();
  }, [isOpen, selectedStrategyId]);

  if (!isOpen) return null;

  const currentStrategy = strategies.find((s) => s.id === selectedStrategyId) || strategies[0];
  const picks = currentStrategy?.top_picks || [];
  const pickCount = picks.length > 0 ? picks.length : 1;
  const equalWeight = Math.round(100 / pickCount);

  const parsedCapital = parseFloat(capital) || 10000;

  const handleApply = async () => {
    if (!picks || picks.length === 0) {
      toast.error(isAr ? 'لا توجد أسهم مختارة لهذه الاستراتيجية' : 'No picks available for this strategy');
      return;
    }

    setApplying(true);
    const today = new Date().toISOString().slice(0, 10);
    const capitalPerStock = parsedCapital / picks.length;

    try {
      // Execute transactions in parallel
      const promises = picks.map((pick) => {
        const sharePrice = pick.current_price > 0 ? pick.current_price : 100;
        const shares = Math.max(1, Math.round(capitalPerStock / sharePrice));

        return fetch('/api/portfolio/transaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol: pick.symbol,
            type: 'BUY',
            quantity: shares,
            price: sharePrice,
            date: today,
          }),
        });
      });

      const results = await Promise.all(promises);
      const allOk = results.every((r) => r.ok);

      if (!allOk) {
        throw new Error(isAr ? 'فشل حفظ بعض الصفقات' : 'Some transactions could not be saved');
      }

      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0f172a', '#3b82f6', '#10b981', '#ffffff'],
        });
      } catch {
        // Fallback
      }

      toast.success(
        isAr
          ? `تم تطبيق استراتيجية "${currentStrategy?.name_ar}" وإضافة ${picks.length} صفقات للمحفظة بنجاح!`
          : `Strategy "${currentStrategy?.name_en}" applied! ${picks.length} positions added to portfolio.`
      );

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error applying strategy';
      toast.error(msg);
    } finally {
      setApplying(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-white dark:bg-[#0b0f17] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-center border border-slate-200 dark:border-slate-700">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {isAr ? 'تطبيق استراتيجية استثمارية' : 'Apply Pro Strategy to Portfolio'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isAr
                    ? 'اختر من الاستراتيجيات الخمس المؤسسية لبناء سلة استثمارية مدروسة ومختبرة بأثر رجعي'
                    : 'Select an institutional strategy to batch-allocate verified algorithmic picks'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={applying}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto">
            {/* Strategy Selector Tabs */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 block">
                {isAr ? 'اختر الاستراتيجية المؤسسية' : 'Select Institutional Strategy'}
              </label>
              {loadingStrategies ? (
                <div className="flex items-center justify-center py-6 text-slate-400 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-xs">{isAr ? 'جاري تحميل الاستراتيجيات...' : 'Loading strategies...'}</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {strategies.map((strat) => {
                    const isSelected = strat.id === selectedStrategyId;
                    return (
                      <button
                        key={strat.id}
                        type="button"
                        onClick={() => setSelectedStrategyId(strat.id)}
                        className={`p-3 text-right rtl:text-right ltr:text-left rounded-xl border transition-all text-xs font-bold cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="font-black text-sm">{isAr ? strat.name_ar : strat.name_en}</div>
                        <div className="text-[10px] opacity-75 mt-0.5">
                          CAGR: +{strat.cagr}% · Sharpe: {strat.sharpe}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Strategy Summary */}
            {currentStrategy && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    {isAr ? currentStrategy.name_ar : currentStrategy.name_en}
                  </span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-500">CAGR:</span>
                    <span className="font-black text-slate-900 dark:text-white">+{currentStrategy.cagr}%</span>
                    <span className="text-slate-500">Sharpe:</span>
                    <span className="font-black text-slate-900 dark:text-white">{currentStrategy.sharpe}</span>
                    <span className="text-slate-500">Max DD:</span>
                    <span className="font-black text-slate-900 dark:text-white">{currentStrategy.max_dd}%</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {isAr ? currentStrategy.description_ar : currentStrategy.description_en}
                </p>
              </div>
            )}

            {/* Capital Allocation Input */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5 block">
                {isAr ? 'رأس المال المستهدف للتوزيع (USD / EGP)' : 'Target Capital to Allocate (USD / EGP)'}
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 absolute top-1/2 -translate-y-1/2 left-3 rtl:left-auto rtl:right-3 text-slate-400" />
                <input
                  type="number"
                  value={capital}
                  onChange={(e) => setCapital(e.target.value)}
                  min="100"
                  step="500"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-9 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400"
                  placeholder="10000"
                />
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {isAr
                  ? `سيتم توزيع ${(parsedCapital / pickCount).toLocaleString(undefined, { maximumFractionDigits: 0 })} لكل سهم من الأسهم الـ ${pickCount} بالتساوي.`
                  : `Each of the ${pickCount} stocks will receive ~$${(parsedCapital / pickCount).toLocaleString(undefined, { maximumFractionDigits: 0 })} in capital.`}
              </div>
            </div>

            {/* Picks Preview Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                  {isAr ? 'الأسهم المختارة ومعدل التوزيع' : 'Current Strategy Picks & Allocation'}
                </label>
                <span className="text-xs font-bold text-slate-400">
                  {picks.length} {isAr ? 'أسهم' : 'stocks'}
                </span>
              </div>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {picks.map((pick) => {
                  const estCapital = parsedCapital / pickCount;
                  const estShares = Math.max(1, Math.round(estCapital / (pick.current_price || 1)));
                  return (
                    <div
                      key={pick.symbol}
                      className="p-3 bg-white dark:bg-[#0b0f17] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono font-black text-slate-800 dark:text-slate-200 flex items-center justify-center text-[11px]">
                          #{pick.rank}
                        </div>
                        <div>
                          <div className="font-black text-slate-900 dark:text-white">
                            {pick.symbol} · {isAr ? pick.name_ar : pick.name_en}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {pick.market} · {pick.current_price.toFixed(2)} {pick.currency}
                          </div>
                        </div>
                      </div>

                      <div className="text-right rtl:text-left">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          ~{estShares} {isAr ? 'سهم' : 'shares'} ({equalWeight}%)
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {pick.key_metric || `Score: ${pick.strategy_score}/100`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0e1420] flex items-center justify-between">
            <button
              onClick={onClose}
              disabled={applying}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              onClick={handleApply}
              disabled={applying || picks.length === 0}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 text-xs font-black shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {applying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isAr ? 'جاري التطبيق والتسجيل...' : 'Applying Positions...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{isAr ? 'تطبيق الاستراتيجية على المحفظة' : 'Apply Strategy to Portfolio'}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
