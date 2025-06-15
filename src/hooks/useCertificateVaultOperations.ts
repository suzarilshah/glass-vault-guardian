
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { encryptPassword, decryptPassword, hashMasterPassword } from '@/utils/encryption';
import { CertificateEntry, CertificateFormData } from '@/types/certificateVault';

interface UseCertificateVaultOperationsProps {
  masterPassword: string | null;
  setEntries: (entries: CertificateEntry[]) => void;
  setMasterPassword: (password: string | null) => void;
  setShowMasterModal: (show: boolean) => void;
  setIsCreatingMaster: (creating: boolean) => void;
  setFormData: (data: CertificateFormData) => void;
  setEditingEntry: (entry: CertificateEntry | null) => void;
  setShowForm: (show: boolean) => void;
  startLockTimer: () => void;
  lockTimeoutMinutes: number;
  onMasterPasswordSet?: (password: string | null) => void;
}

export const useCertificateVaultOperations = ({
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
}: UseCertificateVaultOperationsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchEntries = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('certificate_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      toast({ title: "Error", description: "Failed to fetch certificate entries", variant: "destructive" });
    } else {
      setEntries(data || []);
    }
  }, [user, toast, setEntries]);

  const fetchGroups = useCallback(async () => {
    if (!user) return [];
    const { data, error } = await supabase
      .from('certificate_groups')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
    
    if (!error && data) return data;
    return [];
  }, [user]);

  const handleMasterPasswordSubmit = useCallback(async (password: string, isCreatingMaster: boolean) => {
    const hashedPassword = hashMasterPassword(password);
    if (isCreatingMaster) {
      const { error } = await supabase
        .from('user_master_passwords')
        .insert({ user_id: user?.id, master_password_hash: hashedPassword });
      
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
      const { data, error } = await supabase
        .from('user_master_passwords')
        .select('master_password_hash')
        .eq('user_id', user?.id)
        .single();
      
      if (error || !data) { 
        toast({ title: "Error", description: "Failed to verify master password", variant: "destructive" }); 
        return; 
      }
      if (data.master_password_hash === hashedPassword) {
        setMasterPassword(password);
        setShowMasterModal(false);
        onMasterPasswordSet?.(password);
        toast({ title: "Success", description: `Certificate vault unlocked (auto-lock in ${lockTimeoutMinutes} minutes)` });
      } else {
        toast({ title: "Error", description: "Incorrect master password", variant: "destructive" });
      }
    }
  }, [user, toast, setMasterPassword, setShowMasterModal, setIsCreatingMaster, onMasterPasswordSet, lockTimeoutMinutes]);

  const saveEntry = useCallback(async (formData: CertificateFormData, editingEntry: CertificateEntry | null) => {
    if (!masterPassword || !formData.certificate_file) return false;
    
    try {
      // Read certificate file
      const certificateContent = await formData.certificate_file.text();
      const encryptedCertificate = encryptPassword(certificateContent, masterPassword);
      
      // Read private key file if provided
      let encryptedPrivateKey = null;
      if (formData.private_key_file) {
        const privateKeyContent = await formData.private_key_file.text();
        encryptedPrivateKey = encryptPassword(privateKeyContent, masterPassword);
      }
      
      // Encrypt passphrase if provided
      let encryptedPassphrase = null;
      if (formData.passphrase) {
        encryptedPassphrase = encryptPassword(formData.passphrase, masterPassword);
      }

      // Calculate expiration date
      let expiresAt = null;
      if (formData.expiration_days && parseInt(formData.expiration_days) > 0) {
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + parseInt(formData.expiration_days));
        expiresAt = expDate.toISOString();
      }

      const entryData = {
        user_id: user?.id,
        title: formData.title,
        certificate_file_encrypted: encryptedCertificate,
        private_key_encrypted: encryptedPrivateKey,
        passphrase_encrypted: encryptedPassphrase,
        certificate_type: formData.certificate_type,
        environment: formData.environment,
        group_id: formData.group_id || null,
        expires_at: expiresAt,
        is_expired: false
      };

      let error;
      if (editingEntry) {
        // Save to history before updating
        await supabase
          .from('certificate_histories')
          .insert({
            entry_id: editingEntry.id,
            user_id: user?.id,
            certificate_file_encrypted: editingEntry.certificate_file_encrypted,
            private_key_encrypted: editingEntry.private_key_encrypted,
            changed_at: new Date().toISOString(),
          });
        
        ({ error } = await supabase
          .from('certificate_entries')
          .update(entryData)
          .eq('id', editingEntry.id));
      } else {
        ({ error } = await supabase
          .from('certificate_entries')
          .insert(entryData));
      }

      if (error) { 
        toast({ title: "Error", description: "Failed to save certificate", variant: "destructive" }); 
        return false; 
      }

      toast({ title: "Success", description: editingEntry ? "Certificate updated" : "Certificate saved" });
      await fetchEntries();
      startLockTimer();
      return true;
    } catch (error) { 
      toast({ title: "Error", description: "Failed to process certificate files", variant: "destructive" }); 
      return false; 
    }
  }, [masterPassword, user, toast, fetchEntries, startLockTimer]);

  const editEntry = useCallback((entry: CertificateEntry) => {
    if (!masterPassword) return;
    
    try {
      let expirationDays = '';
      if (entry.expires_at) {
        const expDate = new Date(entry.expires_at);
        const today = new Date();
        const diffTime = expDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 0) expirationDays = diffDays.toString();
      }

      setFormData({ 
        title: entry.title,
        passphrase: entry.passphrase_encrypted ? '••••••••' : '',
        certificate_type: entry.certificate_type,
        environment: entry.environment,
        group_id: entry.group_id || '',
        expiration_days: expirationDays
      });
      setEditingEntry(entry);
      setShowForm(true);
      startLockTimer();
    } catch (error) { 
      toast({ title: "Error", description: "Failed to load certificate for editing", variant: "destructive" }); 
    }
  }, [masterPassword, setFormData, setEditingEntry, setShowForm, startLockTimer, toast]);

  const deleteEntry = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('certificate_entries')
      .delete()
      .eq('id', id);
    
    if (error) { 
      toast({ title: "Error", description: "Failed to delete certificate", variant: "destructive" }); 
      return; 
    }
    toast({ title: "Success", description: "Certificate deleted" });
    fetchEntries();
    startLockTimer();
  }, [toast, fetchEntries, startLockTimer]);

  const exportCertificates = useCallback(async (entries: CertificateEntry[], groups: any[]) => {
    if (!masterPassword) return;
    
    try {
      const csvContent = [
        'Title,Type,Environment,Group,Common Name,Issuer,Expires At,Is Expired',
        ...entries.map(entry => {
          const group = groups.find(g => g.id === entry.group_id)?.name || '';
          return `"${entry.title}","${entry.certificate_type}","${entry.environment}","${group}","${entry.common_name || ''}","${entry.issuer || ''}","${entry.expires_at || ''}","${entry.is_expired}"`;
        })
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'certificates_export.csv';
      a.click();
      URL.revokeObjectURL(url);
      
      toast({ title: "Success", description: "Certificates exported to CSV" });
      startLockTimer();
    } catch (error) { 
      toast({ title: "Error", description: "Failed to export certificates", variant: "destructive" }); 
    }
  }, [masterPassword, toast, startLockTimer]);

  return {
    fetchEntries,
    fetchGroups,
    handleMasterPasswordSubmit,
    saveEntry,
    editEntry,
    deleteEntry,
    exportCertificates,
  };
};
