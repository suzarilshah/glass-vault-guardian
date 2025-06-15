
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { encryptPassword } from '@/utils/encryption';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UseApiVaultImportProps {
  masterPassword: string | null;
  fetchEntries: () => void;
}

export const useApiVaultImport = ({ masterPassword, fetchEntries }: UseApiVaultImportProps) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const downloadTemplate = useCallback(() => {
    const template = 'Title,API Name,API Key,API Secret,Endpoint URL,Description,Environment,Expires At\n"Example API","OpenAI API","sk-1234567890abcdef","secret123","https://api.openai.com/v1","AI API for chatbot","production","2025-12-31"';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'api_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Success",
      description: "Template downloaded successfully",
    });
  }, [toast]);

  const importData = useCallback(async () => {
    if (!masterPassword || !user) {
      toast({
        title: "Error",
        description: "Master password is required",
        variant: "destructive",
      });
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        
        if (!headers.includes('Title') || !headers.includes('API Key')) {
          toast({
            title: "Error",
            description: "Invalid CSV format. Please use the template.",
            variant: "destructive",
          });
          return;
        }

        const entries = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = line.split(',').map(v => v.replace(/"/g, '').trim());
          const entry: any = {};
          
          headers.forEach((header, index) => {
            entry[header.toLowerCase().replace(' ', '_')] = values[index] || '';
          });

          if (entry.title && entry.api_key) {
            const encryptedApiKey = encryptPassword(entry.api_key, masterPassword);
            const encryptedApiSecret = entry.api_secret ? encryptPassword(entry.api_secret, masterPassword) : null;
            
            entries.push({
              user_id: user.id,
              title: entry.title,
              api_name: entry.api_name || '',
              api_key_encrypted: encryptedApiKey,
              api_secret_encrypted: encryptedApiSecret,
              endpoint_url: entry.endpoint_url || '',
              description: entry.description || '',
              environment: entry.environment || 'production',
              group_id: null, // We'll handle groups later
              expires_at: entry.expires_at ? new Date(entry.expires_at).toISOString() : null,
              is_expired: false
            });
          }
        }

        if (entries.length === 0) {
          toast({
            title: "Error",
            description: "No valid entries found in the CSV file",
            variant: "destructive",
          });
          return;
        }

        const { error } = await supabase
          .from('api_entries')
          .insert(entries);

        if (error) throw error;

        toast({
          title: "Success",
          description: `Successfully imported ${entries.length} API entries`,
        });

        fetchEntries();
      } catch (error) {
        console.error('Import error:', error);
        toast({
          title: "Error",
          description: "Failed to import data",
          variant: "destructive",
        });
      }
    };
    input.click();
  }, [masterPassword, user, toast, fetchEntries]);

  return {
    downloadTemplate,
    importData,
  };
};
