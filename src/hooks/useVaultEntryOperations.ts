
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { encryptPassword, decryptPassword } from '@/utils/encryption';
import { PasswordEntry, FormData } from '@/types/vault';
import { useVaultPasswordGeneration } from './useVaultPasswordGeneration';

interface UseVaultEntryOperationsProps {
  masterPassword: string | null;
  setEntries: (entries: PasswordEntry[]) => void;
  setFormData: (data: FormData) => void;
  setEditingEntry: (entry: PasswordEntry | null) => void;
  setShowForm: (show: boolean) => void;
  startLockTimer: () => void;
}

export const useVaultEntryOperations = ({
  masterPassword,
  setEntries,
  setFormData,
  setEditingEntry,
  setShowForm,
  startLockTimer,
}: UseVaultEntryOperationsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { generateNewPassword } = useVaultPasswordGeneration();

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
      if (error) { 
        toast({ title: "Error", description: "Failed to save password entry", variant: "destructive" }); 
        return; 
      }
      toast({ title: "Success", description: editingEntry ? "Password updated" : "Password saved" });
      await fetchEntries();
      startLockTimer();
      return true;
    } catch (error) { 
      toast({ title: "Error", description: "Failed to encrypt password", variant: "destructive" }); 
      return false; 
    }
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
      setFormData({ 
        title: entry.title, 
        username: entry.username, 
        password: decryptedPassword, 
        website: entry.website, 
        notes: entry.notes, 
        group_id: entry.group_id || '', 
        expiration_days: expirationDays 
      });
      setEditingEntry(entry);
      setShowForm(true);
      startLockTimer();
    } catch (error) { 
      toast({ title: "Error", description: "Failed to decrypt password", variant: "destructive" }); 
    }
  }, [masterPassword, setFormData, setEditingEntry, setShowForm, startLockTimer, toast]);

  const deleteEntry = useCallback(async (id: string) => {
    const { error } = await supabase.from('password_entries').delete().eq('id', id);
    if (error) { 
      toast({ title: "Error", description: "Failed to delete password entry", variant: "destructive" }); 
      return; 
    }
    toast({ title: "Success", description: "Password deleted" });
    fetchEntries();
    startLockTimer();
  }, [toast, fetchEntries, startLockTimer]);

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
      const { error } = await supabase.from('password_entries').update({ 
        password_encrypted: encryptedPassword, 
        expires_at: expiresAt, 
        is_expired: false, 
        updated_at: new Date().toISOString() 
      }).eq('id', entry.id);
      if (error) { 
        toast({ title: "Error", description: "Failed to regenerate password", variant: "destructive" }); 
        return; 
      }
      toast({ title: "Success", description: "Password regenerated successfully" });
      fetchEntries();
      startLockTimer();
    } catch (error) { 
      toast({ title: "Error", description: "Failed to regenerate password", variant: "destructive" }); 
    }
  }, [masterPassword, user, generateNewPassword, toast, fetchEntries, startLockTimer]);

  return {
    fetchEntries,
    fetchGroups,
    saveEntry,
    editEntry,
    deleteEntry,
    regeneratePassword,
  };
};
