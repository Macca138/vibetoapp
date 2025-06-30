'use client';

import { m } from 'framer-motion';
import { pageVariants, pageTransition } from '@/lib/animations';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export default function PageTransition({ children, className = '' }: PageTransitionProps) {
  return (
    <m.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition as any}
      className={className}
    >
      {children}
    </m.div>
  );
}