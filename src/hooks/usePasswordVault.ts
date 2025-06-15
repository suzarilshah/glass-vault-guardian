import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PasswordEntry, FormData, Group } from '@/types/vault';
import { useVaultState } from './useVaultState';
import { useVaultTimer } from './useVaultTimer';
import { useVaultOperations } from './useVaultOperations';

interface UsePasswordVaultProps {
  masterPassword?: string | null;
  onMasterPasswordSet?: (password: string | null) => void;
  useUnifiedPassword?: boolean;
  unifiedLockTimeoutMinutes?: number;
  onUnifiedTimeoutChange?: (minutes: number) => void;
}

export const usePasswordVault = ({ 
  masterPassword: propMasterPassword, 
  onMasterPasswordSet,
  useUnifiedPassword = false,
  unifiedLockTimeoutMinutes,
  onUnifiedTimeoutChange
}: UsePasswordVaultProps) => {
  const { user } = useAuth();
  const {
    entries,
    setEntries,
    groups,
    setGroups,
    masterPassword,
    setMasterPassword,
    showMasterModal,
    setShowMasterModal,
    isCreatingMaster,
    setIsCreatingMaster,
    editingEntry,
    setEditingEntry,
    showForm,
    setShowForm,
    showGroupManager,
    setShowGroupManager,
    showTimerSettings,
    setShowTimerSettings,
    selectedGroup,
    setSelectedGroup,
    formData,
    setFormData,
    visiblePasswords,
    setVisiblePasswords,
    handleShowForm,
    resetForm,
  } = useVaultState();

  const {
    lockTimeoutMinutes,
    remainingTime,
    startLockTimer,
    manualLockVault,
    handleTimeoutChange,
  } = useVaultTimer({
    masterPassword,
    setMasterPassword,
    setShowForm,
    setEditingEntry,
    onMasterPasswordSet,
    setVisiblePasswords,
  });

  const {
    fetchEntries,
    fetchGroups,
    handleMasterPasswordSubmit: baseHandleMasterPasswordSubmit,
    generateNewPassword: baseGenerateNewPassword,
    saveEntry: baseSaveEntry,
    editEntry,
    deleteEntry,
    copyPassword,
    regeneratePassword,
    togglePasswordVisibility,
    exportPasswords: baseExportPasswords,
  } = useVaultOperations({
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
  });

  const handleMasterPasswordSubmit = useCallback(async (password: string) => {
    await baseHandleMasterPasswordSubmit(password, isCreatingMaster);
  }, [baseHandleMasterPasswordSubmit, isCreatingMaster]);

  const generateNewPassword = useCallback(async (length: number = 16) => {
    const newPassword = await baseGenerateNewPassword(length);
    setFormData(prev => ({ ...prev, password: newPassword }));
  }, [baseGenerateNewPassword, setFormData]);

  const saveEntry = useCallback(async () => {
    const result = await baseSaveEntry(formData, editingEntry);
    if (result) {
      resetForm();
    }
  }, [baseSaveEntry, formData, editingEntry, resetForm]);

  const exportPasswords = useCallback(async () => {
    await baseExportPasswords(entries, groups);
  }, [baseExportPasswords, entries, groups]);

  const handleFetchGroups = useCallback(async () => {
    const fetchedGroups = await fetchGroups();
    setGroups(fetchedGroups);
  }, [fetchGroups, setGroups]);

  useEffect(() => { setMasterPassword(propMasterPassword || null); }, [propMasterPassword, setMasterPassword]);

  useEffect(() => {
    const checkMasterPassword = async () => {
      if (!user) return;
      const { data, error } = await supabase.from('user_master_passwords').select('*').eq('user_id', user.id).maybeSingle();
      if (error) { console.error('Error checking master password:', error); return; }
      setShowMasterModal(true);
      if (!data) setIsCreatingMaster(true);
    };
    if (user && !masterPassword) checkMasterPassword();
  }, [user, masterPassword, setShowMasterModal, setIsCreatingMaster]);

  useEffect(() => {
    if (masterPassword) {
      fetchEntries();
      handleFetchGroups();
    }
  }, [masterPassword, fetchEntries, handleFetchGroups]);

  const filteredEntries = useMemo(() => 
    selectedGroup === 'all' ? entries : entries.filter(entry => entry.group_id === selectedGroup), 
    [entries, selectedGroup]
  );
  
  const expiredEntries = useMemo(() => entries.filter(entry => entry.expiration_days && parseInt(entry.expiration_days) > 0 && (new Date(Date.now() + parseInt(entry.expiration_days) * 24 * 60 * 60 * 1000) < new Date())), [entries]);
  
  const { groupStats, ungroupedCount } = useMemo(() => {
    const stats = groups.map(group => ({ 
      ...group, 
      count: entries.filter(entry => entry.group_id === group.id).length 
    }));
    const ungroupedCount = entries.filter(entry => !entry.group_id).length;
    return { groupStats: stats, ungroupedCount };
  }, [groups, entries]);

  return {
    entries,
    groups,
    masterPassword,
    showMasterModal,
    isCreatingMaster,
    editingEntry,
    showForm,
    showGroupManager,
    showTimerSettings,
    selectedGroup,
    lockTimeoutMinutes,
    formData,
    visiblePasswords,
    remainingTime,
    setShowMasterModal,
    setEditingEntry,
    setShowForm,
    setShowGroupManager,
    setShowTimerSettings,
    setSelectedGroup,
    setFormData,
    setVisiblePasswords,
    handleMasterPasswordSubmit,
    handleTimeoutChange,
    fetchGroups: handleFetchGroups,
    generateNewPassword,
    saveEntry,
    editEntry,
    deleteEntry,
    copyPassword,
    regeneratePassword,
    togglePasswordVisibility,
    exportPasswords,
    filteredEntries,
    expiredEntries,
    groupStats,
    ungroupedCount,
    handleShowForm,
    manualLockVault,
  };
};
