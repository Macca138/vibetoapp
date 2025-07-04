import { useEffect, useRef, useState, useCallback } from 'react';
import { debounce } from '@/lib/utils';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions {
  onSave: (data: any) => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  status: AutoSaveStatus;
  error: Error | null;
  triggerSave: () => void;
  lastSaved: Date | null;
}

export function useAutoSave(
  data: any,
  options: UseAutoSaveOptions
): UseAutoSaveReturn {
  const { onSave, delay = 2000, enabled = true } = options;
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Store the latest data in a ref to avoid stale closures
  const dataRef = useRef(data);
  dataRef.current = data;
  
  // Track if component is mounted
  const isMountedRef = useRef(true);
  
  // Create the save function
  const performSave = useCallback(async () => {
    if (!enabled || !isMountedRef.current) return;
    
    try {
      setStatus('saving');
      setError(null);
      
      await onSave(dataRef.current);
      
      if (isMountedRef.current) {
        setStatus('saved');
        setLastSaved(new Date());
        
        // Reset to idle after a short delay
        setTimeout(() => {
          if (isMountedRef.current) {
            setStatus('idle');
          }
        }, 2000);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err as Error);
        setStatus('error');
        console.error('Auto-save error:', err);
      }
    }
  }, [onSave, enabled]);
  
  // Create debounced save function
  const debouncedSave = useRef(
    debounce(performSave, delay)
  ).current;
  
  // Trigger save when data changes
  useEffect(() => {
    if (!enabled) return;
    
    // Skip initial render
    const isInitialRender = lastSaved === null && status === 'idle';
    if (isInitialRender) return;
    
    debouncedSave();
  }, [data, enabled, debouncedSave]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      debouncedSave.cancel();
    };
  }, [debouncedSave]);
  
  // Manual trigger function
  const triggerSave = useCallback(() => {
    debouncedSave.cancel();
    performSave();
  }, [debouncedSave, performSave]);
  
  return {
    status,
    error,
    triggerSave,
    lastSaved,
  };
}

// Helper hook for auto-saving form data
export function useFormAutoSave<T extends Record<string, any>>(
  formData: T,
  saveEndpoint: string,
  options?: {
    delay?: number;
    enabled?: boolean;
    method?: 'PUT' | 'PATCH' | 'POST';
  }
) {
  const { delay = 2000, enabled = true, method = 'PUT' } = options || {};
  
  const onSave = useCallback(async (data: T) => {
    const response = await fetch(saveEndpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save');
    }
  }, [saveEndpoint, method]);
  
  return useAutoSave(formData, {
    onSave,
    delay,
    enabled,
  });
}