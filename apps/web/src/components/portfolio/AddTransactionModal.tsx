'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, DollarSign, Calendar, Hash, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialSymbol?: string;
  initialPrice?: number;
}

const POPULAR_STOCKS = [
  { symbol: 'AAPL', price: 235.0, name: 'Apple Inc.' },
  { symbol: 'NVDA', price: 130.0, name: 'NVIDIA' },
  { symbol: 'COMI', price: 86.5, name: 'CIB Egypt' },
  { symbol: '2222', price: 28.5, name: 'Aramco' },
  { symbol: 'MSFT', price: 420.0, name: 'Microsoft' },
  { symbol: 'TSLA', price: 215.0, name: 'Tesla' },
];

export default function AddTransactionModal({
  isOpen,
  onClose,
  onSuccess,
  initialSymbol = 'AAPL',
  initialPrice = 235.0,
}: AddTransactionModalProps) {
  const { language } = useApp();
  const isAr = language === 'ar';

  const [symbol, setSymbol] = useState(initialSymbol);
  const [type, setType] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState('10');
  const [price, setPrice] = useState(initialPrice ? initialPrice.toFixed(2) : '235.00');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectQuickStock = (s: { symbol: string; price: number }) => {
    setSymbol(s.symbol);
    setPrice(s.price.toFixed(2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const qtyNum = parseFloat(quantity);
    const priceNum = parseFloat(price);

    if (!symbol.trim()) {
      setError(isAr ? 'يرجى إدخال رمز السهم' : 'Please provide a stock symbol');
      return;
    }
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setError(isAr ? 'الكمية يجب أن تكون أكبر من صفر' : 'Quantity must be greater than zero');
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      setError(isAr ? 'السعر يجب أن يكون أكبر من صفر' : 'Price must be greater than zero');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/portfolio/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: symbol.trim().toUpperCase(),
          type,
          quantity: qtyNum,
          price: priceNum,
          date,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save transaction');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error recording transaction';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-white"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <h3 className="text-base font-extrabold">
                {isAr ? 'إضافة صفقة جديدة للمحفظة' : 'Record New Transaction'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-200 dark:border-rose-900/50">
                {error}
              </div>
            )}

            {/* Quick chips */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                {isAr ? 'أسهم شائعة سريعة' : 'Popular Instruments'}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_STOCKS.map((s) => (
                  <button
                    key={s.symbol}
                    type="button"
                    onClick={() => handleSelectQuickStock(s)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      symbol === s.symbol
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {s.symbol}
                  </button>
                ))}
              </div>
            </div>

            {/* Buy / Sell Toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                {isAr ? 'نوع الصفقة' : 'Transaction Type'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('BUY')}
                  className={`py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    type === 'BUY'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>{isAr ? 'شراء (BUY)' : 'BUY (Long)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('SELL')}
                  className={`py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    type === 'SELL'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4" />
                  <span>{isAr ? 'بيع (SELL)' : 'SELL (Close)'}</span>
                </button>
              </div>
            </div>

            {/* Stock Symbol */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                {isAr ? 'رمز السهم' : 'Ticker Symbol'}
              </label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="AAPL, COMI, 2222..."
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold uppercase focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>

            {/* Quantity and Price Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5" />
                  <span>{isAr ? 'الكمية (الأسهم)' : 'Quantity (Shares)'}</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="10"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold tabular-nums focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>{isAr ? 'سعر التنفيذ' : 'Execution Price'}</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="150.00"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-bold tabular-nums focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>
            </div>

            {/* Execution Date */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{isAr ? 'تاريخ الصفقة' : 'Transaction Date'}</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>

            {/* Total Value Preview */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-500">{isAr ? 'القيمة الإجمالية للصفقة:' : 'Estimated Total:'}</span>
              <span className="text-sm font-black tabular-nums text-emerald-600 dark:text-emerald-400">
                ${((parseFloat(quantity) || 0) * (parseFloat(price) || 0)).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isAr ? 'تسجيل الصفقة' : 'Save Transaction'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
