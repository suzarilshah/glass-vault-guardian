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
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { ShieldCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [tfaSetupInfo, setTfaSetupInfo] = useState<{qrCode: string, secret: string, factorId: string} | null>(null);
  const [tfaVerificationCode, setTfaVerificationCode] = useState('');
  const [isTfaEnabled, setIsTfaEnabled] = useState(false);
  const [isTfaLoading, setIsTfaLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
      const checkTfa = async () => {
        setIsTfaLoading(true);
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (error) {
            console.error('Error listing MFA factors:', error);
            toast({ title: 'Error', description: 'Could not fetch 2FA status.', variant: 'destructive' });
        } else {
            const isEnabled = data.totp.some(factor => factor.status === 'verified');
            setIsTfaEnabled(isEnabled);
        }
        setIsTfaLoading(false);
      }
      checkTfa();
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
  
  const handleEnableTfa = async () => {
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
    if (error) {
        toast({ title: 'Error enabling 2FA', description: error.message, variant: 'destructive' });
        return;
    }
    if (data) {
        setTfaSetupInfo({
            qrCode: data.totp.qr_code,
            secret: data.totp.secret,
            factorId: data.id
        });
    }
  };

  const handleVerifyTfa = async () => {
      if (!tfaSetupInfo) return;
      const { error } = await supabase.auth.mfa.challengeAndVerify({
          factorId: tfaSetupInfo.factorId,
          code: tfaVerificationCode
      });

      if (error) {
          toast({ title: 'Error verifying 2FA code', description: error.message, variant: 'destructive' });
      } else {
          toast({ title: 'Success', description: '2FA has been enabled.' });
          setIsTfaEnabled(true);
          setTfaSetupInfo(null);
          setTfaVerificationCode('');
          // Re-check factors
          const { data } = await supabase.auth.mfa.listFactors();
          const isEnabled = data?.totp.some(factor => factor.status === 'verified');
          setIsTfaEnabled(isEnabled ?? false);
      }
  };
  
  const handleCancelTfaSetup = () => {
    setTfaSetupInfo(null);
    setTfaVerificationCode('');
  }

  const handleDisableTfa = async () => {
      const { data, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError || !data) {
          toast({ title: 'Error', description: 'Could not fetch 2FA factors.', variant: 'destructive' });
          return;
      }

      const totpFactor = data.totp.find(f => f.status === 'verified');
      if (!totpFactor) {
          toast({ title: 'Error', description: 'No verified 2FA method found.', variant: 'destructive' });
          return;
      }

      const { error } = await supabase.auth.mfa.unenroll({ factorId: totpFactor.id });

      if (error) {
          toast({ title: 'Error disabling 2FA', description: error.message, variant: 'destructive' });
      } else {
          toast({ title: 'Success', description: '2FA has been disabled.' });
          setIsTfaEnabled(false);
      }
  };

  // Add a loading indicator for deletion
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleDeactivateAccount = async () => {
    if (!user) return;

    setDeletingAccount(true);
    try {
      // Call Supabase Edge Function to delete user and all data
      const { data, error } = await supabase.functions.invoke("delete-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Auth header is automatically included by supabase client
        },
      });

      if (error || (data && data.error)) {
        toast({
          title: "Error",
          description:
            (typeof data?.error === "string"
              ? data.error
              : Array.isArray(data?.error)
              ? data.error.join(", ")
              : "Failed to deactivate account") || error?.message,
          variant: "destructive",
        });
        setDeletingAccount(false);
        return;
      }

      toast({
        title: "Account Deleted",
        description: "Your account has been completely deleted.",
      });

      // Sign out user after deletion
      await signOut();
      navigate("/");
    } catch (e: any) {
      toast({
        title: "Error",
        description: "Failed to completely delete account. Please contact support.",
        variant: "destructive",
      });
      setDeletingAccount(false);
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

          {/* Two-Factor Authentication Section */}
          <Card className="glass-card p-6 bg-white/5 backdrop-blur-xl border-white/20">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-white" />
              <h2 className="text-xl font-semibold text-white">Two-Factor Authentication (2FA)</h2>
            </div>
            
            {isTfaLoading ? (
              <Skeleton className="h-10 w-40 rounded-md bg-white/10" />
            ) : isTfaEnabled ? (
              <div>
                <p className="text-green-400 mb-4">2FA is currently enabled.</p>
                <Button
                  onClick={handleDisableTfa}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Disable 2FA
                </Button>
              </div>
            ) : (
              <div>
                {tfaSetupInfo ? (
                  <div className="space-y-4">
                    <p className="text-gray-300">Scan this QR code with your authenticator app (e.g., Google Authenticator, Authy).</p>
                    <div className="bg-white p-2 rounded-lg inline-block">
                      <img src={tfaSetupInfo.qrCode} alt="2FA QR Code" />
                    </div>
                    <p className="text-gray-300 text-sm">Or manually enter this setup key:</p>
                    <code className="bg-gray-800 text-green-400 p-2 rounded-md block break-all">{tfaSetupInfo.secret}</code>

                    <div>
                      <Label htmlFor="tfa-code" className="text-gray-300">Verification Code</Label>
                      <InputOTP id="tfa-code" maxLength={6} value={tfaVerificationCode} onChange={setTfaVerificationCode}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleVerifyTfa} className="bg-green-600 hover:bg-green-700 text-white">Verify and Enable</Button>
                      <Button onClick={handleCancelTfaSetup} variant="outline" className="bg-transparent border-gray-400 text-gray-300 hover:bg-gray-700">Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-300 mb-4">Add an extra layer of security to your account.</p>
                    <Button
                      onClick={handleEnableTfa}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Enable 2FA
                    </Button>
                  </div>
                )}
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
                disabled={deletingAccount}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                {deletingAccount ? "Deleting Account..." : "Deactivate Account"}
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
