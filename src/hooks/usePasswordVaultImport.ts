
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { encryptPassword } from '@/utils/encryption';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UsePasswordVaultImportProps {
  masterPassword: string | null;
  fetchEntries: () => void;
}

export const usePasswordVaultImport = ({ masterPassword, fetchEntries }: UsePasswordVaultImportProps) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const downloadTemplate = useCallback(() => {
    const template = 'Title,Username,Password,Website,Notes,Group,Expires At\n"Example Entry","user@example.com","mypassword123","https://example.com","Sample notes","Work","2025-12-31"';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'password_import_template.csv';
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
        
        if (!headers.includes('Title') || !headers.includes('Password')) {
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

          if (entry.title && entry.password) {
            const encryptedPassword = encryptPassword(entry.password, masterPassword);
            
            entries.push({
              user_id: user.id,
              title: entry.title,
              username: entry.username || '',
              password_encrypted: encryptedPassword,
              website: entry.website || '',
              notes: entry.notes || '',
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
          .from('password_entries')
          .insert(entries);

        if (error) throw error;

        toast({
          title: "Success",
          description: `Successfully imported ${entries.length} password entries`,
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
