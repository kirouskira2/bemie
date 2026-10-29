import confetti from 'canvas-confetti';

export interface ConfettiOptions {
  particleCount?: number;
  spread?: number;
  origin?: { x: number; y: number };
  colors?: string[];
}

/**
 * Dispara confetes com a paleta refinada da Bemiê (Dourado, Champagne, Areia, Branco)
 */
export function fireBemieConfetti(options?: ConfettiOptions) {
  const count = options?.particleCount ?? 60;
  const defaults = {
    origin: options?.origin ?? { y: 0.7 },
    spread: options?.spread ?? 70,
    colors: options?.colors ?? ['#C5A880', '#D4AF37', '#E5D5C0', '#FAFAF9', '#2A2826'],
    disableForReducedMotion: true,
  };

  confetti({
    ...defaults,
    particleCount: Math.floor(count * 0.25),
    scalar: 1.1,
  });

  confetti({
    ...defaults,
    particleCount: Math.floor(count * 0.35),
    spread: (options?.spread ?? 70) + 30,
  });

  confetti({
    ...defaults,
    particleCount: Math.floor(count * 0.4),
    scalar: 0.8,
  });
}
