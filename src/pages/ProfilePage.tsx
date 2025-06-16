import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, User, Mail, Save, AlertTriangle, Lock, Key, Shield, Settings, Phone } from 'lucide-react';
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
    // Basic phone number validation - supports international formats
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

    // Validate phone number if provided
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
          <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
        </div>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8 bg-white/10 backdrop-blur-xl border-white/20">
            <TabsTrigger value="personal" className="flex items-center gap-2 text-white data-[state=active]:bg-white data-[state=active]:text-gray-900">
              <User className="w-4 h-4" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="master-password" className="flex items-center gap-2 text-white data-[state=active]:bg-white data-[state=active]:text-gray-900">
              <Key className="w-4 h-4" />
              Master Password
            </TabsTrigger>
            <TabsTrigger value="account-security" className="flex items-center gap-2 text-white data-[state=active]:bg-white data-[state=active]:text-gray-900">
              <Lock className="w-4 h-4" />
              Account Security
            </TabsTrigger>
            <TabsTrigger value="two-factor" className="flex items-center gap-2 text-white data-[state=active]:bg-white data-[state=active]:text-gray-900">
              <ShieldCheck className="w-4 h-4" />
              2FA
            </TabsTrigger>
            <TabsTrigger value="account-management" className="flex items-center gap-2 text-white data-[state=active]:bg-white data-[state=active]:text-gray-900">
              <Settings className="w-4 h-4" />
              Account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
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

                <div>
                  <Label htmlFor="phoneNumber" className="text-gray-300">Phone Number</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={profile.phone_number}
                      onChange={(e) => setProfile(prev => ({ ...prev, phone_number: e.target.value }))}
                      className="glass-input bg-white/5 border-white/20 text-white"
                      placeholder="Enter your phone number (optional)"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Phone number may be used for account recovery or future 2FA implementation
                  </p>
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
          </TabsContent>

          <TabsContent value="master-password">
            <MasterPasswordSettings profile={profile} />
          </TabsContent>

          <TabsContent value="account-security">
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

              <div className="mb-4 p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                <p className="text-amber-200 text-sm">
                  <strong>Security Recommendation:</strong> Your account password must be different from your master password for enhanced security. This helps protect your vault even if your account credentials are compromised.
                </p>
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
          </TabsContent>

          <TabsContent value="two-factor">
            <Card className="glass-card p-6 bg-white/5 backdrop-blur-xl border-white/20">
              <div className="flex items-center gap-2 mb-6">
                <ShieldCheck className="w-5 h-5 text-white" />
                <h2 className="text-xl font-semibold text-white">Two-Factor Authentication (2FA)</h2>
              </div>
              
              <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="text-blue-200 text-sm">
                  <strong>Enhanced Security:</strong> Two-Factor Authentication adds an extra layer of security to your account. When enabled, you'll need to enter a verification code from your authenticator app in addition to your password when signing in.
                </p>
              </div>
              
              {isTfaLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32 rounded bg-white/10" />
                  <Skeleton className="h-10 w-40 rounded bg-white/10" />
                </div>
              ) : isTfaEnabled ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                    <ShieldCheck className="w-5 h-5 text-green-400" />
                    <span className="text-green-200 font-medium">2FA is currently enabled and protecting your account</span>
                  </div>
                  <Button
                    onClick={handleDisableTfa}
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Disable 2FA
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {tfaSetupInfo ? (
                    <div className="space-y-6">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-white mb-2">Set Up Your Authenticator App</h3>
                        <p className="text-gray-300 mb-4">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
                      </div>
                      
                      <div className="flex justify-center">
                        <div className="bg-white p-4 rounded-lg">
                          <img src={tfaSetupInfo.qrCode} alt="2FA QR Code" className="w-48 h-48" />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-gray-300 text-sm text-center">Or manually enter this setup key:</p>
                        <div className="bg-gray-800 p-3 rounded-lg">
                          <code className="text-green-400 text-sm break-all block text-center">{tfaSetupInfo.secret}</code>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="tfa-code" className="text-gray-300 block text-center">Enter the 6-digit verification code from your app:</Label>
                        <div className="flex justify-center">
                          <InputOTP 
                            id="tfa-code" 
                            maxLength={6} 
                            value={tfaVerificationCode} 
                            onChange={setTfaVerificationCode}
                            className="gap-2"
                          >
                            <InputOTPGroup className="gap-2">
                              <InputOTPSlot index={0} className="w-12 h-12 border-2 border-white/20 bg-white text-black text-lg font-semibold" />
                              <InputOTPSlot index={1} className="w-12 h-12 border-2 border-white/20 bg-white text-black text-lg font-semibold" />
                              <InputOTPSlot index={2} className="w-12 h-12 border-2 border-white/20 bg-white text-black text-lg font-semibold" />
                            </InputOTPGroup>
                            <InputOTPSeparator className="text-white" />
                            <InputOTPGroup className="gap-2">
                              <InputOTPSlot index={3} className="w-12 h-12 border-2 border-white/20 bg-white text-black text-lg font-semibold" />
                              <InputOTPSlot index={4} className="w-12 h-12 border-2 border-white/20 bg-white text-black text-lg font-semibold" />
                              <InputOTPSlot index={5} className="w-12 h-12 border-2 border-white/20 bg-white text-black text-lg font-semibold" />
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                      </div>

                      <div className="flex gap-3 justify-center">
                        <Button 
                          onClick={handleVerifyTfa} 
                          disabled={tfaVerificationCode.length !== 6}
                          className="bg-green-600 hover:bg-green-700 text-white px-6"
                        >
                          Verify and Enable 2FA
                        </Button>
                        <Button 
                          onClick={handleCancelTfaSetup} 
                          variant="outline" 
                          className="bg-transparent border-gray-400 text-gray-300 hover:bg-gray-700 px-6"
                        >
                          Cancel Setup
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-white">Enable Two-Factor Authentication</h3>
                        <p className="text-gray-300">Protect your account with an additional security layer</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-gray-400 text-sm">You'll need an authenticator app like:</p>
                        <div className="flex justify-center gap-4 text-sm text-gray-300">
                          <span>• Google Authenticator</span>
                          <span>• Authy</span>
                          <span>• Microsoft Authenticator</span>
                        </div>
                      </div>
                      <Button
                        onClick={handleEnableTfa}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                      >
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        Enable 2FA
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="account-management">
            <Card className="glass-card p-6 bg-red-900/10 backdrop-blur-xl border-red-500/30">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h2 className="text-xl font-semibold text-red-400">Danger Zone</h2>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-red-900/20 border border-red-500/40 rounded-lg">
                  <h3 className="text-red-300 font-semibold mb-2">⚠️ CRITICAL WARNING</h3>
                  <p className="text-red-200 text-sm leading-relaxed">
                    <strong>Account deactivation is PERMANENT and IRREVERSIBLE.</strong> This action will immediately and permanently delete:
                  </p>
                  <ul className="text-red-200 text-sm mt-2 ml-4 space-y-1">
                    <li>• All stored passwords and their history</li>
                    <li>• All API credentials and keys</li>
                    <li>• All certificates and private keys</li>
                    <li>• Your user profile and preferences</li>
                    <li>• ALL vault data associated with your account</li>
                  </ul>
                  <p className="text-red-200 text-sm mt-3">
                    <strong>There is NO way to recover this data once deleted.</strong> Please ensure you have backed up any critical information before proceeding.
                  </p>
                </div>

                <Button
                  onClick={() => setShowDeactivateConfirm(true)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={deletingAccount}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  {deletingAccount ? "Permanently Deleting Account..." : "Permanently Delete Account"}
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ConfirmationDialog
        isOpen={showDeactivateConfirm}
        onClose={() => setShowDeactivateConfirm(false)}
        onConfirm={handleDeactivateAccount}
        title="Permanently Delete Account"
        message="Are you absolutely certain you want to permanently delete your account? This action cannot be undone and will permanently destroy all your vault data, passwords, API credentials, and certificates. Type 'DELETE' to confirm this irreversible action."
        confirmText="Permanently Delete Account"
        isDangerous={true}
      />
    </div>
  );
};

export default ProfilePage;
