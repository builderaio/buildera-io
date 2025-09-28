import { useRef, useEffect } from 'react';

interface UseAutoSaveOptions {
  delay?: number;
  onSave: (data: any) => Promise<void>;
  enabled?: boolean;
}

export const useAutoSave = ({ 
  delay = 3000, 
  onSave, 
  enabled = true 
}: UseAutoSaveOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dataRef = useRef<any>(null);

  const triggerSave = (data: any) => {
    if (!enabled) return;
    
    dataRef.current = data;
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      try {
        await onSave(dataRef.current);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, delay);
  };

  const forceSave = async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (dataRef.current) {
      try {
        await onSave(dataRef.current);
      } catch (error) {
        console.error('Force save failed:', error);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { triggerSave, forceSave };
};