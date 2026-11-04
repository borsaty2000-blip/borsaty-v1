"use client";

import React, { useEffect, useRef, useState } from "react";
import CountUp from "react-countup";
import { motion, useAnimationControls, useReducedMotion } from "framer-motion";

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
  duration = 0.35,
  className = "",
}: AnimatedNumberProps) {
  const [mounted, setMounted] = useState(false);
  const controls = useAnimationControls();
  const previousValue = useRef(value);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (previousValue.current !== value) {
      if (!shouldReduceMotion) {
        const color = value > previousValue.current
          ? "rgba(34, 197, 94, 0.18)"
          : "rgba(244, 63, 94, 0.18)";
        void controls.start({
          backgroundColor: [color, "rgba(0, 0, 0, 0)"],
          transition: { duration: 0.65 },
        });
      }
      previousValue.current = value;
    }
  }, [controls, shouldReduceMotion, value]);

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
    <motion.span
      animate={controls}
      className={`rounded-sm tabular-nums ${className}`}
    >
      <CountUp
        end={value}
        decimals={decimals}
        prefix={prefix}
        suffix={suffix}
        duration={shouldReduceMotion ? 0 : duration}
        separator=","
        preserveValue
      />
    </motion.span>
  );
}
