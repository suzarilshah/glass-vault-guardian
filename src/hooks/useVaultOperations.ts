
import { useVaultAuth } from './useVaultAuth';
import { useVaultEntryOperations } from './useVaultEntryOperations';
import { useVaultPasswordGeneration } from './useVaultPasswordGeneration';
import { useVaultClipboard } from './useVaultClipboard';
import { useVaultExport } from './useVaultExport';
import { PasswordEntry, FormData } from '@/types/vault';

interface UseVaultOperationsProps {
  masterPassword: string | null;
  setEntries: (entries: PasswordEntry[]) => void;
  setMasterPassword: (password: string | null) => void;
  setShowMasterModal: (show: boolean) => void;
  setIsCreatingMaster: (creating: boolean) => void;
  setFormData: (data: FormData) => void;
  setEditingEntry: (entry: PasswordEntry | null) => void;
  setShowForm: (show: boolean) => void;
  startLockTimer: () => void;
  lockTimeoutMinutes: number;
  onMasterPasswordSet?: (password: string | null) => void;
  vaultType?: 'password' | 'api' | 'certificate';
}

export const useVaultOperations = ({
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
  vaultType = 'password',
}: UseVaultOperationsProps) => {
  const { handleMasterPasswordSubmit } = useVaultAuth({
    setMasterPassword,
    setShowMasterModal,
    setIsCreatingMaster,
    lockTimeoutMinutes,
    onMasterPasswordSet,
    vaultType,
  });

  const { 
    fetchEntries,
    fetchGroups,
    saveEntry,
    editEntry,
    deleteEntry,
    regeneratePassword,
  } = useVaultEntryOperations({
    masterPassword,
    setEntries,
    setFormData,
    setEditingEntry,
    setShowForm,
    startLockTimer,
  });

  const { generateNewPassword } = useVaultPasswordGeneration();

  const { copyPassword, togglePasswordVisibility } = useVaultClipboard({
    masterPassword,
    startLockTimer,
  });

  const { exportPasswords } = useVaultExport({
    masterPassword,
    startLockTimer,
  });

  return {
    fetchEntries,
    fetchGroups,
    handleMasterPasswordSubmit,
    generateNewPassword,
    saveEntry,
    editEntry,
    deleteEntry,
    copyPassword,
    regeneratePassword,
    togglePasswordVisibility,
    exportPasswords,
  };
};
