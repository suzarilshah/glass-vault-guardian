
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { encryptPassword, decryptPassword, hashMasterPassword } from '@/utils/encryption';
import { PasswordEntry, FormData } from '@/types/vault';

interface UseVaultOperationsProps {
  masterPassword: string | null;
  setEntries: (entries: PasswordEntry[]) => void;
  setMasterPassword: (password: string | null) => void;
  setShowMasterModal: (show: boolean) => void;
  setIsCreatingMaster: (creating: boolean) => void;
  setFormData: (data: FormData) => void;
  setEditingEntry: (entry: PasswordEntry | null) => void;
  setShowForm: (show: boolean) => void;
  startLockTimer: () => void;
  lockTimeoutMinutes: number;
  onMasterPasswordSet?: (password: string | null) => void;
}

export const useVaultOperations = ({
  masterPassword,
  setEntries,
  setMasterPassword,
  setShowMasterModal,
  setIsCreatingMaster,
  setFormData,
  setEditingEntry,
  setShowForm,
  startLockTimer,
  lockTimeoutMinutes,
  onMasterPasswordSet,
}: UseVaultOperationsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchEntries = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('password_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) {
      toast({ title: "Error", description: "Failed to fetch password entries", variant: "destructive" });
    } else {
      setEntries(data || []);
    }
  }, [user, toast, setEntries]);

  const fetchGroups = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('password_groups').select('*').eq('user_id', user.id).order('name');
    if (!error && data) return data;
    return [];
  }, [user]);

  const handleMasterPasswordSubmit = useCallback(async (password: string, isCreatingMaster: boolean) => {
    const hashedPassword = hashMasterPassword(password);
    if (isCreatingMaster) {
      const { error } = await supabase.from('user_master_passwords').insert({ user_id: user?.id, master_password_hash: hashedPassword });
      if (error) { toast({ title: "Error", description: "Failed to set master password", variant: "destructive" }); return; }
      setMasterPassword(password);
      setShowMasterModal(false);
      setIsCreatingMaster(false);
      onMasterPasswordSet?.(password);
      toast({ title: "Success", description: "Master password set successfully" });
    } else {
      const { data, error } = await supabase.from('user_master_passwords').select('master_password_hash').eq('user_id', user?.id).single();
      if (error || !data) { toast({ title: "Error", description: "Failed to verify master password", variant: "destructive" }); return; }
      if (data.master_password_hash === hashedPassword) {
        setMasterPassword(password);
        setShowMasterModal(false);
        onMasterPasswordSet?.(password);
        toast({ title: "Success", description: `Vault unlocked (auto-lock in ${lockTimeoutMinutes} minutes)` });
      } else {
        toast({ title: "Error", description: "Incorrect master password", variant: "destructive" });
      }
    }
  }, [user, toast, setMasterPassword, setShowMasterModal, setIsCreatingMaster, onMasterPasswordSet, lockTimeoutMinutes]);

  const generateNewPassword = useCallback(() => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let newPassword = '';
    for (let i = 0; i < 16; i++) newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    return newPassword;
  }, []);

  const saveEntry = useCallback(async (formData: FormData, editingEntry: PasswordEntry | null) => {
    if (!masterPassword) return;
    try {
      const encryptedPassword = encryptPassword(formData.password, masterPassword);
      let expiresAt = null;
      if (formData.expiration_days && parseInt(formData.expiration_days) > 0) {
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + parseInt(formData.expiration_days));
        expiresAt = expDate.toISOString();
      }
      const entryData = {
        user_id: user?.id,
        title: formData.title,
        username: formData.username,
        password_encrypted: encryptedPassword,
        website: formData.website,
        notes: formData.notes,
        group_id: formData.group_id || null,
        expires_at: expiresAt,
        is_expired: false
      };
      let error;
      if (editingEntry) {
        await supabase
          .from('password_histories')
          .insert({
            entry_id: editingEntry.id,
            user_id: user?.id,
            password_encrypted: editingEntry.password_encrypted,
            changed_at: new Date().toISOString(),
          });
        ({ error } = await supabase.from('password_entries').update(entryData).eq('id', editingEntry.id));
      } else {
        ({ error } = await supabase.from('password_entries').insert(entryData));
      }
      if (error) { toast({ title: "Error", description: "Failed to save password entry", variant: "destructive" }); return; }
      toast({ title: "Success", description: editingEntry ? "Password updated" : "Password saved" });
      await fetchEntries();
      startLockTimer();
      return true;
    } catch (error) { toast({ title: "Error", description: "Failed to encrypt password", variant: "destructive" }); return false; }
  }, [masterPassword, user, toast, fetchEntries, startLockTimer]);

  const editEntry = useCallback((entry: PasswordEntry) => {
    if (!masterPassword) return;
    try {
      const decryptedPassword = decryptPassword(entry.password_encrypted, masterPassword);
      let expirationDays = '';
      if (entry.expires_at) {
        const expDate = new Date(entry.expires_at);
        const today = new Date();
        const diffTime = expDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 0) expirationDays = diffDays.toString();
      }
      setFormData({ title: entry.title, username: entry.username, password: decryptedPassword, website: entry.website, notes: entry.notes, group_id: entry.group_id || '', expiration_days: expirationDays });
      setEditingEntry(entry);
      setShowForm(true);
      startLockTimer();
    } catch (error) { toast({ title: "Error", description: "Failed to decrypt password", variant: "destructive" }); }
  }, [masterPassword, setFormData, setEditingEntry, setShowForm, startLockTimer, toast]);

  const deleteEntry = useCallback(async (id: string) => {
    const { error } = await supabase.from('password_entries').delete().eq('id', id);
    if (error) { toast({ title: "Error", description: "Failed to delete password entry", variant: "destructive" }); return; }
    toast({ title: "Success", description: "Password deleted" });
    fetchEntries();
    startLockTimer();
  }, [toast, fetchEntries, startLockTimer]);

  const copyPassword = useCallback(async (entry: PasswordEntry) => {
    if (!masterPassword) return;
    try {
      const decryptedPassword = decryptPassword(entry.password_encrypted, masterPassword);
      await navigator.clipboard.writeText(decryptedPassword);
      toast({ title: "Copied", description: "Password copied to clipboard" });
      startLockTimer();
    } catch (error) { toast({ title: "Error", description: "Failed to copy password", variant: "destructive" }); }
  }, [masterPassword, toast, startLockTimer]);

  const regeneratePassword = useCallback(async (entry: PasswordEntry) => {
    if (!masterPassword) return;
    try {
      await supabase
        .from('password_histories')
        .insert({
          entry_id: entry.id,
          user_id: user?.id,
          password_encrypted: entry.password_encrypted,
          changed_at: new Date().toISOString(),
        });
      const newPassword = generateNewPassword();
      const encryptedPassword = encryptPassword(newPassword, masterPassword);
      let expiresAt = entry.expires_at;
      if (entry.expires_at) {
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + 90);
        expiresAt = expDate.toISOString();
      }
      const { error } = await supabase.from('password_entries').update({ password_encrypted: encryptedPassword, expires_at: expiresAt, is_expired: false, updated_at: new Date().toISOString() }).eq('id', entry.id);
      if (error) { toast({ title: "Error", description: "Failed to regenerate password", variant: "destructive" }); return; }
      toast({ title: "Success", description: "Password regenerated successfully" });
      fetchEntries();
      startLockTimer();
    } catch (error) { toast({ title: "Error", description: "Failed to regenerate password", variant: "destructive" }); }
  }, [masterPassword, user, generateNewPassword, toast, fetchEntries, startLockTimer]);

  const togglePasswordVisibility = useCallback((id: string, visiblePasswords: Set<string>, setVisiblePasswords: (passwords: Set<string>) => void) => {
    const newVisible = new Set(visiblePasswords);
    if (newVisible.has(id)) newVisible.delete(id);
    else newVisible.add(id);
    setVisiblePasswords(newVisible);
    startLockTimer();
  }, [startLockTimer]);

  const exportPasswords = useCallback(async (entries: PasswordEntry[], groups: any[]) => {
    if (!masterPassword) return;
    try {
      const decryptedEntries = entries.map(entry => ({ title: entry.title, username: entry.username, password: decryptPassword(entry.password_encrypted, masterPassword), website: entry.website, notes: entry.notes, group: groups.find(g => g.id === entry.group_id)?.name || '', expires_at: entry.expires_at || '', is_expired: entry.is_expired }));
      const csvContent = ['Title,Username,Password,Website,Notes,Group,Expires At,Is Expired', ...decryptedEntries.map(entry => `"${entry.title}","${entry.username}","${entry.password}","${entry.website}","${entry.notes}","${entry.group}","${entry.expires_at}","${entry.is_expired}"`)].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'passwords_export.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Success", description: "Passwords exported to CSV" });
      startLockTimer();
    } catch (error) { toast({ title: "Error", description: "Failed to export passwords", variant: "destructive" }); }
  }, [masterPassword, toast, startLockTimer]);

  return {
    fetchEntries,
    fetchGroups,
    handleMasterPasswordSubmit,
    generateNewPassword,
    saveEntry,
    editEntry,
    deleteEntry,
    copyPassword,
    regeneratePassword,
    togglePasswordVisibility,
    exportPasswords,
  };
};
