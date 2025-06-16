
import React, { useCallback } from 'react';
import GroupManager from './GroupManager';
import VaultHeader from './vault/VaultHeader';
import TimerSettings from './vault/TimerSettings';
import ExpiredPasswordsAlert from './vault/ExpiredPasswordsAlert';
import GroupSidebar from './vault/GroupSidebar';
import PasswordEntryCard from './vault/PasswordEntryCard';
import PasswordForm from './vault/PasswordForm';
import EmptyState from './vault/EmptyState';
import { usePasswordVault } from '@/hooks/usePasswordVault';
import { usePasswordVaultImport } from '@/hooks/usePasswordVaultImport';
import VaultLockedScreen from './vault/VaultLockedScreen';

interface PasswordVaultProps {
  masterPassword?: string | null;
  onMasterPasswordSet?: (password: string | null) => void;
  useUnifiedPassword?: boolean;
  unifiedLockTimeoutMinutes?: number;
  onUnifiedTimeoutChange?: (minutes: number) => void;
  onUnifiedMasterPasswordClear?: () => void;
}

const PasswordVault: React.FC<PasswordVaultProps> = ({ 
  masterPassword: propMasterPassword, 
  onMasterPasswordSet,
  useUnifiedPassword = false,
  unifiedLockTimeoutMinutes,
  onUnifiedTimeoutChange,
  onUnifiedMasterPasswordClear
}) => {
  const {
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
    fetchGroups,
    fetchEntries,
    generateNewPassword,
    regeneratePassword,
    saveEntry,
    editEntry,
    deleteEntry,
    copyPassword,
    togglePasswordVisibility,
    exportPasswords,
    filteredEntries,
    expiredEntries,
    groupStats,
    ungroupedCount,
    handleShowForm,
    manualLockVault,
  } = usePasswordVault({ 
    masterPassword: propMasterPassword, 
    onMasterPasswordSet,
    useUnifiedPassword,
    unifiedLockTimeoutMinutes,
    onUnifiedTimeoutChange,
    onUnifiedMasterPasswordClear
  });

  const { downloadTemplate, importData } = usePasswordVaultImport({
    masterPassword,
    fetchEntries,
  });

  // Custom toggle function that handles the visibility state locally
  const handleTogglePasswordVisibility = useCallback((id: string) => {
    const newVisible = new Set(visiblePasswords);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisiblePasswords(newVisible);
    togglePasswordVisibility(id);
  }, [visiblePasswords, setVisiblePasswords, togglePasswordVisibility]);

  if (!masterPassword) {
    return (
      <VaultLockedScreen
        showMasterModal={showMasterModal}
        setShowMasterModal={setShowMasterModal}
        handleMasterPasswordSubmit={handleMasterPasswordSubmit}
        isCreatingMaster={isCreatingMaster}
        lockTimeoutMinutes={useUnifiedPassword ? unifiedLockTimeoutMinutes || 5 : lockTimeoutMinutes}
        handleTimeoutChange={useUnifiedPassword ? onUnifiedTimeoutChange : handleTimeoutChange}
      />
    );
  }

  const getEmptyStateMessage = () => {
    if (selectedGroup === 'all') {
      return "No passwords found. Add your first password to get started!";
    }
    const selectedGroupName = groups.find(g => g.id === selectedGroup)?.name;
    if (selectedGroupName) {
      return `No passwords found in "${selectedGroupName}" group.`;
    }
    return selectedGroup === '' 
      ? "No ungrouped passwords found." 
      : "No passwords found in this group.";
  };

  const effectiveLockTimeoutMinutes = useUnifiedPassword ? (unifiedLockTimeoutMinutes || 5) : lockTimeoutMinutes;
  const effectiveHandleTimeoutChange = useUnifiedPassword ? onUnifiedTimeoutChange : handleTimeoutChange;

  return (
    <div className="space-y-6">
      <VaultHeader
        remainingTime={remainingTime}
        onShowTimerSettings={() => setShowTimerSettings(!showTimerSettings)}
        onShowGroupManager={() => setShowGroupManager(true)}
        onExportPasswords={exportPasswords}
        onShowForm={handleShowForm}
        onLockVault={manualLockVault}
        onImportData={importData}
        onDownloadTemplate={downloadTemplate}
        lockTimeoutMinutes={effectiveLockTimeoutMinutes}
        onTimeoutChange={effectiveHandleTimeoutChange}
      />

      {showTimerSettings && (
        <TimerSettings
          lockTimeoutMinutes={effectiveLockTimeoutMinutes}
          onTimeoutChange={effectiveHandleTimeoutChange}
          onClose={() => setShowTimerSettings(false)}
        />
      )}

      <ExpiredPasswordsAlert expiredCount={expiredEntries.length} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1">
          <GroupSidebar
            groups={groups}
            selectedGroup={selectedGroup}
            onGroupSelect={setSelectedGroup}
            totalEntries={entries.length}
            groupStats={groupStats}
            ungroupedCount={ungroupedCount}
          />
        </div>

        <div className="md:col-span-3 space-y-4">
          {showForm && (
            <PasswordForm
              formData={formData}
              groups={groups}
              editingEntry={editingEntry}
              onFormDataChange={(data) => setFormData(prev => ({ ...prev, ...data }))}
              onGeneratePassword={generateNewPassword}
              onSave={saveEntry}
              onCancel={() => {
                setShowForm(false);
                setEditingEntry(null);
                setFormData({ title: '', username: '', password: '', website: '', notes: '', group_id: '', expiration_days: '' });
              }}
              showForm={showForm}
            />
          )}

          <div className="grid gap-4">
            {filteredEntries.map((entry) => (
              <PasswordEntryCard
                key={entry.id}
                entry={entry}
                groups={groups}
                visiblePasswords={visiblePasswords}
                masterPassword={masterPassword}
                onToggleVisibility={handleTogglePasswordVisibility}
                onCopyPassword={copyPassword}
                onEditEntry={editEntry}
                onDeleteEntry={deleteEntry}
                onRegeneratePassword={regeneratePassword}
              />
            ))}
          </div>

          {filteredEntries.length === 0 && !showForm && (
            <EmptyState
              onAddNew={handleShowForm}
              message={getEmptyStateMessage()}
              buttonText="Add Password"
            />
          )}
        </div>
      </div>

      <GroupManager
        isOpen={showGroupManager}
        onClose={() => {
          setShowGroupManager(false);
          fetchGroups();
        }}
        type="password"
      />
    </div>
  );
};

export default PasswordVault;
