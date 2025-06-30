'use client';

import { m } from 'framer-motion';
import { useInViewAnimation } from '@/lib/animations';
import { ReactNode } from 'react';
import { Variants } from 'framer-motion';

interface AnimatedContainerProps {
  children: ReactNode;
  variants?: Variants;
  className?: string;
  delay?: number;
}

export default function AnimatedContainer({ 
  children, 
  variants, 
  className = '',
  delay = 0 
}: AnimatedContainerProps) {
  const inViewProps = useInViewAnimation();

  return (
    <m.div
      className={className}
      variants={variants}
      transition={{ delay }}
      {...inViewProps}
    >
      {children}
    </m.div>
  );
}