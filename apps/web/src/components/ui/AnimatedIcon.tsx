'use client';

import { useEffect, useRef } from 'react';
import type { LucideIcon, LucideProps } from 'lucide-react';
import { motion, useAnimationControls, useReducedMotion } from 'framer-motion';

export type IconAnimation = 'none' | 'rotate' | 'pulse' | 'bounce' | 'shake' | 'toggle' | 'slide';

interface AnimatedIconProps extends LucideProps {
  icon: LucideIcon;
  animation?: IconAnimation;
  active?: boolean;
  rtl?: boolean;
  trigger?: 'click';
  wrapperClassName?: string;
}

export function AnimatedIcon({
  icon: Icon,
  animation = 'none',
  active,
  rtl = false,
  trigger,
  size = 20,
  className = 'text-slate-600 transition-colors group-hover:text-slate-900',
  wrapperClassName = 'inline-flex shrink-0',
  ...iconProps
}: AnimatedIconProps) {
  const shouldReduceMotion = useReducedMotion();
  const controls = useAnimationControls();
  const previousActive = useRef(active);
  const usesControls = animation === 'rotate' || (animation === 'toggle' && active !== undefined) || trigger === 'click';
  const animate = shouldReduceMotion
    ? undefined
    : animation === 'pulse'
      ? { scale: [1, 1.1, 1] }
      : animation === 'bounce'
        ? { y: [0, -3, 0] }
        : usesControls
          ? controls
          : undefined;
  const whileHover = shouldReduceMotion
    ? undefined
    : animation === 'rotate'
      ? { rotate: 15 }
      : animation === 'shake'
        ? { rotate: [0, -10, 10, -10, 0] }
        : animation === 'slide'
          ? { x: rtl ? -3 : 3 }
          : undefined;

  useEffect(() => {
    if (
      shouldReduceMotion ||
      animation !== 'toggle' ||
      active === undefined ||
      previousActive.current === active
    ) {
      previousActive.current = active;
      return;
    }

    void controls.start({
      rotate: 360,
      scale: [1, 0.75, 1.15, 1],
      transition: { duration: 0.45, ease: 'easeInOut' },
    });
    previousActive.current = active;
  }, [active, animation, controls, shouldReduceMotion]);

  return (
    <motion.span
      animate={animate}
      whileHover={whileHover}
      transition={
        animation === 'pulse' || animation === 'bounce'
          ? { repeat: Infinity, duration: animation === 'pulse' ? 2 : 1.5 }
          : { duration: 0.2 }
      }
      onClickCapture={
        trigger === 'click' && !shouldReduceMotion
          ? () => {
              controls.set({ rotate: 0, scale: 1 });
              void controls.start({
                rotate: 360,
                scale: 1,
                transition: { duration: 0.45, ease: 'easeInOut' },
              });
            }
          : undefined
      }
      onFocusCapture={
        animation === 'rotate' && !shouldReduceMotion
          ? () => void controls.start({ rotate: 15, transition: { duration: 0.2 } })
          : undefined
      }
      onBlurCapture={
        animation === 'rotate' && !shouldReduceMotion
          ? () => void controls.start({ rotate: 0, transition: { duration: 0.2 } })
          : undefined
      }
      className={wrapperClassName}
    >
      <Icon {...iconProps} size={size} className={className} />
    </motion.span>
  );
}
