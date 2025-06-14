
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ApiEntry, ApiGroup, ApiFormData } from '@/types/apiVault';
import { encryptPassword, decryptPassword } from '@/utils/encryption';
import { detectApiService } from '@/utils/apiKeyValidation';

interface UseApiVaultOperationsProps {
  masterPassword: string | null;
  setEntries: (entries: ApiEntry[]) => void;
  setFormData: (formData: ApiFormData) => void;
  setEditingEntry: (entry: ApiEntry | null) => void;
  setShowForm: (show: boolean) => void;
}

export const useApiVaultOperations = ({
  masterPassword,
  setEntries,
  setFormData,
  setEditingEntry,
  setShowForm,
}: UseApiVaultOperationsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchEntries = useCallback(async () => {
    if (!user || !masterPassword) return;
    
    try {
      const { data, error } = await supabase
        .from('api_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching API entries:', error);
        return;
      }

      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching API entries:', error);
    }
  }, [user, masterPassword, setEntries]);

  const fetchGroups = useCallback(async (): Promise<ApiGroup[]> => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('api_groups')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) {
        console.error('Error fetching API groups:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching API groups:', error);
      return [];
    }
  }, [user]);

  const saveEntry = useCallback(async (formData: ApiFormData, editingEntry: ApiEntry | null): Promise<boolean> => {
    if (!user || !masterPassword) return false;

    try {
      const encryptedApiKey = encryptPassword(formData.api_key, masterPassword);
      const encryptedApiSecret = formData.api_secret ? encryptPassword(formData.api_secret, masterPassword) : null;
      
      const expiresAt = formData.expiration_days 
        ? new Date(Date.now() + parseInt(formData.expiration_days) * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const detectedService = detectApiService(formData.api_key);
      const apiName = formData.api_name || detectedService || 'Custom API';

      const entryData = {
        user_id: user.id,
        title: formData.title,
        api_name: apiName,
        api_key_encrypted: encryptedApiKey,
        api_secret_encrypted: encryptedApiSecret,
        endpoint_url: formData.endpoint_url || null,
        description: formData.description || null,
        environment: formData.environment,
        group_id: formData.group_id || null,
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      };

      if (editingEntry) {
        // Save history before updating
        if (formData.api_key !== decryptPassword(editingEntry.api_key_encrypted, masterPassword)) {
          await supabase.from('api_histories').insert({
            entry_id: editingEntry.id,
            user_id: user.id,
            api_key_encrypted: editingEntry.api_key_encrypted,
            api_secret_encrypted: editingEntry.api_secret_encrypted,
          });
        }

        const { error } = await supabase
          .from('api_entries')
          .update(entryData)
          .eq('id', editingEntry.id);

        if (error) throw error;

        toast({ title: "Success", description: "API entry updated successfully!" });
      } else {
        const { error } = await supabase
          .from('api_entries')
          .insert({
            ...entryData,
            created_at: new Date().toISOString()
          });

        if (error) throw error;

        toast({ title: "Success", description: "API entry saved successfully!" });
      }

      await fetchEntries();
      return true;
    } catch (error) {
      console.error('Error saving API entry:', error);
      toast({ title: "Error", description: "Failed to save API entry.", variant: "destructive" });
      return false;
    }
  }, [user, masterPassword, fetchEntries, toast]);

  const editEntry = useCallback((entry: ApiEntry) => {
    if (!masterPassword) return;

    try {
      const decryptedApiKey = decryptPassword(entry.api_key_encrypted, masterPassword);
      const decryptedApiSecret = entry.api_secret_encrypted 
        ? decryptPassword(entry.api_secret_encrypted, masterPassword) 
        : '';

      const expirationDays = entry.expires_at 
        ? Math.ceil((new Date(entry.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : '';

      setFormData({
        title: entry.title,
        api_name: entry.api_name || '',
        api_key: decryptedApiKey,
        api_secret: decryptedApiSecret,
        endpoint_url: entry.endpoint_url || '',
        description: entry.description || '',
        environment: entry.environment,
        group_id: entry.group_id || '',
        expiration_days: expirationDays.toString()
      });
      
      setEditingEntry(entry);
      setShowForm(true);
    } catch (error) {
      toast({ title: "Error", description: "Failed to decrypt API entry.", variant: "destructive" });
    }
  }, [masterPassword, setFormData, setEditingEntry, setShowForm, toast]);

  const deleteEntry = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('api_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Success", description: "API entry deleted successfully!" });
      await fetchEntries();
    } catch (error) {
      console.error('Error deleting API entry:', error);
      toast({ title: "Error", description: "Failed to delete API entry.", variant: "destructive" });
    }
  }, [user, fetchEntries, toast]);

  const copyApiKey = useCallback(async (entry: ApiEntry) => {
    if (!masterPassword) return;

    try {
      const decryptedApiKey = decryptPassword(entry.api_key_encrypted, masterPassword);
      await navigator.clipboard.writeText(decryptedApiKey);
      toast({ title: "Copied!", description: "API key copied to clipboard." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to copy API key.", variant: "destructive" });
    }
  }, [masterPassword, toast]);

  const toggleApiKeyVisibility = useCallback((id: string, visibleApiKeys: Set<string>, setVisibleApiKeys: (keys: Set<string>) => void) => {
    const newVisible = new Set(visibleApiKeys);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisibleApiKeys(newVisible);
  }, []);

  return {
    fetchEntries,
    fetchGroups,
    saveEntry,
    editEntry,
    deleteEntry,
    copyApiKey,
    toggleApiKeyVisibility,
  };
};
