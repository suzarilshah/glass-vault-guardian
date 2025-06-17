import React from 'react';
import { useApiVault } from '@/hooks/useApiVault';
import VaultLockedScreen from '@/components/vault/VaultLockedScreen';
import VaultHeader from '@/components/vault/VaultHeader';
import GroupSidebar from '@/components/vault/GroupSidebar';
import ApiEntryCard from '@/components/vault/ApiEntryCard';
import ApiForm from '@/components/vault/ApiForm';
import EmptyState from '@/components/vault/EmptyState';
import ExpiredApiKeysAlert from '@/components/vault/ExpiredApiKeysAlert';
import GroupManager from '@/components/GroupManager';
import TimerSettings from '@/components/vault/TimerSettings';
import ConfirmationDialog from '@/components/vault/ConfirmationDialog';
import ApiHistory from '@/components/vault/ApiHistory';
import { useVaultTimer } from '@/hooks/useVaultTimer';
import { useApiVaultImport } from '@/hooks/useApiVaultImport';
import { useState } from 'react';
import { ApiEntry } from '@/types/apiVault';

interface ApiVaultProps {
  masterPassword: string | null;
  onMasterPasswordSet: (password: string | null) => void;
  useUnifiedPassword?: boolean;
  unifiedLockTimeoutMinutes?: number;
  onUnifiedTimeoutChange?: (minutes: number) => void;
  onUnifiedMasterPasswordClear?: () => void;
}

const ApiVault: React.FC<ApiVaultProps> = ({ 
  masterPassword: propMasterPassword, 
  onMasterPasswordSet,
  useUnifiedPassword = false,
  unifiedLockTimeoutMinutes,
  onUnifiedTimeoutChange,
  onUnifiedMasterPasswordClear
}) => {
  const [masterPassword, setMasterPassword] = useState<string | null>(propMasterPassword);
  const [showMasterModal, setShowMasterModal] = useState(!masterPassword);
  const [deleteConfirmEntry, setDeleteConfirmEntry] = useState<string | null>(null);
  const [historyEntry, setHistoryEntry] = useState<string | null>(null);
  const [showTimerSettings, setShowTimerSettings] = useState(false);

  const {
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
    fetchGroups,
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
  } = useApiVault({ masterPassword });

  const {
    lockTimeoutMinutes,
    remainingTime,
    manualLockVault,
    handleTimeoutChange,
  } = useVaultTimer({
    masterPassword,
    setMasterPassword,
    setShowForm,
    setEditingEntry,
    onMasterPasswordSet,
    setVisiblePasswords: undefined,
    unifiedLockTimeoutMinutes,
    onUnifiedTimeoutChange,
    onUnifiedMasterPasswordClear,
    useUnifiedPassword,
  });

  const { downloadTemplate, importData } = useApiVaultImport({
    masterPassword,
    fetchEntries: () => {
      // Refetch entries after import
      if (masterPassword) {
        // This will trigger the useEffect in useApiVault to refetch
        setMasterPassword(masterPassword);
      }
    },
  });

  const handleMasterPasswordSubmit = async (password: string) => {
    setMasterPassword(password);
    onMasterPasswordSet(password);
    setShowMasterModal(false);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmEntry) {
      await deleteEntry(deleteConfirmEntry);
      setDeleteConfirmEntry(null);
    }
  };

  const handleApiKeySelected = (apiKey: string) => {
    if (editingEntry) {
      setFormData({ ...formData, api_key: apiKey });
    }
  };

  if (!masterPassword) {
    return (
      <VaultLockedScreen 
        type="API"
        showMasterModal={showMasterModal}
        setShowMasterModal={setShowMasterModal}
        handleMasterPasswordSubmit={handleMasterPasswordSubmit}
        isCreatingMaster={false}
        lockTimeoutMinutes={useUnifiedPassword ? unifiedLockTimeoutMinutes || 5 : lockTimeoutMinutes}
        handleTimeoutChange={useUnifiedPassword ? onUnifiedTimeoutChange : handleTimeoutChange}
      />
    );
  }

  const effectiveLockTimeoutMinutes = useUnifiedPassword ? (unifiedLockTimeoutMinutes || 5) : lockTimeoutMinutes;
  const effectiveHandleTimeoutChange = useUnifiedPassword ? onUnifiedTimeoutChange : handleTimeoutChange;

  return (
    <div className="space-y-6">
      <VaultHeader
        remainingTime={remainingTime}
        onShowTimerSettings={() => setShowTimerSettings(true)}
        onShowGroupManager={() => setShowGroupManager(true)}
        onExportPasswords={() => {}} // TODO: Implement export for API keys
        onShowForm={handleShowForm}
        onLockVault={manualLockVault}
        onImportData={importData}
        onDownloadTemplate={downloadTemplate}
        title="API Vault"
        addButtonText="Add API Key"
        lockTimeoutMinutes={effectiveLockTimeoutMinutes}
        onTimeoutChange={effectiveHandleTimeoutChange}
      />

      {expiredEntries.length > 0 && (
        <ExpiredApiKeysAlert expiredCount={expiredEntries.length} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <GroupSidebar
            groups={groupStats.map(group => ({
              ...group,
              description: group.description || ''
            }))}
            selectedGroup={selectedGroup}
            onGroupSelect={setSelectedGroup}
            ungroupedCount={ungroupedCount}
            totalEntries={entries.length}
            groupStats={groupStats}
          />
        </div>

        <div className="lg:col-span-3">
          {filteredEntries.length === 0 ? (
            <EmptyState 
              onAddNew={handleShowForm}
              message="No API keys found. Add your first API key to get started!"
              buttonText="Add API Key"
            />
          ) : (
            <div className="grid gap-4">
              {filteredEntries.map((entry) => (
                <ApiEntryCard
                  key={entry.id}
                  entry={entry}
                  isVisible={visibleApiKeys.has(entry.id)}
                  onToggleVisibility={() => toggleApiKeyVisibility(entry.id)}
                  onCopy={(id, type) => copyApiKey(entry)}
                  onEdit={() => editEntry(entry)}
                  onDelete={() => setDeleteConfirmEntry(entry.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ApiForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        formData={formData}
        setFormData={setFormData}
        onSave={saveEntry}
        groups={groups}
        isEditing={!!editingEntry}
      />

      <GroupManager
        isOpen={showGroupManager}
        onClose={() => {
          setShowGroupManager(false);
          fetchGroups();
        }}
        type="api"
      />

      {showTimerSettings && (
        <TimerSettings
          lockTimeoutMinutes={effectiveLockTimeoutMinutes}
          onTimeoutChange={effectiveHandleTimeoutChange}
          onClose={() => setShowTimerSettings(false)}
        />
      )}

      <ConfirmationDialog
        isOpen={!!deleteConfirmEntry}
        onClose={() => setDeleteConfirmEntry(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete API Entry"
        message="Are you sure you want to delete this API entry? This action cannot be undone."
        confirmText="Delete"
        isDangerous={true}
      />

      {historyEntry && (
        <ApiHistory
          isOpen={!!historyEntry}
          onClose={() => setHistoryEntry(null)}
          entryId={historyEntry}
          masterPassword={masterPassword}
          onApiKeySelected={handleApiKeySelected}
        />
      )}
    </div>
  );
};

export default ApiVault;
