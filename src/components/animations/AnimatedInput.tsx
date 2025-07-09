'use client';

import { m } from 'framer-motion';
import { useState } from 'react';

interface AnimatedInputProps {
  type?: string;
  name?: string;
  id?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  label?: string;
}

export default function AnimatedInput({
  type = 'text',
  name,
  id,
  value,
  onChange,
  placeholder,
  required = false,
  className = '',
  label,
}: AnimatedInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const baseClasses = 'block w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 shadow-sm';

  return (
    <div className="relative">
      {label && (
        <m.label
          htmlFor={id}
          className="block text-sm font-medium text-gray-900 mb-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {label}
        </m.label>
      )}
      <m.input
        type={type}
        name={name}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`${baseClasses} ${className}`}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        whileFocus={{
          scale: 1.02,
          borderColor: '#a855f7',
          transition: { duration: 0.2 }
        }}
        animate={isFocused ? {
          boxShadow: '0 0 0 3px rgba(168, 85, 247, 0.1)',
        } : {
          boxShadow: '0 0 0 0px rgba(168, 85, 247, 0)',
        }}
        transition={{ duration: 0.2 }}
      />
    </div>
  );
}