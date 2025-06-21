
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { decryptPassword } from '@/utils/encryption';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useVaultExportAll = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const exportAllVaults = useCallback(async (masterPassword: string | null) => {
    if (!masterPassword || !user) {
      toast({
        title: "Error",
        description: "Master password required for export",
        variant: "destructive"
      });
      return;
    }

    try {
      // Fetch all vault data
      const [passwordsResult, apisResult, certificatesResult, passwordGroupsResult, apiGroupsResult, certificateGroupsResult] = await Promise.all([
        supabase.from('password_entries').select('*').eq('user_id', user.id),
        supabase.from('api_entries').select('*').eq('user_id', user.id),
        supabase.from('certificate_entries').select('*').eq('user_id', user.id),
        supabase.from('password_groups').select('*').eq('user_id', user.id),
        supabase.from('api_groups').select('*').eq('user_id', user.id),
        supabase.from('certificate_groups').select('*').eq('user_id', user.id)
      ]);

      if (passwordsResult.error || apisResult.error || certificatesResult.error) {
        throw new Error('Failed to fetch vault data');
      }

      const passwordGroups = passwordGroupsResult.data || [];
      const apiGroups = apiGroupsResult.data || [];
      const certificateGroups = certificateGroupsResult.data || [];

      // Decrypt and format password entries
      const decryptedPasswords = (passwordsResult.data || []).map(entry => ({
        vault_type: 'Password',
        title: entry.title,
        username: entry.username || '',
        password: decryptPassword(entry.password_encrypted, masterPassword),
        website: entry.website || '',
        notes: entry.notes || '',
        group: passwordGroups.find(g => g.id === entry.group_id)?.name || '',
        expires_at: entry.expires_at || '',
        is_expired: entry.is_expired || false,
        created_at: entry.created_at,
        updated_at: entry.updated_at
      }));

      // Decrypt and format API entries
      const decryptedApis = (apisResult.data || []).map(entry => ({
        vault_type: 'API',
        title: entry.title,
        api_name: entry.api_name || '',
        api_key: decryptPassword(entry.api_key_encrypted, masterPassword),
        api_secret: entry.api_secret_encrypted ? decryptPassword(entry.api_secret_encrypted, masterPassword) : '',
        endpoint_url: entry.endpoint_url || '',
        environment: entry.environment || '',
        description: entry.description || '',
        group: apiGroups.find(g => g.id === entry.group_id)?.name || '',
        expires_at: entry.expires_at || '',
        is_expired: entry.is_expired || false,
        created_at: entry.created_at,
        updated_at: entry.updated_at
      }));

      // Decrypt and format certificate entries
      const decryptedCertificates = (certificatesResult.data || []).map(entry => ({
        vault_type: 'Certificate',
        title: entry.title,
        common_name: entry.common_name || '',
        issuer: entry.issuer || '',
        certificate_type: entry.certificate_type || '',
        certificate_file: decryptPassword(entry.certificate_file_encrypted, masterPassword),
        private_key: entry.private_key_encrypted ? decryptPassword(entry.private_key_encrypted, masterPassword) : '',
        passphrase: entry.passphrase_encrypted ? decryptPassword(entry.passphrase_encrypted, masterPassword) : '',
        environment: entry.environment || '',
        group: certificateGroups.find(g => g.id === entry.group_id)?.name || '',
        expires_at: entry.expires_at || '',
        is_expired: entry.is_expired || false,
        created_at: entry.created_at,
        updated_at: entry.updated_at
      }));

      // Create CSV content with proper handling of different vault types
      const headers = [
        'Vault Type', 'Title', 'Username/API Name/Common Name', 'Password/API Key/Certificate',
        'Website/Endpoint/Issuer', 'Notes/Description/Environment', 'Group', 'Expires At',
        'Is Expired', 'Created At', 'Updated At'
      ];

      const csvRows: string[] = [];

      // Add password entries
      decryptedPasswords.forEach(entry => {
        const row = [
          entry.vault_type,
          entry.title,
          entry.username,
          entry.password,
          entry.website,
          entry.notes,
          entry.group,
          entry.expires_at,
          entry.is_expired.toString(),
          entry.created_at,
          entry.updated_at
        ];
        csvRows.push(`"${row.join('","')}"`);
      });

      // Add API entries
      decryptedApis.forEach(entry => {
        const row = [
          entry.vault_type,
          entry.title,
          entry.api_name,
          entry.api_key,
          entry.endpoint_url,
          entry.description,
          entry.group,
          entry.expires_at,
          entry.is_expired.toString(),
          entry.created_at,
          entry.updated_at
        ];
        csvRows.push(`"${row.join('","')}"`);
      });

      // Add certificate entries
      decryptedCertificates.forEach(entry => {
        const row = [
          entry.vault_type,
          entry.title,
          entry.common_name,
          entry.certificate_file,
          entry.issuer,
          entry.environment,
          entry.group,
          entry.expires_at,
          entry.is_expired.toString(),
          entry.created_at,
          entry.updated_at
        ];
        csvRows.push(`"${row.join('","')}"`);
      });

      const csvContent = [headers.join(','), ...csvRows].join('\n');
      const totalEntries = decryptedPasswords.length + decryptedApis.length + decryptedCertificates.length;

      // Download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `all_vaults_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `Exported ${totalEntries} entries from all vaults`,
      });
    } catch (error) {
      console.error('Error exporting all vaults:', error);
      toast({
        title: "Error",
        description: "Failed to export vault data",
        variant: "destructive"
      });
    }
  }, [toast, user]);

  return { exportAllVaults };
};
