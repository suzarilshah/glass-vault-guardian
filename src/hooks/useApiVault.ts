
import { useEffect, useCallback, useMemo } from 'react';
import { ApiEntry, ApiGroup } from '@/types/apiVault';
import { useApiVaultState } from './useApiVaultState';
import { useApiVaultOperations } from './useApiVaultOperations';

interface UseApiVaultProps {
  masterPassword: string | null;
}

export const useApiVault = ({ masterPassword }: UseApiVaultProps) => {
  const {
    entries,
    setEntries,
    groups,
    setGroups,
    editingEntry,
    setEditingEntry,
    showForm,
    setShowForm,
    showGroupManager,
    setShowGroupManager,
    selectedGroup,
    setSelectedGroup,
    formData,
    setFormData,
    visibleApiKeys,
    setVisibleApiKeys,
    handleShowForm,
    resetForm,
  } = useApiVaultState();

  const {
    fetchEntries,
    fetchGroups,
    saveEntry: baseSaveEntry,
    editEntry,
    deleteEntry,
    copyApiKey,
    toggleApiKeyVisibility: baseToggleApiKeyVisibility,
  } = useApiVaultOperations({
    masterPassword,
    setEntries,
    setFormData,
    setEditingEntry,
    setShowForm,
  });

  const saveEntry = useCallback(async () => {
    const result = await baseSaveEntry(formData, editingEntry);
    if (result) {
      resetForm();
    }
  }, [baseSaveEntry, formData, editingEntry, resetForm]);

  const toggleApiKeyVisibility = useCallback((id: string) => {
    baseToggleApiKeyVisibility(id, visibleApiKeys, setVisibleApiKeys);
  }, [baseToggleApiKeyVisibility, visibleApiKeys, setVisibleApiKeys]);

  const handleFetchGroups = useCallback(async () => {
    const fetchedGroups = await fetchGroups();
    setGroups(fetchedGroups);
  }, [fetchGroups, setGroups]);

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

  const expiredEntries = useMemo(() => 
    entries.filter(entry => entry.is_expired), 
    [entries]
  );

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
    editingEntry,
    showForm,
    showGroupManager,
    selectedGroup,
    formData,
    visibleApiKeys,
    setEditingEntry,
    setShowForm,
    setShowGroupManager,
    setSelectedGroup,
    setFormData,
    fetchGroups: handleFetchGroups,
    saveEntry,
    editEntry,
    deleteEntry,
    copyApiKey,
    toggleApiKeyVisibility,
    filteredEntries,
    expiredEntries,
    groupStats,
    ungroupedCount,
    handleShowForm,
  };
};
