export * from './variants';

// Animation configuration
export const animationConfig = {
  // Reduce motion for users who prefer it
  reducedMotion: {
    transition: { duration: 0.01 },
    initial: { opacity: 1 },
    animate: { opacity: 1 },
  },
  
  // Default spring configuration
  spring: {
    type: 'spring',
    damping: 25,
    stiffness: 120,
  },
  
  // Smooth easing
  easeOut: {
    type: 'tween',
    ease: 'easeOut',
    duration: 0.3,
  },
  
  // Quick transitions
  quick: {
    type: 'tween',
    duration: 0.2,
  },
  
  // Slow transitions
  slow: {
    type: 'tween',
    duration: 0.8,
  },
};

// Helper function to get reduced motion variant
export const getReducedMotionVariant = (variants: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return animationConfig.reducedMotion;
  }
  return variants;
};

// Custom hooks for common animations
export const useInViewAnimation = () => {
  return {
    initial: 'initial',
    whileInView: 'animate',
    viewport: { once: true, amount: 0.3 },
  };
};

export const useStaggerContainer = (delay = 0.1) => {
  return {
    initial: 'initial',
    animate: 'animate',
    variants: {
      initial: {},
      animate: {
        transition: {
          staggerChildren: delay,
        },
      },
    },
  };
};