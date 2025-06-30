'use client';

import { m } from 'framer-motion';
import { ReactNode } from 'react';
import { buttonHover, buttonTap } from '@/lib/animations';

interface AnimatedButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
}

const variantStyles = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:outline-indigo-600',
  secondary: 'bg-white text-indigo-600 border border-indigo-600 hover:bg-indigo-50',
  ghost: 'text-indigo-600 hover:bg-indigo-50',
};

export default function AnimatedButton({
  children,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  variant = 'primary',
}: AnimatedButtonProps) {
  const baseClasses = 'rounded-md px-4 py-2 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200';
  const variantClasses = variantStyles[variant];

  return (
    <m.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses} ${className}`}
      whileHover={disabled ? {} : buttonHover as any}
      whileTap={disabled ? {} : buttonTap as any}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
    >
      {children}
    </m.button>
  );
}