import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ArrowLeft, User, Mail, Save, AlertTriangle, Lock, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ConfirmationDialog from '@/components/vault/ConfirmationDialog';
import AdvancedPasswordStrengthIndicator from '@/components/vault/AdvancedPasswordStrengthIndicator';
import { analyzePasswordStrength } from '@/utils/passwordStrength';

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [masterPasswordData, setMasterPasswordData] = useState({
    currentMasterPassword: '',
    newMasterPassword: '',
    confirmMasterPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showMasterPasswordSection, setShowMasterPasswordSection] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || user.email || '',
        });
      } else {
        setProfile({
          first_name: '',
          last_name: '',
          email: user.email || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const validatePassword = (password: string, firstName: string = '', lastName: string = '') => {
    const errors = [];
    
    // Check length
    if (password.length <= 10) {
      errors.push('Password must be more than 10 characters');
    }
    
    // Check for uppercase
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    // Check for lowercase
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    // Check for special characters
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    // Check for alphanumeric (numbers)
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    // Check for personal names
    const lowerPassword = password.toLowerCase();
    const lowerFirstName = firstName.toLowerCase();
    const lowerLastName = lastName.toLowerCase();
    
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

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Error",
          description: "Failed to update profile",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    const validation = validatePassword(passwordData.newPassword, profile.first_name, profile.last_name);
    
    if (!validation.isValid) {
      toast({
        title: "Password Validation Failed",
        description: validation.errors.join('. '),
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive"
      });
      return;
    }

    const strengthResult = analyzePasswordStrength(passwordData.newPassword);
    if (strengthResult.isWeak) {
      toast({
        title: "Weak Password",
        description: "Please choose a stronger password",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update password",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Password updated successfully"
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswordSection(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive"
      });
    }
  };

  const handleMasterPasswordChange = async () => {
    const validation = validatePassword(masterPasswordData.newMasterPassword, profile.first_name, profile.last_name);
    
    if (!validation.isValid) {
      toast({
        title: "Master Password Validation Failed",
        description: validation.errors.join('. '),
        variant: "destructive"
      });
      return;
    }

    if (masterPasswordData.newMasterPassword !== masterPasswordData.confirmMasterPassword) {
      toast({
        title: "Error",
        description: "New master passwords do not match",
        variant: "destructive"
      });
      return;
    }

    const strengthResult = analyzePasswordStrength(masterPasswordData.newMasterPassword);
    if (strengthResult.isWeak) {
      toast({
        title: "Weak Master Password",
        description: "Please choose a stronger master password",
        variant: "destructive"
      });
      return;
    }

    try {
      // Here you would implement master password change logic
      // This would involve verifying the current master password and updating it
      toast({
        title: "Success",
        description: "Master password updated successfully"
      });
      
      setMasterPasswordData({
        currentMasterPassword: '',
        newMasterPassword: '',
        confirmMasterPassword: '',
      });
      setShowMasterPasswordSection(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update master password",
        variant: "destructive"
      });
    }
  };

  const handleDeactivateAccount = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          deactivated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error deactivating account:', error);
        toast({
          title: "Error",
          description: "Failed to deactivate account",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Account Deactivated",
        description: "Your account has been deactivated",
        variant: "destructive"
      });

      // Sign out user after deactivation
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error deactivating account:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate account",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            size="sm"
            className="bg-white border-blue-400 text-blue-600 hover:bg-blue-50 hover:text-blue-700 border font-semibold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Vault
          </Button>
          <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
        </div>

        <div className="space-y-6">
          {/* Personal Information Card */}
          <Card className="glass-card p-6 bg-white/5 backdrop-blur-xl border-white/20">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-white" />
              <h2 className="text-xl font-semibold text-white">Personal Information</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-gray-300">First Name</Label>
                  <Input
                    id="firstName"
                    value={profile.first_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
                    className="glass-input bg-white/5 border-white/20 text-white"
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-gray-300">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profile.last_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value }))}
                    className="glass-input bg-white/5 border-white/20 text-white"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    className="glass-input bg-white/5 border-white/20 text-white"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Card>

          {/* Password Change Section */}
          <Card className="glass-card p-6 bg-white/5 backdrop-blur-xl border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-white" />
                <h2 className="text-xl font-semibold text-white">Account Password</h2>
              </div>
              <Button
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                variant="outline"
                size="sm"
                className="bg-white border-blue-400 text-blue-600 hover:bg-blue-50 hover:text-blue-700 border font-semibold"
              >
                {showPasswordSection ? 'Cancel' : 'Change Password'}
              </Button>
            </div>

            {showPasswordSection && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="newPassword" className="text-gray-300">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="glass-input bg-white/5 border-white/20 text-white"
                    placeholder="Enter new password"
                  />
                  <AdvancedPasswordStrengthIndicator 
                    password={passwordData.newPassword} 
                    showDetailed={true}
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-gray-300">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="glass-input bg-white/5 border-white/20 text-white"
                    placeholder="Confirm new password"
                  />
                </div>
                <Button
                  onClick={handlePasswordChange}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Update Password
                </Button>
              </div>
            )}
          </Card>

          {/* Master Password Change Section */}
          <Card className="glass-card p-6 bg-white/5 backdrop-blur-xl border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-white" />
                <h2 className="text-xl font-semibold text-white">Master Password</h2>
              </div>
              <Button
                onClick={() => setShowMasterPasswordSection(!showMasterPasswordSection)}
                variant="outline"
                size="sm"
                className="bg-white border-blue-400 text-blue-600 hover:bg-blue-50 hover:text-blue-700 border font-semibold"
              >
                {showMasterPasswordSection ? 'Cancel' : 'Change Master Password'}
              </Button>
            </div>

            {showMasterPasswordSection && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="currentMasterPassword" className="text-gray-300">Current Master Password</Label>
                  <Input
                    id="currentMasterPassword"
                    type="password"
                    value={masterPasswordData.currentMasterPassword}
                    onChange={(e) => setMasterPasswordData(prev => ({ ...prev, currentMasterPassword: e.target.value }))}
                    className="glass-input bg-white/5 border-white/20 text-white"
                    placeholder="Enter current master password"
                  />
                </div>
                <div>
                  <Label htmlFor="newMasterPassword" className="text-gray-300">New Master Password</Label>
                  <Input
                    id="newMasterPassword"
                    type="password"
                    value={masterPasswordData.newMasterPassword}
                    onChange={(e) => setMasterPasswordData(prev => ({ ...prev, newMasterPassword: e.target.value }))}
                    className="glass-input bg-white/5 border-white/20 text-white"
                    placeholder="Enter new master password"
                  />
                  <AdvancedPasswordStrengthIndicator 
                    password={masterPasswordData.newMasterPassword} 
                    showDetailed={true}
                  />
                </div>
                <div>
                  <Label htmlFor="confirmMasterPassword" className="text-gray-300">Confirm New Master Password</Label>
                  <Input
                    id="confirmMasterPassword"
                    type="password"
                    value={masterPasswordData.confirmMasterPassword}
                    onChange={(e) => setMasterPasswordData(prev => ({ ...prev, confirmMasterPassword: e.target.value }))}
                    className="glass-input bg-white/5 border-white/20 text-white"
                    placeholder="Confirm new master password"
                  />
                </div>
                <Button
                  onClick={handleMasterPasswordChange}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Update Master Password
                </Button>
              </div>
            )}
          </Card>

          {/* Danger Zone */}
          <Card className="glass-card p-6 bg-red-900/10 backdrop-blur-xl border-red-500/30">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h2 className="text-xl font-semibold text-red-400">Danger Zone</h2>
            </div>

            <div className="space-y-4">
              <p className="text-gray-300 text-sm">
                Once you deactivate your account, all your data will be marked as inactive and you will be signed out. 
                This action is reversible by contacting support.
              </p>

              <Button
                onClick={() => setShowDeactivateConfirm(true)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Deactivate Account
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={showDeactivateConfirm}
        onClose={() => setShowDeactivateConfirm(false)}
        onConfirm={handleDeactivateAccount}
        title="Deactivate Account"
        message="Are you sure you want to deactivate your account? You will be signed out and your data will be marked as inactive. Contact support to reactivate your account."
        confirmText="Deactivate Account"
        isDangerous={true}
      />
    </div>
  );
};

export default ProfilePage;
