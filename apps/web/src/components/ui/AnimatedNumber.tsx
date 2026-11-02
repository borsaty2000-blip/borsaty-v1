"use client";

import React, { useEffect, useState } from "react";
import CountUp from "react-countup";

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

export default function AnimatedNumber({
  value,
  decimals = 2,
  prefix = "",
  suffix = "",
  duration = 1.2,
  className = "",
}: AnimatedNumberProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // SSR fallback to prevent layout shift or hydration mismatch
    return (
      <span className={`tabular-nums ${className}`}>
        {prefix}
        {value.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}
        {suffix}
      </span>
    );
  }

  return (
    <span className={`tabular-nums ${className}`}>
      <CountUp
        end={value}
        decimals={decimals}
        prefix={prefix}
        suffix={suffix}
        duration={duration}
        separator=","
        preserveValue
      />
    </span>
  );
}
