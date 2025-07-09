'use client';

import { m, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import { AutoSaveStatus } from '@/hooks/useAutoSave';

interface AutoSaveIndicatorProps {
  status: AutoSaveStatus;
  error?: Error | null;
  lastSaved?: Date | null;
  className?: string;
}

export default function AutoSaveIndicator({
  status,
  error,
  lastSaved,
  className = '',
}: AutoSaveIndicatorProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'saving':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'saved':
        return <Check className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'Saved';
      case 'error':
        return error?.message || 'Save failed';
      default:
        return lastSaved ? `Last saved ${formatTime(lastSaved)}` : '';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'saving':
        return 'text-blue-600';
      case 'saved':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-700';
    }
  };

  if (status === 'idle' && !lastSaved) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      <m.div
        key={status}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={`flex items-center space-x-2 text-sm ${getStatusColor()} ${className}`}
      >
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </m.div>
    </AnimatePresence>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) {
    return 'just now';
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}