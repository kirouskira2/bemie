import React from 'react';
import { cn } from '../../lib/utils';

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  borderWidth?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
}

export const BorderBeam: React.FC<BorderBeamProps> = ({
  className,
  size = 220,
  duration = 8,
  borderWidth = 1.5,
  colorFrom = '#ffaa40',
  colorTo = '#9c40ff',
  delay = 0,
}) => {
  return (
    <div
      style={
        {
          '--size': `${size}px`,
          '--duration': `${duration}s`,
          '--border-width': `${borderWidth}px`,
          '--color-from': colorFrom,
          '--color-to': colorTo,
          '--delay': `-${delay}s`,
        } as React.CSSProperties
      }
      className={cn(
        'pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden',
        className
      )}
    >
      <div
        className="absolute -inset-[100%] m-auto aspect-square animate-spin [background:conic-gradient(from_0deg,transparent_0_300deg,var(--color-from)_330deg,var(--color-to)_360deg)] opacity-80"
        style={{
          width: '250%',
          height: '250%',
          animationDuration: `${duration}s`,
        }}
      />
      {/* Moldura interna que preserva apenas a linha da borda */}
      <div className="absolute inset-[1.5px] rounded-[calc(1.5rem-1.5px)] bg-zinc-900/90 backdrop-blur-xl" />
    </div>
  );
};
