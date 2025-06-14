
import { useState, useCallback } from 'react';
import { PasswordEntry, PasswordGroup, FormData } from '@/types/vault';

export const useVaultState = () => {
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [groups, setGroups] = useState<PasswordGroup[]>([]);
  const [masterPassword, setMasterPassword] = useState<string | null>(null);
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [isCreatingMaster, setIsCreatingMaster] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PasswordEntry | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [formData, setFormData] = useState<FormData>({
    title: '', username: '', password: '', website: '', notes: '', group_id: '', expiration_days: ''
  });
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  const handleShowForm = useCallback(() => {
    setEditingEntry(null);
    setFormData({ title: '', username: '', password: '', website: '', notes: '', group_id: '', expiration_days: '' });
    setShowForm(true);
  }, []);

  const resetForm = useCallback(() => {
    setShowForm(false);
    setEditingEntry(null);
    setFormData({ title: '', username: '', password: '', website: '', notes: '', group_id: '', expiration_days: '' });
  }, []);

  return {
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
  };
};
