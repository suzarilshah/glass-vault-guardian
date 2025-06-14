import React from 'react';
import GroupManager from './GroupManager';
import VaultHeader from './vault/VaultHeader';
import TimerSettings from './vault/TimerSettings';
import ExpiredPasswordsAlert from './vault/ExpiredPasswordsAlert';
import GroupSidebar from './vault/GroupSidebar';
import PasswordEntryCard from './vault/PasswordEntryCard';
import PasswordForm from './vault/PasswordForm';
import EmptyState from './vault/EmptyState';
import { usePasswordVault } from '@/hooks/usePasswordVault';
import VaultLockedScreen from './vault/VaultLockedScreen';

interface PasswordVaultProps {
  masterPassword?: string | null;
  onMasterPasswordSet?: (password: string | null) => void;
}

const PasswordVault: React.FC<PasswordVaultProps> = ({ masterPassword: propMasterPassword, onMasterPasswordSet }) => {
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
    handleMasterPasswordSubmit,
    handleTimeoutChange,
    fetchGroups,
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
  } = usePasswordVault({ masterPassword: propMasterPassword, onMasterPasswordSet });

  if (!masterPassword) {
    return (
      <VaultLockedScreen
        showMasterModal={showMasterModal}
        setShowMasterModal={setShowMasterModal}
        handleMasterPasswordSubmit={handleMasterPasswordSubmit}
        isCreatingMaster={isCreatingMaster}
        lockTimeoutMinutes={lockTimeoutMinutes}
        handleTimeoutChange={handleTimeoutChange}
      />
    );
  }

  return (
    <div className="space-y-6">
      <VaultHeader
        remainingTime={remainingTime}
        onShowTimerSettings={() => setShowTimerSettings(!showTimerSettings)}
        onShowGroupManager={() => setShowGroupManager(true)}
        onExportPasswords={exportPasswords}
        onShowForm={handleShowForm}
        onLockVault={() => {
          // Manual lock vault
          if (onMasterPasswordSet) onMasterPasswordSet(null);
        }}
      />

      {showTimerSettings && (
        <TimerSettings
          lockTimeoutMinutes={lockTimeoutMinutes}
          onTimeoutChange={handleTimeoutChange}
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
                onToggleVisibility={togglePasswordVisibility}
                onCopyPassword={copyPassword}
                onEditEntry={editEntry}
                onDeleteEntry={deleteEntry}
                onRegeneratePassword={regeneratePassword}
              />
            ))}
          </div>

          {filteredEntries.length === 0 && !showForm && (
            <EmptyState
              selectedGroup={selectedGroup}
              onShowForm={handleShowForm}
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
      />
    </div>
  );
};

export default PasswordVault;
