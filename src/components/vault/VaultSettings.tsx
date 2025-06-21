
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings, Trash2, Clock, Shield, AlertTriangle, Database, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useVaultExportAll } from '@/hooks/useVaultExportAll';
import ConfirmationDialog from './ConfirmationDialog';
import MasterPasswordModal from '../MasterPasswordModal';

const VaultSettings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { exportAllVaults } = useVaultExportAll();
  const [isLoading, setIsLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState<string | null>(null);
  const [showExportMasterModal, setShowExportMasterModal] = useState(false);
  const [settings, setSettings] = useState({
    passwordRetention: '365',
    apiRetention: '180',
    certificateRetention: '730',
    autoLockMinutes: '15',
    enableBiometric: false,
    enableClipboardClear: true,
    enablePasswordHistory: true,
    maxPasswordHistory: '10',
  });

  useEffect(() => {
    fetchVaultSettings();
  }, [user]);

  const fetchVaultSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('vault_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching vault settings:', error);
        return;
      }

      if (data) {
        setSettings({
          passwordRetention: data.password_retention_days?.toString() || '365',
          apiRetention: data.api_retention_days?.toString() || '180',
          certificateRetention: data.certificate_retention_days?.toString() || '730',
          autoLockMinutes: data.auto_lock_minutes?.toString() || '15',
          enableBiometric: data.enable_biometric || false,
          enableClipboardClear: data.enable_clipboard_clear !== false,
          enablePasswordHistory: data.enable_password_history !== false,
          maxPasswordHistory: data.max_password_history?.toString() || '10',
        });
      }
    } catch (error) {
      console.error('Error fetching vault settings:', error);
    }
  };

  const saveVaultSettings = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('vault_settings')
        .upsert({
          user_id: user.id,
          password_retention_days: parseInt(settings.passwordRetention),
          api_retention_days: parseInt(settings.apiRetention),
          certificate_retention_days: parseInt(settings.certificateRetention),
          auto_lock_minutes: parseInt(settings.autoLockMinutes),
          enable_biometric: settings.enableBiometric,
          enable_clipboard_clear: settings.enableClipboardClear,
          enable_password_history: settings.enablePasswordHistory,
          max_password_history: parseInt(settings.maxPasswordHistory),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to save vault settings",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Vault settings saved successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save vault settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearVaultData = async (vaultType: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      let error;
      
      switch (vaultType) {
        case 'password':
          ({ error } = await supabase
            .from('password_entries')
            .delete()
            .eq('user_id', user.id));
          break;
        case 'api':
          ({ error } = await supabase
            .from('api_entries')
            .delete()
            .eq('user_id', user.id));
          break;
        case 'certificate':
          ({ error } = await supabase
            .from('certificate_entries')
            .delete()
            .eq('user_id', user.id));
          break;
        default:
          throw new Error('Invalid vault type');
      }

      if (error) {
        toast({
          title: "Error",
          description: `Failed to clear ${vaultType} vault`,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: `${vaultType.charAt(0).toUpperCase() + vaultType.slice(1)} vault cleared successfully`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to clear ${vaultType} vault`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setShowClearConfirm(null);
    }
  };

  const handleExportAllVaults = async (masterPassword: string) => {
    setShowExportMasterModal(false);
    await exportAllVaults(masterPassword);
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card p-6 bg-white/5 backdrop-blur-xl border-white/20">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="w-5 h-5 text-white" />
          <h2 className="text-xl font-semibold text-white">Vault Settings</h2>
        </div>

        <div className="space-y-6">
          {/* Data Export Section */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Data Export
            </h3>
            <div className="p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
              <div className="flex items-start gap-3 mb-4">
                <Database className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-blue-400 font-medium mb-1">Export All Vaults</h4>
                  <p className="text-blue-200 text-sm mb-3">
                    Export all data from Password, API, and Certificate vaults to a CSV file.
                  </p>
                  <Button
                    onClick={() => setShowExportMasterModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isLoading}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export All Vaults
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-white/20" />

          {/* Data Retention Settings */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Data Retention
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="passwordRetention" className="text-gray-300">Password Vault (days)</Label>
                <Select value={settings.passwordRetention} onValueChange={(value) => setSettings(prev => ({ ...prev, passwordRetention: value }))}>
                  <SelectTrigger className="glass-input bg-white/5 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="180">180 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                    <SelectItem value="730">2 years</SelectItem>
                    <SelectItem value="-1">Never delete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="apiRetention" className="text-gray-300">API Vault (days)</Label>
                <Select value={settings.apiRetention} onValueChange={(value) => setSettings(prev => ({ ...prev, apiRetention: value }))}>
                  <SelectTrigger className="glass-input bg-white/5 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="180">180 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                    <SelectItem value="730">2 years</SelectItem>
                    <SelectItem value="-1">Never delete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="certificateRetention" className="text-gray-300">Certificate Vault (days)</Label>
                <Select value={settings.certificateRetention} onValueChange={(value) => setSettings(prev => ({ ...prev, certificateRetention: value }))}>
                  <SelectTrigger className="glass-input bg-white/5 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="180">180 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                    <SelectItem value="730">2 years</SelectItem>
                    <SelectItem value="1095">3 years</SelectItem>
                    <SelectItem value="-1">Never delete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator className="bg-white/20" />

          {/* Security Settings */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Security Settings
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="autoLock" className="text-gray-300">Auto-lock after inactivity</Label>
                <Select value={settings.autoLockMinutes} onValueChange={(value) => setSettings(prev => ({ ...prev, autoLockMinutes: value }))}>
                  <SelectTrigger className="glass-input bg-white/5 border-white/20 text-white max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="-1">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-3">
                <Switch
                  id="biometric"
                  checked={settings.enableBiometric}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableBiometric: checked }))}
                />
                <div>
                  <Label htmlFor="biometric" className="text-gray-300">Enable biometric authentication</Label>
                  <p className="text-sm text-gray-400">Use fingerprint or face recognition when available</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Switch
                  id="clipboardClear"
                  checked={settings.enableClipboardClear}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableClipboardClear: checked }))}
                />
                <div>
                  <Label htmlFor="clipboardClear" className="text-gray-300">Auto-clear clipboard</Label>
                  <p className="text-sm text-gray-400">Automatically clear copied passwords after 30 seconds</p>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-white/20" />

          {/* Password History Settings */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Password History
            </h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Switch
                  id="passwordHistory"
                  checked={settings.enablePasswordHistory}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enablePasswordHistory: checked }))}
                />
                <div>
                  <Label htmlFor="passwordHistory" className="text-gray-300">Enable password history</Label>
                  <p className="text-sm text-gray-400">Keep track of previous passwords for each entry</p>
                </div>
              </div>

              {settings.enablePasswordHistory && (
                <div>
                  <Label htmlFor="maxHistory" className="text-gray-300">Maximum password history entries</Label>
                  <Select value={settings.maxPasswordHistory} onValueChange={(value) => setSettings(prev => ({ ...prev, maxPasswordHistory: value }))}>
                    <SelectTrigger className="glass-input bg-white/5 border-white/20 text-white max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 entries</SelectItem>
                      <SelectItem value="10">10 entries</SelectItem>
                      <SelectItem value="15">15 entries</SelectItem>
                      <SelectItem value="20">20 entries</SelectItem>
                      <SelectItem value="25">25 entries</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <Separator className="bg-white/20" />

          {/* Data Management */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Data Management
            </h3>
            <div className="p-4 bg-red-900/20 border border-red-600/30 rounded-lg">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-red-400 font-medium mb-1">Danger Zone</h4>
                  <p className="text-red-200 text-sm">
                    These actions will permanently delete data from your vaults. This cannot be undone.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button
                  onClick={() => setShowClearConfirm('password')}
                  variant="outline"
                  className="border-red-600 text-red-400 hover:bg-red-900/30"
                  disabled={isLoading}
                >
                  Clear Password Vault
                </Button>
                <Button
                  onClick={() => setShowClearConfirm('api')}
                  variant="outline"
                  className="border-red-600 text-red-400 hover:bg-red-900/30"
                  disabled={isLoading}
                >
                  Clear API Vault
                </Button>
                <Button
                  onClick={() => setShowClearConfirm('certificate')}
                  variant="outline"
                  className="border-red-600 text-red-400 hover:bg-red-900/30"
                  disabled={isLoading}
                >
                  Clear Certificate Vault
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={saveVaultSettings}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </Card>

      <ConfirmationDialog
        isOpen={showClearConfirm !== null}
        onClose={() => setShowClearConfirm(null)}
        onConfirm={() => showClearConfirm && clearVaultData(showClearConfirm)}
        title={`Clear ${showClearConfirm?.charAt(0).toUpperCase()}${showClearConfirm?.slice(1)} Vault`}
        message={`Are you sure you want to permanently delete all entries in your ${showClearConfirm} vault? This action cannot be undone.`}
        confirmText="Yes, Clear Vault"
        isDangerous={true}
      />

      <MasterPasswordModal
        isOpen={showExportMasterModal}
        onClose={() => setShowExportMasterModal(false)}
        onSubmit={handleExportAllVaults}
        title="Export All Vaults"
        description="Enter your master password to export all vault data"
        vaultType="unified"
      />
    </div>
  );
};

export default VaultSettings;
