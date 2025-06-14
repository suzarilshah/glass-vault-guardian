
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { decryptPassword } from '@/utils/encryption';
import { PasswordEntry } from '@/types/vault';

interface UseVaultClipboardProps {
  masterPassword: string | null;
  startLockTimer: () => void;
}

export const useVaultClipboard = ({ masterPassword, startLockTimer }: UseVaultClipboardProps) => {
  const { toast } = useToast();

  const copyPassword = useCallback(async (entry: PasswordEntry) => {
    if (!masterPassword) return;
    try {
      const decryptedPassword = decryptPassword(entry.password_encrypted, masterPassword);
      await navigator.clipboard.writeText(decryptedPassword);
      toast({ title: "Copied", description: "Password copied to clipboard" });
      startLockTimer();
    } catch (error) { 
      toast({ title: "Error", description: "Failed to copy password", variant: "destructive" }); 
    }
  }, [masterPassword, toast, startLockTimer]);

  const togglePasswordVisibility = useCallback((id: string, visiblePasswords: Set<string>, setVisiblePasswords: (passwords: Set<string>) => void) => {
    const newVisible = new Set(visiblePasswords);
    if (newVisible.has(id)) newVisible.delete(id);
    else newVisible.add(id);
    setVisiblePasswords(newVisible);
    startLockTimer();
  }, [startLockTimer]);

  return {
    copyPassword,
    togglePasswordVisibility,
  };
};
