
import { useState, useCallback } from 'react';
import { ApiEntry, ApiFormData } from '@/types/apiVault';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { encryptPassword, decryptPassword } from '@/utils/encryption';

interface UseApiVaultOperationsProps {
  masterPassword: string | null;
  setEntries: (entries: ApiEntry[]) => void;
  setFormData: (data: ApiFormData) => void;
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

      if (error) throw error;
      
      // Ensure environment field has correct type
      const typedData = (data || []).map(entry => ({
        ...entry,
        environment: (entry.environment as 'development' | 'staging' | 'production') || 'production'
      })) as ApiEntry[];
      
      setEntries(typedData);
    } catch (error) {
      console.error('Error fetching API entries:', error);
      toast({
        title: "Error",
        description: "Failed to fetch API entries",
        variant: "destructive",
      });
    }
  }, [user, masterPassword, setEntries, toast]);

  const fetchGroups = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('api_groups')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching API groups:', error);
      toast({
        title: "Error",
        description: "Failed to fetch groups",
        variant: "destructive",
      });
      return [];
    }
  }, [user, toast]);

  const saveEntry = useCallback(async (formData: ApiFormData, editingEntry: ApiEntry | null) => {
    if (!user || !masterPassword) return false;

    const { 
      title, api_name, api_key, api_secret, endpoint_url, 
      description, environment, group_id, expiration_days 
    } = formData;

    try {
      console.log('Saving API entry with data:', { title, api_name, environment, group_id });
      
      const apiKeyEncrypted = encryptPassword(api_key, masterPassword);
      const apiSecretEncrypted = api_secret ? encryptPassword(api_secret, masterPassword) : null;

      const expiresAt = expiration_days ? new Date(Date.now() + parseInt(expiration_days) * 24 * 60 * 60 * 1000).toISOString() : null;

      const entryData = {
        title,
        api_name,
        api_key_encrypted: apiKeyEncrypted,
        api_secret_encrypted: apiSecretEncrypted,
        endpoint_url,
        description,
        environment,
        group_id: group_id === 'all' || group_id === '' ? null : group_id,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      };

      if (editingEntry) {
        console.log('Updating existing entry:', editingEntry.id);
        const { error } = await supabase
          .from('api_entries')
          .update(entryData)
          .eq('id', editingEntry.id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        
        toast({
          title: "Success",
          description: "API entry updated successfully",
        });
        setEditingEntry(null);
      } else {
        console.log('Creating new entry');
        const { error } = await supabase
          .from('api_entries')
          .insert({
            user_id: user.id,
            ...entryData,
          });

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        
        toast({
          title: "Success",
          description: "API entry created successfully",
        });
      }

      setShowForm(false);
      setFormData({ 
        title: '', api_name: '', api_key: '', api_secret: '', endpoint_url: '', 
        description: '', environment: 'production', group_id: '', expiration_days: '' 
      });
      await fetchEntries();
      return true;
    } catch (error) {
      console.error('Error saving API entry:', error);
      toast({
        title: "Error",
        description: "Failed to save API entry. Please check your inputs and try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [user, masterPassword, setFormData, setShowForm, fetchEntries, toast, setEditingEntry]);

  const editEntry = useCallback(async (entry: ApiEntry) => {
    if (!masterPassword) {
      toast({
        title: "Error",
        description: "Master password is required",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Decrypting entry for editing:', entry.id);
      
      // Decrypt the API key and secret to show in the form
      const decryptedApiKey = decryptPassword(entry.api_key_encrypted, masterPassword);
      const decryptedApiSecret = entry.api_secret_encrypted ? decryptPassword(entry.api_secret_encrypted, masterPassword) : '';

      console.log('Successfully decrypted API key length:', decryptedApiKey.length);

      setEditingEntry(entry);
      setFormData({
        title: entry.title,
        api_name: entry.api_name || '',
        api_key: decryptedApiKey,
        api_secret: decryptedApiSecret,
        endpoint_url: entry.endpoint_url || '',
        description: entry.description || '',
        environment: entry.environment || 'production',
        group_id: entry.group_id || '',
        expiration_days: entry.expires_at ? Math.ceil((new Date(entry.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)).toString() : '',
      });
      setShowForm(true);
    } catch (error) {
      console.error('Error decrypting API entry:', error);
      toast({
        title: "Error",
        description: "Failed to decrypt API entry. Please check your master password.",
        variant: "destructive",
      });
    }
  }, [setFormData, setShowForm, setEditingEntry, masterPassword, toast]);

  const deleteEntry = useCallback(async (entryId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('api_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) throw error;
      toast({
        title: "Success",
        description: "API entry deleted successfully",
      });
      fetchEntries();
    } catch (error) {
      console.error('Error deleting API entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete API entry",
        variant: "destructive",
      });
    }
  }, [user, fetchEntries, toast]);

  const copyApiKey = useCallback(async (entry: ApiEntry) => {
    if (!masterPassword) return;

    try {
      const decryptedApiKey = decryptPassword(entry.api_key_encrypted, masterPassword);
      await navigator.clipboard.writeText(decryptedApiKey);
      toast({
        title: "Copied!",
        description: "API key copied to clipboard",
      });
    } catch (error) {
      console.error('Error copying API key:', error);
      toast({
        title: "Error",
        description: "Failed to copy API key",
        variant: "destructive",
      });
    }
  }, [masterPassword, toast]);

  const toggleApiKeyVisibility = useCallback((id: string, visibleApiKeys: Set<string>, setVisibleApiKeys: React.Dispatch<React.SetStateAction<Set<string>>>) => {
    setVisibleApiKeys(prev => {
      const newVisibleApiKeys = new Set(prev);
      if (newVisibleApiKeys.has(id)) {
        newVisibleApiKeys.delete(id);
      } else {
        newVisibleApiKeys.add(id);
      }
      return newVisibleApiKeys;
    });
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
