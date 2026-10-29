import { useEffect, useRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../lib/utils';

interface NumberTickerProps extends ComponentPropsWithoutRef<'span'> {
  value: number;
  startValue?: number;
  duration?: number;
  decimalPlaces?: number;
  prefix?: string;
  suffix?: string;
}

export function NumberTicker({
  value,
  startValue = 0,
  duration = 1.2,
  decimalPlaces = 0,
  prefix = '',
  suffix = '',
  className,
  ...props
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let startTime: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      // Easing out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (value - startValue) * ease;

      const formatted = Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      }).format(current);

      el.textContent = `${prefix}${formatted}${suffix}`;

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [value, startValue, duration, decimalPlaces, prefix, suffix]);

  return (
    <span
      ref={ref}
      className={cn('inline-block tabular-nums font-mono', className)}
      {...props}
    >
      {prefix}
      {startValue}
      {suffix}
    </span>
  );
}
