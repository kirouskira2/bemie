import React, { useRef, useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface BlurFadeProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
  yOffset?: number;
  inView?: boolean;
}

export function BlurFade({
  children,
  className,
  duration = 0.45,
  delay = 0,
  yOffset = 8,
  inView = true,
}: BlurFadeProps) {
  const [hasAppeared, setHasAppeared] = useState(!inView);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!inView) {
      setHasAppeared(true);
      return;
    }

    const timer = setTimeout(() => {
      setHasAppeared(true);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [inView, delay]);

  return (
    <div
      ref={elementRef}
      style={{
        transitionProperty: 'opacity, filter, transform',
        transitionDuration: `${duration}s`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: hasAppeared ? 1 : 0,
        filter: hasAppeared ? 'blur(0px)' : 'blur(6px)',
        transform: hasAppeared ? 'translateY(0px)' : `translateY(${yOffset}px)`,
      }}
      className={cn('will-change-[transform,opacity,filter]', className)}
    >
      {children}
    </div>
  );
}
