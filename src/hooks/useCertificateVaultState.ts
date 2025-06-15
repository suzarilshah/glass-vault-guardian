
import { useState, useCallback } from 'react';
import { CertificateEntry, CertificateGroup, CertificateFormData } from '@/types/certificateVault';

export const useCertificateVaultState = () => {
  const [entries, setEntries] = useState<CertificateEntry[]>([]);
  const [groups, setGroups] = useState<CertificateGroup[]>([]);
  const [masterPassword, setMasterPassword] = useState<string | null>(null);
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [isCreatingMaster, setIsCreatingMaster] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CertificateEntry | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [formData, setFormData] = useState<CertificateFormData>({
    title: '',
    passphrase: '',
    certificate_type: 'ssl',
    environment: 'production',
    group_id: '',
    expiration_days: ''
  });

  const handleShowForm = useCallback(() => {
    setEditingEntry(null);
    setFormData({
      title: '',
      passphrase: '',
      certificate_type: 'ssl',
      environment: 'production',
      group_id: '',
      expiration_days: ''
    });
    setShowForm(true);
  }, []);

  const resetForm = useCallback(() => {
    setShowForm(false);
    setEditingEntry(null);
    setFormData({
      title: '',
      passphrase: '',
      certificate_type: 'ssl',
      environment: 'production',
      group_id: '',
      expiration_days: ''
    });
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
    handleShowForm,
    resetForm,
  };
};
