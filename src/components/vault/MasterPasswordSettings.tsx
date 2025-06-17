
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key, Shield, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import AdvancedPasswordStrengthIndicator from './AdvancedPasswordStrengthIndicator';
import { analyzePasswordStrength } from '@/utils/passwordStrength';
import { hashMasterPassword } from '@/utils/encryption';

interface MasterPasswordSettingsProps {
  profile: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
  };
}

const MasterPasswordSettings: React.FC<MasterPasswordSettingsProps> = ({ profile }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [hasMasterPassword, setHasMasterPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentMasterPassword: '',
    newMasterPassword: '',
    confirmMasterPassword: '',
  });

  useEffect(() => {
    checkMasterPasswordExists();
  }, [user]);

  const checkMasterPasswordExists = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_master_passwords')
        .select('id')
        .eq('user_id', user.id)
        .single();

      setHasMasterPassword(!!data && !error);
    } catch (error) {
      console.error('Error checking master password:', error);
    }
  };

  const validateMasterPassword = (password: string, firstName: string = '', lastName: string = '') => {
    const errors = [];
    
    // Check length
    if (password.length <= 12) {
      errors.push('Master password must be more than 12 characters');
    }
    
    // Check for uppercase
    if (!/[A-Z]/.test(password)) {
      errors.push('Master password must contain at least one uppercase letter');
    }
    
    // Check for lowercase
    if (!/[a-z]/.test(password)) {
      errors.push('Master password must contain at least one lowercase letter');
    }
    
    // Check for special characters
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) {
      errors.push('Master password must contain at least one special character');
    }
    
    // Check for alphanumeric (numbers)
    if (!/[0-9]/.test(password)) {
      errors.push('Master password must contain at least one number');
    }
    
    // Check for personal names
    const lowerPassword = password.toLowerCase();
    const lowerFirstName = firstName.toLowerCase();
    const lowerLastName = lastName.toLowerCase();
    
    if (lowerFirstName && lowerPassword.includes(lowerFirstName)) {
      errors.push('Master password should not contain your first name');
    }
    
    if (lowerLastName && lowerPassword.includes(lowerLastName)) {
      errors.push('Master password should not contain your last name');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const verifyCurrentMasterPassword = async (currentPassword: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const hashedCurrentPassword = hashMasterPassword(currentPassword);
      
      // Check unified password first
      const { data: unifiedData, error: unifiedError } = await supabase
        .from('user_master_passwords')
        .select('master_password_hash')
        .eq('user_id', user.id)
        .eq('use_unified_password', true)
        .maybeSingle();

      if (!unifiedError && unifiedData) {
        return unifiedData.master_password_hash === hashedCurrentPassword;
      }

      // Check password vault specific password
      const { data, error } = await supabase
        .from('user_master_passwords')
        .select('master_password_hash')
        .eq('user_id', user.id)
        .eq('vault_type', 'password')
        .eq('use_unified_password', false)
        .maybeSingle();

      if (!error && data) {
        return data.master_password_hash === hashedCurrentPassword;
      }

      return false;
    } catch (error) {
      console.error('Error verifying current master password:', error);
      return false;
    }
  };

  const handleMasterPasswordChange = async () => {
    // Validate current password if changing existing master password
    if (hasMasterPassword) {
      if (!passwordData.currentMasterPassword) {
        toast({
          title: "Current Password Required",
          description: "Please enter your current master password",
          variant: "destructive"
        });
        return;
      }

      const isCurrentPasswordValid = await verifyCurrentMasterPassword(passwordData.currentMasterPassword);
      if (!isCurrentPasswordValid) {
        toast({
          title: "Invalid Current Password",
          description: "The current master password is incorrect",
          variant: "destructive"
        });
        return;
      }
    }

    const validation = validateMasterPassword(passwordData.newMasterPassword, profile.first_name, profile.last_name);
    
    if (!validation.isValid) {
      toast({
        title: "Master Password Validation Failed",
        description: validation.errors.join('. '),
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newMasterPassword !== passwordData.confirmMasterPassword) {
      toast({
        title: "Error",
        description: "New master passwords do not match",
        variant: "destructive"
      });
      return;
    }

    const strengthResult = analyzePasswordStrength(passwordData.newMasterPassword);
    if (strengthResult.score < 4) {
      toast({
        title: "Weak Master Password",
        description: "Master password must be very strong for security",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const hashedPassword = hashMasterPassword(passwordData.newMasterPassword);
      
      const { error } = await supabase
        .from('user_master_passwords')
        .upsert({
          user_id: user?.id,
          master_password_hash: hashedPassword,
          vault_type: 'password',
          use_unified_password: true,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update master password",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: hasMasterPassword ? "Master password updated successfully" : "Master password set successfully"
      });
      
      setPasswordData({
        currentMasterPassword: '',
        newMasterPassword: '',
        confirmMasterPassword: '',
      });
      setShowPasswordSection(false);
      setHasMasterPassword(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update master password",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="glass-card p-6 bg-white/5 backdrop-blur-xl border-white/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-white" />
          <h2 className="text-xl font-semibold text-white">Master Password</h2>
        </div>
        <Button
          onClick={() => setShowPasswordSection(!showPasswordSection)}
          variant="outline"
          size="sm"
          className="bg-white border-blue-400 text-blue-600 hover:bg-blue-50 hover:text-blue-700 border font-semibold"
        >
          {showPasswordSection ? 'Cancel' : hasMasterPassword ? 'Change Master Password' : 'Set Master Password'}
        </Button>
      </div>

      <div className="mb-4 p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-blue-400 font-medium mb-1">Security Recommendation</h3>
            <p className="text-blue-200 text-sm">
              Your master password should be different from your account password for enhanced security. 
              The master password protects all your stored passwords, API keys, and certificates. 
              Choose a strong, unique password that you can remember but others cannot guess.
            </p>
          </div>
        </div>
      </div>

      {showPasswordSection && (
        <div className="space-y-4">
          {hasMasterPassword && (
            <div>
              <Label htmlFor="currentMasterPassword" className="text-gray-300">
                Current Master Password
              </Label>
              <Input
                id="currentMasterPassword"
                type="password"
                value={passwordData.currentMasterPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentMasterPassword: e.target.value }))}
                className="glass-input bg-white/5 border-white/20 text-white"
                placeholder="Enter current master password"
              />
            </div>
          )}

          <div>
            <Label htmlFor="newMasterPassword" className="text-gray-300">
              {hasMasterPassword ? 'New Master Password' : 'Master Password'}
            </Label>
            <p className="text-sm text-gray-400 mb-2">
              Must be different from your account password and very strong (minimum 12 characters)
            </p>
            <Input
              id="newMasterPassword"
              type="password"
              value={passwordData.newMasterPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, newMasterPassword: e.target.value }))}
              className="glass-input bg-white/5 border-white/20 text-white"
              placeholder="Enter master password"
            />
            <AdvancedPasswordStrengthIndicator 
              password={passwordData.newMasterPassword} 
              showDetailed={true}
            />
          </div>
          
          <div>
            <Label htmlFor="confirmMasterPassword" className="text-gray-300">
              Confirm Master Password
            </Label>
            <Input
              id="confirmMasterPassword"
              type="password"
              value={passwordData.confirmMasterPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmMasterPassword: e.target.value }))}
              className="glass-input bg-white/5 border-white/20 text-white"
              placeholder="Confirm master password"
            />
          </div>
          
          <Button
            onClick={handleMasterPasswordChange}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoading ? 'Updating...' : hasMasterPassword ? 'Update Master Password' : 'Set Master Password'}
          </Button>
        </div>
      )}

      {!showPasswordSection && !hasMasterPassword && (
        <div className="p-4 bg-amber-900/20 border border-amber-600/30 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-amber-400 font-medium mb-1">Master Password Required</h3>
              <p className="text-amber-200 text-sm">
                You need to set up a master password to secure your vault. 
                This password will encrypt all your stored data.
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default MasterPasswordSettings;
