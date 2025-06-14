
import { useState, useCallback } from 'react';
import { ApiEntry, ApiGroup, ApiFormData } from '@/types/apiVault';

export const useApiVaultState = () => {
  const [entries, setEntries] = useState<ApiEntry[]>([]);
  const [groups, setGroups] = useState<ApiGroup[]>([]);
  const [editingEntry, setEditingEntry] = useState<ApiEntry | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [formData, setFormData] = useState<ApiFormData>({
    title: '', api_name: '', api_key: '', api_secret: '', endpoint_url: '', 
    description: '', environment: 'production', group_id: '', expiration_days: ''
  });
  const [visibleApiKeys, setVisibleApiKeys] = useState<Set<string>>(new Set());

  const handleShowForm = useCallback(() => {
    setEditingEntry(null);
    setFormData({ 
      title: '', api_name: '', api_key: '', api_secret: '', endpoint_url: '', 
      description: '', environment: 'production', group_id: '', expiration_days: '' 
    });
    setShowForm(true);
  }, []);

  const resetForm = useCallback(() => {
    setShowForm(false);
    setEditingEntry(null);
    setFormData({ 
      title: '', api_name: '', api_key: '', api_secret: '', endpoint_url: '', 
      description: '', environment: 'production', group_id: '', expiration_days: '' 
    });
  }, []);

  return {
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
  };
};
