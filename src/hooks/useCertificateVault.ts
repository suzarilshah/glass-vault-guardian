
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CertificateEntry, CertificateGroup, CertificateFormData } from '@/types/certificateVault';
import { useCertificateVaultState } from './useCertificateVaultState';
import { useCertificateVaultTimer } from './useCertificateVaultTimer';
import { useCertificateVaultOperations } from './useCertificateVaultOperations';

interface UseCertificateVaultProps {
  masterPassword?: string | null;
  onMasterPasswordSet?: (password: string | null) => void;
  useUnifiedPassword?: boolean;
  unifiedLockTimeoutMinutes?: number;
  onUnifiedTimeoutChange?: (minutes: number) => void;
  onUnifiedMasterPasswordClear?: () => void;
}

export const useCertificateVault = ({ 
  masterPassword: propMasterPassword, 
  onMasterPasswordSet,
  useUnifiedPassword = false,
  unifiedLockTimeoutMinutes,
  onUnifiedTimeoutChange,
  onUnifiedMasterPasswordClear
}: UseCertificateVaultProps) => {
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
    handleShowForm,
    resetForm,
  } = useCertificateVaultState();

  const {
    lockTimeoutMinutes,
    remainingTime,
    startLockTimer,
    manualLockVault,
    handleTimeoutChange,
  } = useCertificateVaultTimer({
    masterPassword,
    setMasterPassword,
    setShowForm,
    setEditingEntry,
    onMasterPasswordSet,
    unifiedLockTimeoutMinutes,
    onUnifiedTimeoutChange,
    onUnifiedMasterPasswordClear,
    useUnifiedPassword,
  });

  const {
    fetchEntries,
    fetchGroups,
    handleMasterPasswordSubmit: baseHandleMasterPasswordSubmit,
    saveEntry: baseSaveEntry,
    editEntry,
    deleteEntry,
    exportCertificates: baseExportCertificates,
  } = useCertificateVaultOperations({
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

  const saveEntry = useCallback(async () => {
    const result = await baseSaveEntry(formData, editingEntry);
    if (result) {
      resetForm();
    }
  }, [baseSaveEntry, formData, editingEntry, resetForm]);

  const exportCertificates = useCallback(async () => {
    await baseExportCertificates(entries, groups);
  }, [baseExportCertificates, entries, groups]);

  const handleFetchGroups = useCallback(async () => {
    const fetchedGroups = await fetchGroups();
    setGroups(fetchedGroups);
  }, [fetchGroups, setGroups]);

  useEffect(() => { setMasterPassword(propMasterPassword || null); }, [propMasterPassword, setMasterPassword]);

  useEffect(() => {
    const checkMasterPassword = async () => {
      if (!user) return;
      
      // Skip checking if we're using unified password and already have it
      if (useUnifiedPassword && propMasterPassword) {
        return;
      }
      
      const { data, error } = await supabase.from('user_master_passwords').select('*').eq('user_id', user.id).maybeSingle();
      if (error) { console.error('Error checking master password:', error); return; }
      setShowMasterModal(true);
      if (!data) setIsCreatingMaster(true);
    };
    if (user && !masterPassword) checkMasterPassword();
  }, [user, masterPassword, setShowMasterModal, setIsCreatingMaster, useUnifiedPassword, propMasterPassword]);

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
  
  const expiredEntries = useMemo(() => entries.filter(entry => entry.is_expired), [entries]);
  
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
    remainingTime,
    setShowMasterModal,
    setEditingEntry,
    setShowForm,
    setShowGroupManager,
    setShowTimerSettings,
    setSelectedGroup,
    setFormData,
    handleMasterPasswordSubmit,
    handleTimeoutChange,
    fetchGroups: handleFetchGroups,
    fetchEntries,
    saveEntry,
    editEntry,
    deleteEntry,
    exportCertificates,
    filteredEntries,
    expiredEntries,
    groupStats,
    ungroupedCount,
    handleShowForm,
    manualLockVault,
  };
};
