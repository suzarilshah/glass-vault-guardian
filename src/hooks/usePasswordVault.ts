import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { encryptPassword, decryptPassword, hashMasterPassword } from '@/utils/encryption';
import { PasswordEntry, PasswordGroup, FormData } from '@/types/vault';

interface UsePasswordVaultProps {
  masterPassword?: string | null;
  onMasterPasswordSet?: (password: string | null) => void;
}

export const usePasswordVault = ({ masterPassword: propMasterPassword, onMasterPasswordSet }: UsePasswordVaultProps) => {
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [groups, setGroups] = useState<PasswordGroup[]>([]);
  const [masterPassword, setMasterPassword] = useState<string | null>(propMasterPassword || null);
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [isCreatingMaster, setIsCreatingMaster] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PasswordEntry | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [lockTimeoutMinutes, setLockTimeoutMinutes] = useState<number>(5);
  const [formData, setFormData] = useState<FormData>({
    title: '', username: '', password: '', website: '', notes: '', group_id: '', expiration_days: ''
  });
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [lockTimer, setLockTimer] = useState<NodeJS.Timeout | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [countdownInterval, setCountdownInterval] = useState<NodeJS.Timeout | null>(null);
  const { user } = useAuth();
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
      setVisiblePasswords(new Set());
      setShowForm(false);
      setEditingEntry(null);
      onMasterPasswordSet?.(null);
      toast({ title: "Vault Locked", description: "Your vault has been automatically locked for security", variant: "destructive" });
    }, timeoutMs);
    setLockTimer(newTimer);
  }, [lockTimeoutMinutes, onMasterPasswordSet, toast]);

  // Manual lock
  const manualLockVault = useCallback(() => {
    if (lockTimer) clearTimeout(lockTimer);
    if (countdownInterval) clearInterval(countdownInterval);
    setMasterPassword(null);
    setVisiblePasswords(new Set());
    setShowForm(false);
    setEditingEntry(null);
    onMasterPasswordSet?.(null);
    toast({ title: "Vault Locked", description: "Your vault has been manually locked.", variant: "destructive" });
  }, [lockTimer, countdownInterval, onMasterPasswordSet, toast]);

  const fetchEntries = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('password_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) {
      toast({ title: "Error", description: "Failed to fetch password entries", variant: "destructive" });
    } else {
      setEntries(data || []);
    }
  }, [user, toast]);

  const fetchGroups = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('password_groups').select('*').eq('user_id', user.id).order('name');
    if (!error && data) setGroups(data);
  }, [user]);

  useEffect(() => { setMasterPassword(propMasterPassword || null); }, [propMasterPassword]);

  useEffect(() => {
    const checkMasterPassword = async () => {
      if (!user) return;
      const { data, error } = await supabase.from('user_master_passwords').select('*').eq('user_id', user.id).maybeSingle();
      if (error) { console.error('Error checking master password:', error); return; }
      setShowMasterModal(true);
      if (!data) setIsCreatingMaster(true);
    };
    if (user && !masterPassword) checkMasterPassword();
  }, [user, masterPassword]);

  useEffect(() => {
    if (masterPassword) {
      fetchEntries();
      fetchGroups();
      startLockTimer();
    }
  }, [masterPassword, fetchEntries, fetchGroups, startLockTimer]);

  useEffect(() => {
    return () => {
      if (lockTimer) clearTimeout(lockTimer);
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, [lockTimer, countdownInterval]);

  const handleTimeoutChange = (minutes: number) => {
    setLockTimeoutMinutes(minutes);
    if (masterPassword) startLockTimer();
  };
  
  const handleMasterPasswordSubmit = async (password: string) => {
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
  };

  const generateNewPassword = () => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let newPassword = '';
    for (let i = 0; i < 16; i++) newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    setFormData(prev => ({ ...prev, password: newPassword }));
    return newPassword;
  };
  
  const regeneratePassword = async (entry: PasswordEntry) => {
    if (!masterPassword) return;
    try {
      // Save history before updating!
      await supabase
        .from('password_histories')
        .insert({
          entry_id: entry.id,
          user_id: user?.id,
          password_encrypted: entry.password_encrypted,
          changed_at: new Date().toISOString(),
        });
      const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
      let newPassword = '';
      for (let i = 0; i < 16; i++) newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
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
  };
  
  const saveEntry = async () => {
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
        // Save to history before updating
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
      setFormData({ title: '', username: '', password: '', website: '', notes: '', group_id: '', expiration_days: '' });
      setEditingEntry(null);
      setShowForm(false);
      await fetchEntries();
      startLockTimer();
    } catch (error) { toast({ title: "Error", description: "Failed to encrypt password", variant: "destructive" }); }
  };

  const editEntry = (entry: PasswordEntry) => {
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
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from('password_entries').delete().eq('id', id);
    if (error) { toast({ title: "Error", description: "Failed to delete password entry", variant: "destructive" }); return; }
    toast({ title: "Success", description: "Password deleted" });
    fetchEntries();
    startLockTimer();
  };

  const copyPassword = async (entry: PasswordEntry) => {
    if (!masterPassword) return;
    try {
      const decryptedPassword = decryptPassword(entry.password_encrypted, masterPassword);
      await navigator.clipboard.writeText(decryptedPassword);
      toast({ title: "Copied", description: "Password copied to clipboard" });
      startLockTimer();
    } catch (error) { toast({ title: "Error", description: "Failed to copy password", variant: "destructive" }); }
  };
  
  const togglePasswordVisibility = (id: string) => {
    const newVisible = new Set(visiblePasswords);
    if (newVisible.has(id)) newVisible.delete(id);
    else newVisible.add(id);
    setVisiblePasswords(newVisible);
    startLockTimer();
  };

  const exportPasswords = async () => {
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
  };

  const filteredEntries = useMemo(() => selectedGroup === 'all' ? entries : entries.filter(entry => entry.group_id === selectedGroup), [entries, selectedGroup]);
  const expiredEntries = useMemo(() => entries.filter(entry => entry.is_expired), [entries]);
  const { groupStats, ungroupedCount } = useMemo(() => {
    const stats = groups.map(group => ({ ...group, count: entries.filter(entry => entry.group_id === group.id).length }));
    const ungroupedCount = entries.filter(entry => !entry.group_id).length;
    return { groupStats: stats, ungroupedCount };
  }, [groups, entries]);

  const handleShowForm = () => {
    setEditingEntry(null);
    setFormData({ title: '', username: '', password: '', website: '', notes: '', group_id: '', expiration_days: '' });
    setShowForm(true);
  };
  
  return {
    entries, groups, masterPassword, showMasterModal, isCreatingMaster, editingEntry, showForm,
    showGroupManager, showTimerSettings, selectedGroup, lockTimeoutMinutes, formData, visiblePasswords, remainingTime,
    setShowMasterModal, setEditingEntry, setShowForm, setShowGroupManager, setShowTimerSettings, setSelectedGroup,
    setFormData, handleMasterPasswordSubmit, handleTimeoutChange, fetchGroups, generateNewPassword, regeneratePassword,
    saveEntry, editEntry, deleteEntry, copyPassword, togglePasswordVisibility, exportPasswords, filteredEntries,
    expiredEntries, groupStats, ungroupedCount, handleShowForm,
    manualLockVault,
  };
};
