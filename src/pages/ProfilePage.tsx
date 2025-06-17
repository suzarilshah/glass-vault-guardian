
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, User, Mail, Save, AlertTriangle, Lock, Settings, Phone, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ConfirmationDialog from '@/components/vault/ConfirmationDialog';
import AdvancedPasswordStrengthIndicator from '@/components/vault/AdvancedPasswordStrengthIndicator';
import { analyzePasswordStrength } from '@/utils/passwordStrength';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { ShieldCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import MasterPasswordSettings from '@/components/vault/MasterPasswordSettings';
import VaultSettings from '@/components/vault/VaultSettings';

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [tfaSetupInfo, setTfaSetupInfo] = useState<{qrCode: string, secret: string, factorId: string} | null>(null);
  const [tfaVerificationCode, setTfaVerificationCode] = useState('');
  const [isTfaEnabled, setIsTfaEnabled] = useState(false);
  const [isTfaLoading, setIsTfaLoading] = useState(true);
  const [deletingAccount, setDeletingAccount] = useState(false);

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
        .select('first_name, last_name, email, phone_number')
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
          phone_number: data.phone_number || '',
        });
      } else {
        setProfile({
          first_name: '',
          last_name: '',
          email: user.email || '',
          phone_number: '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const validatePhoneNumber = (phone: string) => {
    if (!phone.trim()) return true; // Optional field
    
    // Basic phone number validation - allows international formats
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
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

    // Validate phone number
    if (profile.phone_number && !validatePhoneNumber(profile.phone_number)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
          phone_number: profile.phone_number,
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
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
          <h1 className="text-2xl md:text-3xl font-bold text-white">Profile Settings</h1>
        </div>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-white/10 backdrop-blur-xl border-white/20 overflow-x-auto">
            <TabsTrigger value="personal" className="flex items-center gap-2 text-white data-[state=active]:bg-white data-[state=active]:text-gray-900 text-xs md:text-sm whitespace-nowrap">
              <User className="w-4 h-4" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="account-security" className="flex items-center gap-2 text-white data-[state=active]:bg-white data-[state=active]:text-gray-900 text-xs md:text-sm whitespace-nowrap">
              <Lock className="w-4 h-4" />
              Account Security
            </TabsTrigger>
            <TabsTrigger value="vault-settings" className="flex items-center gap-2 text-white data-[state=active]:bg-white data-[state=active]:text-gray-900 text-xs md:text-sm whitespace-nowrap">
              <Settings className="w-4 h-4" />
              Vault Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <div className="space-y-6">
              <Card className="glass-card p-4 md:p-6 bg-white/5 backdrop-blur-xl border-white/20">
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

                  <div>
                    <Label htmlFor="phone" className="text-gray-300">Phone Number</Label>
                    <p className="text-sm text-gray-400 mb-2">Optional - May be used for future 2FA implementation or account recovery</p>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        value={profile.phone_number}
                        onChange={(e) => setProfile(prev => ({ ...prev, phone_number: e.target.value }))}
                        className="glass-input bg-white/5 border-white/20 text-white"
                        placeholder="Enter your phone number (e.g., +1234567890)"
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

              {/* Account Deactivation Section */}
              <Card className="glass-card p-4 md:p-6 bg-red-900/10 backdrop-blur-xl border-red-500/30">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <h2 className="text-xl font-semibold text-red-400">Danger Zone</h2>
                </div>

                <div className="space-y-6">
                  <div className="p-4 bg-red-900/30 border border-red-600/50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-6 h-6 text-red-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="text-red-400 font-bold text-lg mb-2">⚠️ CRITICAL WARNING ⚠️</h3>
                        <p className="text-red-200 font-medium mb-3">
                          ACCOUNT DEACTIVATION IS COMPLETELY IRREVERSIBLE AND PERMANENT
                        </p>
                        <div className="text-red-100 text-sm space-y-2">
                          <p><strong>What will be permanently deleted:</strong></p>
                          <ul className="list-disc ml-5 space-y-1">
                            <li>Your user account and all authentication data</li>
                            <li>ALL stored passwords and password history</li>
                            <li>ALL API credentials and API key histories</li>
                            <li>ALL certificates and certificate histories</li>
                            <li>ALL password groups and organizational data</li>
                            <li>Your profile information and settings</li>
                            <li>Master password configurations</li>
                          </ul>
                          <p className="mt-3 font-medium text-red-200">
                            <strong>This action cannot be undone. There is no recovery process. 
                            Your data will be gone forever.</strong>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm">
                    Once you deactivate your account, you will be immediately signed out and all your data 
                    will be permanently erased from our systems. Consider exporting your data before proceeding.
                  </p>

                  <Button
                    onClick={() => setShowDeactivateConfirm(true)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    disabled={deletingAccount}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    {deletingAccount ? "Deleting Account..." : "Permanently Delete Account"}
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="account-security">
            <div className="space-y-6">
              <Card className="glass-card p-4 md:p-6 bg-white/5 backdrop-blur-xl border-white/20">
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

                <div className="mb-4 p-4 bg-amber-900/20 border border-amber-600/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-amber-400 font-medium mb-1">Security Recommendation</h3>
                      <p className="text-amber-200 text-sm">
                        Your account password must be different from your master password for enhanced security. 
                        Using the same password for both would compromise the security model of the password manager.
                      </p>
                    </div>
                  </div>
                </div>

                {showPasswordSection && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="newPassword" className="text-gray-300">New Password</Label>
                      <p className="text-sm text-gray-400 mb-2">Must be different from your master password</p>
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

              {/* Master Password Settings */}
              <MasterPasswordSettings profile={profile} />

              {/* 2FA Section */}
              <Card className="glass-card p-4 md:p-6 bg-white/5 backdrop-blur-xl border-white/20">
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
                          <img src={tfaSetupInfo.qrCode} alt="2FA QR Code" className="max-w-full h-auto" />
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

                        <div className="flex flex-col sm:flex-row gap-2">
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
            </div>
          </TabsContent>

          <TabsContent value="vault-settings">
            <VaultSettings />
          </TabsContent>
        </Tabs>
      </div>

      <ConfirmationDialog
        isOpen={showDeactivateConfirm}
        onClose={() => setShowDeactivateConfirm(false)}
        onConfirm={handleDeactivateAccount}
        title="Permanently Delete Account"
        message="Are you absolutely certain you want to permanently delete your account? This action is IRREVERSIBLE and will permanently destroy all your passwords, API credentials, certificates, and account data. There is no way to recover your account or data after deletion."
        confirmText="Yes, Permanently Delete My Account"
        isDangerous={true}
      />
    </div>
  );
};

export default ProfilePage;
