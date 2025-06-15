
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Key, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { hashMasterPassword } from '@/utils/encryption';
import AdvancedPasswordStrengthIndicator from './AdvancedPasswordStrengthIndicator';
import { analyzePasswordStrength } from '@/utils/passwordStrength';

interface MasterPasswordSettingsProps {
  profile: {
    first_name: string;
    last_name: string;
  };
}

const MasterPasswordSettings: React.FC<MasterPasswordSettingsProps> = ({ profile }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [useSameMasterPassword, setUseSameMasterPassword] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwords, setPasswords] = useState({
    unified: '',
    password_vault: '',
    api_vault: '',
    certificate_vault: '',
  });
  const [confirmPasswords, setConfirmPasswords] = useState({
    unified: '',
    password_vault: '',
    api_vault: '',
    certificate_vault: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchMasterPasswordSettings();
  }, [user]);

  const fetchMasterPasswordSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_master_passwords')
        .select('vault_type, use_unified_password')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching master password settings:', error);
        return;
      }

      if (data && data.length > 0) {
        const hasUnified = data.some(item => item.use_unified_password);
        setUseSameMasterPassword(hasUnified);
      }
    } catch (error) {
      console.error('Error fetching master password settings:', error);
    }
  };

  const validatePassword = (password: string) => {
    const errors = [];
    
    if (password.length <= 10) {
      errors.push('Password must be more than 10 characters');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    const lowerPassword = password.toLowerCase();
    const lowerFirstName = profile.first_name?.toLowerCase() || '';
    const lowerLastName = profile.last_name?.toLowerCase() || '';
    
    if (lowerFirstName && lowerPassword.includes(lowerFirstName)) {
      errors.push('Password should not contain your first name');
    }
    
    if (lowerLastName && lowerPassword.includes(lowerLastName)) {
      errors.push('Password should not contain your last name');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleSaveMasterPasswords = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Delete existing master passwords
      await supabase
        .from('user_master_passwords')
        .delete()
        .eq('user_id', user.id);

      if (useSameMasterPassword) {
        // Validate unified password
        const validation = validatePassword(passwords.unified);
        if (!validation.isValid) {
          toast({
            title: "Password Validation Failed",
            description: validation.errors.join('. '),
            variant: "destructive"
          });
          return;
        }

        if (passwords.unified !== confirmPasswords.unified) {
          toast({
            title: "Error",
            description: "Passwords do not match",
            variant: "destructive"
          });
          return;
        }

        const strengthResult = analyzePasswordStrength(passwords.unified);
        if (strengthResult.isWeak) {
          toast({
            title: "Weak Password",
            description: "Please choose a stronger password",
            variant: "destructive"
          });
          return;
        }

        const hashedPassword = hashMasterPassword(passwords.unified);
        
        // Insert unified password for all vault types
        const vaultTypes = ['password', 'api', 'certificate'];
        for (const vaultType of vaultTypes) {
          const { error } = await supabase
            .from('user_master_passwords')
            .insert({
              user_id: user.id,
              master_password_hash: hashedPassword,
              vault_type: vaultType,
              use_unified_password: true
            });

          if (error) {
            throw error;
          }
        }
      } else {
        // Validate and save separate passwords for each vault
        const vaultTypes = [
          { type: 'password', password: passwords.password_vault, confirm: confirmPasswords.password_vault },
          { type: 'api', password: passwords.api_vault, confirm: confirmPasswords.api_vault },
          { type: 'certificate', password: passwords.certificate_vault, confirm: confirmPasswords.certificate_vault }
        ];

        for (const vault of vaultTypes) {
          if (!vault.password) {
            toast({
              title: "Error",
              description: `${vault.type} vault password is required`,
              variant: "destructive"
            });
            return;
          }

          const validation = validatePassword(vault.password);
          if (!validation.isValid) {
            toast({
              title: `${vault.type} Vault Password Validation Failed`,
              description: validation.errors.join('. '),
              variant: "destructive"
            });
            return;
          }

          if (vault.password !== vault.confirm) {
            toast({
              title: "Error",
              description: `${vault.type} vault passwords do not match`,
              variant: "destructive"
            });
            return;
          }

          const strengthResult = analyzePasswordStrength(vault.password);
          if (strengthResult.isWeak) {
            toast({
              title: "Weak Password",
              description: `Please choose a stronger ${vault.type} vault password`,
              variant: "destructive"
            });
            return;
          }

          const hashedPassword = hashMasterPassword(vault.password);
          const { error } = await supabase
            .from('user_master_passwords')
            .insert({
              user_id: user.id,
              master_password_hash: hashedPassword,
              vault_type: vault.type,
              use_unified_password: false
            });

          if (error) {
            throw error;
          }
        }
      }

      toast({
        title: "Success",
        description: "Master password settings updated successfully"
      });

      setShowPasswordForm(false);
      setPasswords({
        unified: '',
        password_vault: '',
        api_vault: '',
        certificate_vault: '',
      });
      setConfirmPasswords({
        unified: '',
        password_vault: '',
        api_vault: '',
        certificate_vault: '',
      });
    } catch (error) {
      console.error('Error updating master passwords:', error);
      toast({
        title: "Error",
        description: "Failed to update master password settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="glass-card p-6 bg-white/5 backdrop-blur-xl border-white/20">
      <div className="flex items-center gap-2 mb-4">
        <Key className="w-5 h-5 text-white" />
        <h2 className="text-xl font-semibold text-white">Master Password Configuration</h2>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-gray-300">Use same master password for all vaults</Label>
            <p className="text-sm text-gray-400">
              If enabled, you'll use one password for Password, API, and Certificate vaults
            </p>
          </div>
          <Switch
            checked={useSameMasterPassword}
            onCheckedChange={setUseSameMasterPassword}
          />
        </div>

        <div className="flex justify-between items-center">
          <p className="text-gray-300">
            {useSameMasterPassword 
              ? 'Currently using unified master password'
              : 'Currently using separate passwords for each vault'
            }
          </p>
          <Button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            variant="outline"
            size="sm"
            className="bg-white border-blue-400 text-blue-600 hover:bg-blue-50 hover:text-blue-700 border font-semibold"
          >
            {showPasswordForm ? 'Cancel' : 'Update Passwords'}
          </Button>
        </div>

        {showPasswordForm && (
          <div className="space-y-4 border-t border-white/10 pt-4">
            {useSameMasterPassword ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="unifiedPassword" className="text-gray-300">
                    Master Password (for all vaults)
                  </Label>
                  <Input
                    id="unifiedPassword"
                    type="password"
                    value={passwords.unified}
                    onChange={(e) => setPasswords(prev => ({ ...prev, unified: e.target.value }))}
                    className="glass-input bg-white/5 border-white/20 text-white"
                    placeholder="Enter master password for all vaults"
                  />
                  <AdvancedPasswordStrengthIndicator 
                    password={passwords.unified} 
                    showDetailed={true}
                  />
                </div>
                <div>
                  <Label htmlFor="confirmUnifiedPassword" className="text-gray-300">
                    Confirm Master Password
                  </Label>
                  <Input
                    id="confirmUnifiedPassword"
                    type="password"
                    value={confirmPasswords.unified}
                    onChange={(e) => setConfirmPasswords(prev => ({ ...prev, unified: e.target.value }))}
                    className="glass-input bg-white/5 border-white/20 text-white"
                    placeholder="Confirm master password"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Password Vault Master Password
                  </h3>
                  <div>
                    <Label htmlFor="passwordVaultPassword" className="text-gray-300">Password</Label>
                    <Input
                      id="passwordVaultPassword"
                      type="password"
                      value={passwords.password_vault}
                      onChange={(e) => setPasswords(prev => ({ ...prev, password_vault: e.target.value }))}
                      className="glass-input bg-white/5 border-white/20 text-white"
                      placeholder="Enter password vault master password"
                    />
                    <AdvancedPasswordStrengthIndicator 
                      password={passwords.password_vault} 
                      showDetailed={true}
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPasswordVaultPassword" className="text-gray-300">Confirm Password</Label>
                    <Input
                      id="confirmPasswordVaultPassword"
                      type="password"
                      value={confirmPasswords.password_vault}
                      onChange={(e) => setConfirmPasswords(prev => ({ ...prev, password_vault: e.target.value }))}
                      className="glass-input bg-white/5 border-white/20 text-white"
                      placeholder="Confirm password"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    API Vault Master Password
                  </h3>
                  <div>
                    <Label htmlFor="apiVaultPassword" className="text-gray-300">Password</Label>
                    <Input
                      id="apiVaultPassword"
                      type="password"
                      value={passwords.api_vault}
                      onChange={(e) => setPasswords(prev => ({ ...prev, api_vault: e.target.value }))}
                      className="glass-input bg-white/5 border-white/20 text-white"
                      placeholder="Enter API vault master password"
                    />
                    <AdvancedPasswordStrengthIndicator 
                      password={passwords.api_vault} 
                      showDetailed={true}
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmApiVaultPassword" className="text-gray-300">Confirm Password</Label>
                    <Input
                      id="confirmApiVaultPassword"
                      type="password"
                      value={confirmPasswords.api_vault}
                      onChange={(e) => setConfirmPasswords(prev => ({ ...prev, api_vault: e.target.value }))}
                      className="glass-input bg-white/5 border-white/20 text-white"
                      placeholder="Confirm password"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Certificate Vault Master Password
                  </h3>
                  <div>
                    <Label htmlFor="certificateVaultPassword" className="text-gray-300">Password</Label>
                    <Input
                      id="certificateVaultPassword"
                      type="password"
                      value={passwords.certificate_vault}
                      onChange={(e) => setPasswords(prev => ({ ...prev, certificate_vault: e.target.value }))}
                      className="glass-input bg-white/5 border-white/20 text-white"
                      placeholder="Enter certificate vault master password"
                    />
                    <AdvancedPasswordStrengthIndicator 
                      password={passwords.certificate_vault} 
                      showDetailed={true}
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmCertificateVaultPassword" className="text-gray-300">Confirm Password</Label>
                    <Input
                      id="confirmCertificateVaultPassword"
                      type="password"
                      value={confirmPasswords.certificate_vault}
                      onChange={(e) => setConfirmPasswords(prev => ({ ...prev, certificate_vault: e.target.value }))}
                      className="glass-input bg-white/5 border-white/20 text-white"
                      placeholder="Confirm password"
                    />
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleSaveMasterPasswords}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? 'Updating...' : 'Update Master Passwords'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default MasterPasswordSettings;
