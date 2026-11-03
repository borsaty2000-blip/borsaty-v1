"use client";

import React, { useState, useRef, useEffect } from "react";
import { HelpCircle, Info } from "lucide-react";

interface InfoTooltipProps {
  content: string;
  contentAr?: string;
  children?: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export default function InfoTooltip({
  content,
  contentAr,
  children,
  position = "top",
  className = "",
}: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Close on Escape or click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node)
      ) {
        setIsVisible(false);
      }
    }

    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isVisible]);

  const posClass =
    position === "top"
      ? "bottom-full mb-2 start-1/2 -translate-x-1/2 rtl:translate-x-1/2"
      : position === "bottom"
      ? "top-full mt-2 start-1/2 -translate-x-1/2 rtl:translate-x-1/2"
      : position === "left"
      ? "end-full me-2 top-1/2 -translate-y-1/2"
      : "start-full ms-2 top-1/2 -translate-y-1/2";

  return (
    <span
      ref={triggerRef}
      className={`relative inline-flex items-center cursor-help group ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={() => setIsVisible(!isVisible)}
      tabIndex={0}
      role="tooltip"
      aria-label={content}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children || (
        <HelpCircle className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
      )}

      {isVisible && (
        <div
          ref={tooltipRef}
          role="status"
          className={`absolute ${posClass} z-50 w-56 p-2.5 rounded-xl bg-slate-950 text-white border border-slate-700 shadow-xl text-[11px] leading-relaxed font-medium pointer-events-none animate-in fade-in zoom-in-95 duration-150`}
        >
          <div className="text-slate-100">{content}</div>
          {contentAr && contentAr !== content && (
            <div className="mt-1 pt-1 border-t border-slate-800 text-slate-300 text-[10px] dir-rtl text-right">
              {contentAr}
            </div>
          )}
        </div>
      )}
    </span>
  );
}
