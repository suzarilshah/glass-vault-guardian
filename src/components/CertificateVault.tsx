
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Settings, Clock, Shield } from 'lucide-react';
import { useCertificateVault } from '@/hooks/useCertificateVault';
import MasterPasswordModal from './MasterPasswordModal';
import CertificateForm from './vault/CertificateForm';
import CertificateEntryCard from './vault/CertificateEntryCard';
import GroupSidebar from './vault/GroupSidebar';
import VaultHeader from './vault/VaultHeader';
import VaultLockedScreen from './vault/VaultLockedScreen';
import TimerSettings from './vault/TimerSettings';
import GroupManager from './GroupManager';
import ExpiredCertificatesAlert from './vault/ExpiredCertificatesAlert';

interface CertificateVaultProps {
  masterPassword?: string | null;
  onMasterPasswordSet?: (password: string | null) => void;
  useUnifiedPassword?: boolean;
  unifiedLockTimeoutMinutes?: number;
  onUnifiedTimeoutChange?: (minutes: number) => void;
}

const CertificateVault: React.FC<CertificateVaultProps> = ({ 
  masterPassword: propMasterPassword, 
  onMasterPasswordSet,
  useUnifiedPassword = false,
  unifiedLockTimeoutMinutes,
  onUnifiedTimeoutChange
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
  } = useCertificateVault({ 
    masterPassword: propMasterPassword, 
    onMasterPasswordSet,
    useUnifiedPassword,
    unifiedLockTimeoutMinutes,
    onUnifiedTimeoutChange
  });

  if (!masterPassword) {
    return (
      <VaultLockedScreen 
        type="Certificate"
        showMasterModal={showMasterModal}
        setShowMasterModal={setShowMasterModal}
        handleMasterPasswordSubmit={handleMasterPasswordSubmit}
        isCreatingMaster={isCreatingMaster}
        lockTimeoutMinutes={useUnifiedPassword ? unifiedLockTimeoutMinutes || 5 : lockTimeoutMinutes}
        handleTimeoutChange={useUnifiedPassword ? onUnifiedTimeoutChange : handleTimeoutChange}
      />
    );
  }

  if (showMasterModal) {
    return (
      <MasterPasswordModal
        isOpen={showMasterModal}
        onClose={() => setShowMasterModal(false)}
        onSubmit={handleMasterPasswordSubmit}
        isCreating={isCreatingMaster}
        type="Certificate"
      />
    );
  }

  const effectiveLockTimeoutMinutes = useUnifiedPassword ? (unifiedLockTimeoutMinutes || 5) : lockTimeoutMinutes;
  const effectiveHandleTimeoutChange = useUnifiedPassword ? onUnifiedTimeoutChange : handleTimeoutChange;

  return (
    <div className="space-y-6">
      <VaultHeader
        title="Certificate Vault"
        subtitle="Secure storage for SSL/TLS certificates and keys"
        icon={Shield}
        remainingTime={remainingTime}
        lockTimeoutMinutes={effectiveLockTimeoutMinutes}
        onLockVault={manualLockVault}
        onShowTimerSettings={() => setShowTimerSettings(true)}
        onShowGroupManager={() => setShowGroupManager(true)}
        onExportPasswords={exportCertificates}
        onShowForm={handleShowForm}
        addButtonText="Add Certificate"
        onTimeoutChange={effectiveHandleTimeoutChange}
      />

      {expiredEntries.length > 0 && (
        <ExpiredCertificatesAlert 
          expiredEntries={expiredEntries}
          onEditEntry={editEntry}
        />
      )}

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-3">
          <GroupSidebar
            groups={groupStats.map(g => ({
              id: g.id,
              name: g.name,
              description: g.description || '',
              user_id: g.user_id,
              created_at: g.created_at,
              updated_at: g.updated_at,
              count: g.count
            }))}
            selectedGroup={selectedGroup}
            ungroupedCount={ungroupedCount}
            totalEntries={entries.length}
            onGroupSelect={setSelectedGroup}
            groupStats={groupStats}
          />
        </div>

        <div className="col-span-12 lg:col-span-9">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">
              {selectedGroup === 'all' 
                ? 'All Certificates' 
                : groups.find(g => g.id === selectedGroup)?.name || 'Certificates'
              }
            </h2>
          </div>

          {showForm && (
            <div className="mb-6">
              <CertificateForm
                formData={formData}
                groups={groups}
                editingEntry={editingEntry}
                onFormDataChange={(data) => setFormData(prev => ({ ...prev, ...data }))}
                onSave={saveEntry}
                onCancel={() => {
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
                }}
              />
            </div>
          )}

          <div className="space-y-4">
            {filteredEntries.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No certificates found</h3>
                <p className="text-gray-500 mb-4">Start by adding your first certificate</p>
                <Button
                  onClick={handleShowForm}
                  className="glass-button bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Certificate
                </Button>
              </div>
            ) : (
              filteredEntries.map((entry) => (
                <CertificateEntryCard
                  key={entry.id}
                  entry={entry}
                  groups={groups}
                  masterPassword={masterPassword}
                  onEditEntry={editEntry}
                  onDeleteEntry={deleteEntry}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <GroupManager
        isOpen={showGroupManager}
        onClose={() => setShowGroupManager(false)}
        onGroupsChanged={fetchGroups}
        type="certificate"
      />

      <TimerSettings
        isOpen={showTimerSettings}
        onClose={() => setShowTimerSettings(false)}
        lockTimeoutMinutes={effectiveLockTimeoutMinutes}
        onTimeoutChange={effectiveHandleTimeoutChange}
      />
    </div>
  );
};

export default CertificateVault;
