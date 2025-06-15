
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { hashMasterPassword } from '@/utils/encryption';

interface UseVaultAuthProps {
  setMasterPassword: (password: string | null) => void;
  setShowMasterModal: (show: boolean) => void;
  setIsCreatingMaster: (creating: boolean) => void;
  lockTimeoutMinutes: number;
  onMasterPasswordSet?: (password: string | null) => void;
  vaultType?: 'password' | 'api' | 'certificate';
}

export const useVaultAuth = ({
  setMasterPassword,
  setShowMasterModal,
  setIsCreatingMaster,
  lockTimeoutMinutes,
  onMasterPasswordSet,
  vaultType = 'password',
}: UseVaultAuthProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleMasterPasswordSubmit = useCallback(async (password: string, isCreatingMaster: boolean) => {
    const hashedPassword = hashMasterPassword(password);
    
    if (isCreatingMaster) {
      const { error } = await supabase
        .from('user_master_passwords')
        .insert({ 
          user_id: user?.id, 
          master_password_hash: hashedPassword,
          vault_type: vaultType,
          use_unified_password: true // Default to unified password for new users
        });
      
      if (error) { 
        toast({ title: "Error", description: "Failed to set master password", variant: "destructive" }); 
        return; 
      }
      
      setMasterPassword(password);
      setShowMasterModal(false);
      setIsCreatingMaster(false);
      onMasterPasswordSet?.(password);
      toast({ title: "Success", description: "Master password set successfully" });
    } else {
      // Check if user has unified password configuration
      const { data: unifiedData, error: unifiedError } = await supabase
        .from('user_master_passwords')
        .select('master_password_hash, use_unified_password')
        .eq('user_id', user?.id)
        .eq('use_unified_password', true)
        .maybeSingle();

      if (!unifiedError && unifiedData) {
        // User has unified password, check against it
        if (unifiedData.master_password_hash === hashedPassword) {
          setMasterPassword(password);
          setShowMasterModal(false);
          onMasterPasswordSet?.(password);
          toast({ 
            title: "Success", 
            description: `Vault unlocked (auto-lock in ${lockTimeoutMinutes} minutes)` 
          });
          return;
        }
      } else {
        // Check vault-specific password
        const { data, error } = await supabase
          .from('user_master_passwords')
          .select('master_password_hash')
          .eq('user_id', user?.id)
          .eq('vault_type', vaultType)
          .eq('use_unified_password', false)
          .maybeSingle();

        if (!error && data && data.master_password_hash === hashedPassword) {
          setMasterPassword(password);
          setShowMasterModal(false);
          onMasterPasswordSet?.(password);
          toast({ 
            title: "Success", 
            description: `${vaultType} vault unlocked (auto-lock in ${lockTimeoutMinutes} minutes)` 
          });
          return;
        }
      }

      // If we get here, password was incorrect
      toast({ title: "Error", description: "Incorrect master password", variant: "destructive" });
    }
  }, [user, toast, setMasterPassword, setShowMasterModal, setIsCreatingMaster, onMasterPasswordSet, lockTimeoutMinutes, vaultType]);

  return {
    handleMasterPasswordSubmit,
  };
};
