
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { decryptPassword } from '@/utils/encryption';
import { PasswordEntry } from '@/types/vault';

interface UseVaultExportProps {
  masterPassword: string | null;
  startLockTimer: () => void;
}

export const useVaultExport = ({ masterPassword, startLockTimer }: UseVaultExportProps) => {
  const { toast } = useToast();

  const exportPasswords = useCallback(async (entries: PasswordEntry[], groups: any[]) => {
    if (!masterPassword) return;
    try {
      const decryptedEntries = entries.map(entry => ({ 
        title: entry.title, 
        username: entry.username, 
        password: decryptPassword(entry.password_encrypted, masterPassword), 
        website: entry.website, 
        notes: entry.notes, 
        group: groups.find(g => g.id === entry.group_id)?.name || '', 
        expires_at: entry.expires_at || '', 
        is_expired: entry.is_expired 
      }));
      const csvContent = [
        'Title,Username,Password,Website,Notes,Group,Expires At,Is Expired', 
        ...decryptedEntries.map(entry => `"${entry.title}","${entry.username}","${entry.password}","${entry.website}","${entry.notes}","${entry.group}","${entry.expires_at}","${entry.is_expired}"`)
      ].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'passwords_export.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Success", description: "Passwords exported to CSV" });
      startLockTimer();
    } catch (error) { 
      toast({ title: "Error", description: "Failed to export passwords", variant: "destructive" }); 
    }
  }, [masterPassword, toast, startLockTimer]);

  return {
    exportPasswords,
  };
};
