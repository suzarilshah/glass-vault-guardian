
import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseCertificateVaultTimerProps {
  masterPassword: string | null;
  setMasterPassword: (password: string | null) => void;
  setShowForm: (show: boolean) => void;
  setEditingEntry: (entry: any) => void;
  onMasterPasswordSet?: (password: string | null) => void;
  unifiedLockTimeoutMinutes?: number;
  onUnifiedTimeoutChange?: (minutes: number) => void;
  onUnifiedMasterPasswordClear?: () => void;
  useUnifiedPassword?: boolean;
}

export const useCertificateVaultTimer = ({
  masterPassword,
  setMasterPassword,
  setShowForm,
  setEditingEntry,
  onMasterPasswordSet,
  unifiedLockTimeoutMinutes,
  onUnifiedTimeoutChange,
  onUnifiedMasterPasswordClear,
  useUnifiedPassword = false,
}: UseCertificateVaultTimerProps) => {
  const [lockTimeoutMinutes, setLockTimeoutMinutes] = useState<number>(5);
  const [lockTimer, setLockTimer] = useState<NodeJS.Timeout | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [countdownInterval, setCountdownInterval] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Use unified timeout if available, otherwise use local timeout
  const effectiveTimeoutMinutes = useUnifiedPassword && unifiedLockTimeoutMinutes 
    ? unifiedLockTimeoutMinutes 
    : lockTimeoutMinutes;

  const startLockTimer = useCallback(() => {
    if (lockTimer) clearTimeout(lockTimer);
    if (countdownInterval) clearInterval(countdownInterval);

    const timeoutMs = effectiveTimeoutMinutes * 60 * 1000;
    const deadline = Date.now() + timeoutMs;
    setRemainingTime(timeoutMs / 1000);

    const newCountdownInterval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemainingTime(remaining);
      if (remaining === 0) clearInterval(newCountdownInterval);
    }, 1000);
    setCountdownInterval(newCountdownInterval);

    const newTimer = setTimeout(() => {
      clearInterval(newCountdownInterval);
      if (useUnifiedPassword && onUnifiedMasterPasswordClear) {
        onUnifiedMasterPasswordClear();
      } else {
        setMasterPassword(null);
        onMasterPasswordSet?.(null);
      }
      setShowForm(false);
      setEditingEntry(null);
      toast({ 
        title: "Vault Locked", 
        description: "Your certificate vault has been automatically locked for security", 
        variant: "destructive" 
      });
    }, timeoutMs);
    setLockTimer(newTimer);
  }, [effectiveTimeoutMinutes, onMasterPasswordSet, toast, setMasterPassword, setShowForm, setEditingEntry, useUnifiedPassword, onUnifiedMasterPasswordClear]);

  const manualLockVault = useCallback(() => {
    if (lockTimer) clearTimeout(lockTimer);
    if (countdownInterval) clearInterval(countdownInterval);
    
    if (useUnifiedPassword && onUnifiedMasterPasswordClear) {
      onUnifiedMasterPasswordClear();
    } else {
      setMasterPassword(null);
      onMasterPasswordSet?.(null);
    }
    setShowForm(false);
    setEditingEntry(null);
    toast({ 
      title: "Vault Locked", 
      description: "Your certificate vault has been manually locked.", 
      variant: "destructive" 
    });
  }, [lockTimer, countdownInterval, onMasterPasswordSet, toast, setMasterPassword, setShowForm, setEditingEntry, useUnifiedPassword, onUnifiedMasterPasswordClear]);

  const handleTimeoutChange = useCallback((minutes: number) => {
    if (useUnifiedPassword && onUnifiedTimeoutChange) {
      onUnifiedTimeoutChange(minutes);
    } else {
      setLockTimeoutMinutes(minutes);
    }
    if (masterPassword) startLockTimer();
  }, [masterPassword, startLockTimer, useUnifiedPassword, onUnifiedTimeoutChange]);

  useEffect(() => {
    if (masterPassword) {
      startLockTimer();
    }
  }, [masterPassword, startLockTimer, effectiveTimeoutMinutes]);

  useEffect(() => {
    return () => {
      if (lockTimer) clearTimeout(lockTimer);
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, [lockTimer, countdownInterval]);

  return {
    lockTimeoutMinutes: effectiveTimeoutMinutes,
    remainingTime,
    startLockTimer,
    manualLockVault,
    handleTimeoutChange,
  };
};
