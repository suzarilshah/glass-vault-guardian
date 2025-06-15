
import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseCertificateVaultTimerProps {
  masterPassword: string | null;
  setMasterPassword: (password: string | null) => void;
  setShowForm: (show: boolean) => void;
  setEditingEntry: (entry: any) => void;
  onMasterPasswordSet?: (password: string | null) => void;
}

export const useCertificateVaultTimer = ({
  masterPassword,
  setMasterPassword,
  setShowForm,
  setEditingEntry,
  onMasterPasswordSet,
}: UseCertificateVaultTimerProps) => {
  const [lockTimeoutMinutes, setLockTimeoutMinutes] = useState<number>(5);
  const [lockTimer, setLockTimer] = useState<NodeJS.Timeout | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [countdownInterval, setCountdownInterval] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const startLockTimer = useCallback(() => {
    if (lockTimer) clearTimeout(lockTimer);
    if (countdownInterval) clearInterval(countdownInterval);

    const timeoutMs = lockTimeoutMinutes * 60 * 1000;
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
      setMasterPassword(null);
      setShowForm(false);
      setEditingEntry(null);
      onMasterPasswordSet?.(null);
      toast({ 
        title: "Vault Locked", 
        description: "Your certificate vault has been automatically locked for security", 
        variant: "destructive" 
      });
    }, timeoutMs);
    setLockTimer(newTimer);
  }, [lockTimeoutMinutes, onMasterPasswordSet, toast, setMasterPassword, setShowForm, setEditingEntry]);

  const manualLockVault = useCallback(() => {
    if (lockTimer) clearTimeout(lockTimer);
    if (countdownInterval) clearInterval(countdownInterval);
    setMasterPassword(null);
    setShowForm(false);
    setEditingEntry(null);
    onMasterPasswordSet?.(null);
    toast({ 
      title: "Vault Locked", 
      description: "Your certificate vault has been manually locked.", 
      variant: "destructive" 
    });
  }, [lockTimer, countdownInterval, onMasterPasswordSet, toast, setMasterPassword, setShowForm, setEditingEntry]);

  const handleTimeoutChange = useCallback((minutes: number) => {
    setLockTimeoutMinutes(minutes);
    if (masterPassword) startLockTimer();
  }, [masterPassword, startLockTimer]);

  useEffect(() => {
    if (masterPassword) {
      startLockTimer();
    }
  }, [masterPassword, startLockTimer]);

  useEffect(() => {
    return () => {
      if (lockTimer) clearTimeout(lockTimer);
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, [lockTimer, countdownInterval]);

  return {
    lockTimeoutMinutes,
    remainingTime,
    startLockTimer,
    manualLockVault,
    handleTimeoutChange,
  };
};
