"use client";

import React, { useState, useEffect } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";

interface WatchlistButtonProps {
  symbol: string;
  nameEn?: string;
  nameAr?: string;
  className?: string;
  showLabel?: boolean;
}

export default function WatchlistButton({
  symbol,
  nameEn,
  nameAr,
  className = "",
  showLabel = true,
}: WatchlistButtonProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const { openSignIn } = useClerk();
  const { language } = useApp();
  const [inWatchlist, setInWatchlist] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const isAr = language === "ar";
  const sym = symbol.toUpperCase();

  // Check initial status on mount / sign-in state
  useEffect(() => {
    let isMounted = true;
    async function checkStatus() {
      if (!isLoaded || !isSignedIn) {
        setIsChecking(false);
        setInWatchlist(false);
        return;
      }

      try {
        const res = await fetch(`/api/watchlist/${sym}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setInWatchlist(Boolean(data.inWatchlist));
          }
        }
      } catch {
        // Non-blocking
      } finally {
        if (isMounted) setIsChecking(false);
      }
    }

    checkStatus();
    return () => {
      isMounted = false;
    };
  }, [sym, isSignedIn, isLoaded]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSignedIn) {
      openSignIn?.();
      return;
    }

    setIsUpdating(true);
    try {
      if (inWatchlist) {
        // Remove
        const res = await fetch(`/api/watchlist/${sym}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setInWatchlist(false);
          toast.success(isAr ? `تمت إزالة ${sym} من قائمة المتابعة` : `${sym} removed from watchlist`);
        }
      } else {
        // Add
        const res = await fetch(`/api/watchlist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbol: sym,
            nameEn: nameEn || sym,
            nameAr: nameAr || sym,
          }),
        });
        if (res.ok) {
          setInWatchlist(true);
          toast.success(isAr ? `تمت إضافة ${sym} إلى قائمة المتابعة` : `${sym} added to watchlist`);
        }
      }
    } catch {
      // Non-blocking
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isChecking || isUpdating}
      aria-label={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
      title={
        inWatchlist
          ? isAr
            ? "إزالة من قائمة المتابعة"
            : "Remove from Watchlist"
          : isAr
          ? "إضافة إلى قائمة المتابعة"
          : "Add to Watchlist"
      }
      className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all shadow-sm ${
        inWatchlist
          ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20"
          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
      } ${className}`}
    >
      {isUpdating ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
      ) : (
        <Star
          className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${
            inWatchlist
              ? "text-amber-500 fill-amber-500"
              : "text-slate-400 group-hover:text-amber-500"
          }`}
        />
      )}
      {showLabel && (
        <span>
          {inWatchlist
            ? isAr
              ? "في المتابعة"
              : "Saved"
            : isAr
            ? "إضافة للمتابعة"
            : "Watchlist"}
        </span>
      )}
    </button>
  );
}
