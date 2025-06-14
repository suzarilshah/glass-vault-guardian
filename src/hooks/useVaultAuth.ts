
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
}

export const useVaultAuth = ({
  setMasterPassword,
  setShowMasterModal,
  setIsCreatingMaster,
  lockTimeoutMinutes,
  onMasterPasswordSet,
}: UseVaultAuthProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleMasterPasswordSubmit = useCallback(async (password: string, isCreatingMaster: boolean) => {
    const hashedPassword = hashMasterPassword(password);
    if (isCreatingMaster) {
      const { error } = await supabase.from('user_master_passwords').insert({ user_id: user?.id, master_password_hash: hashedPassword });
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
      const { data, error } = await supabase.from('user_master_passwords').select('master_password_hash').eq('user_id', user?.id).single();
      if (error || !data) { 
        toast({ title: "Error", description: "Failed to verify master password", variant: "destructive" }); 
        return; 
      }
      if (data.master_password_hash === hashedPassword) {
        setMasterPassword(password);
        setShowMasterModal(false);
        onMasterPasswordSet?.(password);
        toast({ title: "Success", description: `Vault unlocked (auto-lock in ${lockTimeoutMinutes} minutes)` });
      } else {
        toast({ title: "Error", description: "Incorrect master password", variant: "destructive" });
      }
    }
  }, [user, toast, setMasterPassword, setShowMasterModal, setIsCreatingMaster, onMasterPasswordSet, lockTimeoutMinutes]);

  return {
    handleMasterPasswordSubmit,
  };
};
