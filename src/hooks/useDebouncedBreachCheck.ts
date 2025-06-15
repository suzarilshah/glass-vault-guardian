
import { useState, useEffect, useRef } from 'react';
import { checkPasswordBreach } from '@/utils/breachChecker';

interface BreachResult {
  isBreached: boolean;
  severity: 'low' | 'medium' | 'high';
  message: string;
  source: 'azure' | 'local';
  passwordsChecked: number;
  isLoading?: boolean;
}

export const useDebouncedBreachCheck = (password: string, delay: number = 500) => {
  const [result, setResult] = useState<BreachResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!password) {
      setResult(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    timeoutRef.current = setTimeout(async () => {
      try {
        abortControllerRef.current = new AbortController();
        
        const breachResult = await checkPasswordBreach(password);
        
        setResult(breachResult);
        setIsLoading(false);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Breach check failed:', error);
          setResult({
            isBreached: false,
            severity: 'low',
            message: 'Unable to check breach status',
            source: 'local',
            passwordsChecked: 0
          });
        }
        setIsLoading(false);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [password, delay]);

  return { result, isLoading };
};
