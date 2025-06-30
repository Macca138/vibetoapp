'use client';

import { useEffect, useState } from 'react';

// Hook to detect reduced motion preference
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

// Hook for performance-optimized animations
export function useOptimizedAnimation(animation: Record<string, unknown>) {
  const prefersReducedMotion = useReducedMotion();
  
  if (prefersReducedMotion) {
    return {
      initial: { opacity: 1 },
      animate: { opacity: 1 },
      transition: { duration: 0.01 },
    };
  }
  
  return animation;
}

// Hook for scroll-triggered animations with performance optimizations
export function useScrollAnimation() {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    return () => observer.disconnect();
  }, []);

  return {
    shouldAnimate: isIntersecting && !prefersReducedMotion,
    prefersReducedMotion,
  };
}