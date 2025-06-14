import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Lock, Shield, Save, UserX } from 'lucide-react';
import { Link } from 'react-router-dom';
import ConfirmationDialog from '@/components/vault/ConfirmationDialog';

const ProfilePage: React.FC = () => {
  const { user, session, signOut } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    email: user?.email || '',
    first_name: '',
    last_name: '',
    full_name: '',
    avatar_url: '',
  });
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editMasterPassword, setEditMasterPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          toast({
            title: "Error loading profile",
            description: error.message,
            variant: "destructive"
          });
        } else if (data) {
          setProfile({
            email: user.email || '',
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            full_name: data.full_name || '',
            avatar_url: data.avatar_url || '',
          });
          setAvatarUrl(data.avatar_url || '');
        }
        setLoading(false);
      });
  }, [user, toast]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const updates = {
      first_name: profile.first_name,
      last_name: profile.last_name,
      full_name: profile.full_name,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    setSaving(false);

    if (error) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated.",
      });
    }
  };

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmail || !user) return;
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      email: editEmail,
    });
    setSaving(false);

    if (error) {
      toast({
        title: "Failed to update email",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Email updated",
        description: "Please check your inbox for a confirmation email.",
      });
      setEditEmail('');
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPassword || !user) return;
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      password: editPassword,
    });
    setSaving(false);
    if (error) {
      toast({
        title: "Password update failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Password updated",
        description: "Your password has been updated.",
      });
      setEditPassword('');
    }
  };

  const handleMasterPasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editMasterPassword) return;
    setSaving(true);

    const hash = editMasterPassword;

    const { error } = await supabase
      .from('user_master_passwords')
      .upsert(
        [
          {
            user_id: user.id,
            master_password_hash: hash,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'user_id' }
      );
    setSaving(false);
    if (error) {
      toast({
        title: "Master password update failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Master password updated",
        description: "Your master password has been updated.",
      });
      setEditMasterPassword('');
    }
  };

  const handleAccountDeactivation = async () => {
    if (!user) return;
    setSaving(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({
        deactivated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    setSaving(false);

    if (error) {
      toast({
        title: "Deactivation failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account deactivated",
        description: "Your account has been deactivated. You will be signed out.",
      });
      // Sign out the user after deactivation
      setTimeout(() => {
        signOut();
      }, 2000);
    }
    setShowDeactivateConfirm(false);
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white">Loading profile...</div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link 
              to="/" 
              className="inline-flex items-center text-green-400 hover:text-green-300 mb-4 transition-colors"
            >
              ← Back to Dashboard
            </Link>
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-white to-green-400 bg-clip-text text-transparent">
                PWShield Profile
              </h1>
              <p className="text-gray-400">Manage your account settings and security</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Information */}
            <Card className="glass-card bg-white/5 backdrop-blur-xl border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-green-400" />
                  Profile Information
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSave} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">First Name</label>
                      <Input
                        value={profile.first_name}
                        onChange={e => setProfile(p => ({ ...p, first_name: e.target.value }))}
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        placeholder="First Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Last Name</label>
                      <Input
                        value={profile.last_name}
                        onChange={e => setProfile(p => ({ ...p, last_name: e.target.value }))}
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        placeholder="Last Name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Full Name</label>
                    <Input
                      value={profile.full_name}
                      onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      placeholder="Full Name"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white border border-green-400 font-semibold transition-all duration-200"
                    disabled={saving}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Profile'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Email Settings */}
            <Card className="glass-card bg-white/5 backdrop-blur-xl border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-green-400" />
                  Email Settings
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Update your email address
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEmailUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Current Email</label>
                    <Input
                      value={profile.email}
                      disabled
                      className="bg-white/5 border-white/10 text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">New Email</label>
                    <Input
                      value={editEmail}
                      onChange={e => setEditEmail(e.target.value)}
                      type="email"
                      placeholder="Enter new email"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white border border-blue-400 font-semibold transition-all duration-200"
                    disabled={saving || !editEmail}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {saving ? 'Updating...' : 'Update Email'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Password Settings */}
            <Card className="glass-card bg-white/5 backdrop-blur-xl border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-green-400" />
                  Password Settings
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Change your account password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">New Password</label>
                    <Input
                      value={editPassword}
                      onChange={e => setEditPassword(e.target.value)}
                      type="password"
                      placeholder="Enter new password"
                      minLength={8}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                    <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white border border-orange-400 font-semibold transition-all duration-200"
                    disabled={saving || !editPassword}
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    {saving ? 'Updating...' : 'Update Password'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Master Password Settings */}
            <Card className="glass-card bg-white/5 backdrop-blur-xl border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  Master Password
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Update your vault master password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleMasterPasswordUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">New Master Password</label>
                    <Input
                      value={editMasterPassword}
                      onChange={e => setEditMasterPassword(e.target.value)}
                      type="password"
                      placeholder="Enter new master password"
                      minLength={8}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                    <p className="text-xs text-gray-500 mt-1">This secures your password vault</p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-700 text-white border border-red-400 font-semibold transition-all duration-200"
                    disabled={saving || !editMasterPassword}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    {saving ? 'Updating...' : 'Update Master Password'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Danger Zone - Account Deactivation */}
            <Card className="glass-card bg-red-900/10 backdrop-blur-xl border-red-500/50 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-red-400 flex items-center gap-2">
                  <UserX className="w-5 h-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Permanently deactivate your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                    <h4 className="text-red-400 font-medium mb-2">Account Deactivation</h4>
                    <p className="text-gray-300 text-sm mb-4">
                      Once you deactivate your account, there is no going back. This will permanently 
                      disable your account and you will be signed out immediately.
                    </p>
                    <Button
                      onClick={() => setShowDeactivateConfirm(true)}
                      className="bg-red-600 hover:bg-red-700 text-white border border-red-400"
                      disabled={saving}
                    >
                      <UserX className="w-4 h-4 mr-2" />
                      Deactivate Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={showDeactivateConfirm}
        onClose={() => setShowDeactivateConfirm(false)}
        onConfirm={handleAccountDeactivation}
        title="Deactivate Account"
        description="Are you absolutely sure you want to deactivate your account? This action is permanent and cannot be undone. All your data will be preserved but your account will be disabled."
        confirmText="Deactivate Account"
        isDangerous={true}
      />
    </>
  );
};

export default ProfilePage;
