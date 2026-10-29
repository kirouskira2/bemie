import React, { type ComponentPropsWithoutRef, type CSSProperties } from 'react';
import { cn } from '../../lib/utils';

export interface ShimmerButtonProps extends ComponentPropsWithoutRef<'button'> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  className?: string;
  children?: React.ReactNode;
}

export const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      shimmerColor = '#C5A880',
      shimmerSize = '0.08em',
      shimmerDuration = '3s',
      borderRadius = '9999px',
      background = '#1C1917',
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        style={
          {
            '--spread': '90deg',
            '--shimmer-color': shimmerColor,
            '--radius': borderRadius,
            '--speed': shimmerDuration,
            '--cut': shimmerSize,
            '--bg': background,
          } as CSSProperties
        }
        className={cn(
          'group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden [border-radius:var(--radius)] border border-stone-800/60 px-6 py-3 whitespace-nowrap text-stone-100 [background:var(--bg)] font-sans text-xs tracking-widest uppercase transition-all duration-300 hover:border-amber-700/50 hover:shadow-lg hover:shadow-amber-950/20 active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        ref={ref}
        {...props}
      >
        {/* spark container */}
        <div
          className={cn(
            '-z-30 blur-[2px]',
            'absolute inset-0 overflow-visible'
          )}
        >
          <div className="animate-shimmer-slide absolute inset-0 aspect-square h-full rounded-none">
            <div className="animate-spin-around absolute -inset-full w-auto rotate-0 [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))]" />
          </div>
        </div>

        <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>

        {/* highlight overlay */}
        <div
          className={cn(
            'absolute inset-0 size-full pointer-events-none',
            'rounded-full px-4 py-1.5 shadow-[inset_0_-8px_10px_rgba(197,168,128,0.1)]',
            'transition-all duration-300 ease-in-out',
            'group-hover:shadow-[inset_0_-6px_14px_rgba(197,168,128,0.25)]'
          )}
        />

        {/* backdrop */}
        <div
          className={cn(
            'absolute inset-[var(--cut)] -z-20 [border-radius:var(--radius)] [background:var(--bg)]'
          )}
        />
      </button>
    );
  }
);

ShimmerButton.displayName = 'ShimmerButton';
