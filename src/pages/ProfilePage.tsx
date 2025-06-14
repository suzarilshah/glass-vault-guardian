
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const ProfilePage: React.FC = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();

  // Local profile state
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

  // Update simple profile fields (name etc)
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

  // Handle email update
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

  // Handle password update
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

  // Handle master password update (assume master password handling outside supabase auth, e.g. in a user_master_passwords table)
  const handleMasterPasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editMasterPassword) return;
    setSaving(true);

    // Hash the master password before storing (for demo: store plaintext, in real app: use proper hashing)
    const hash = editMasterPassword; // Replace with hash function in real app!

    // Upsert for user_id
    const { error } = await supabase
      .from('user_master_passwords')
      .upsert([
        {
          user_id: user.id,
          master_password_hash: hash,
          updated_at: new Date().toISOString(),
        },
      ], { onConflict: ['user_id'] });
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

  // Avatar upload - TODO: integrate storage if needed

  if (!user) {
    return null;
  }
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">Loading profile...</div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pt-10 pb-16">
      <h2 className="text-2xl font-bold text-white mb-6">User Profile</h2>
      <form className="space-y-6 glass-card p-6 mb-6" onSubmit={handleProfileSave}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-gray-300 mb-1">First Name</label>
            <Input
              value={profile.first_name}
              onChange={e => setProfile(p => ({ ...p, first_name: e.target.value }))}
              className="bg-white/10 border-white/20 text-white"
              placeholder="First Name"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Last Name</label>
            <Input
              value={profile.last_name}
              onChange={e => setProfile(p => ({ ...p, last_name: e.target.value }))}
              className="bg-white/10 border-white/20 text-white"
              placeholder="Last Name"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Full Name</label>
            <Input
              value={profile.full_name}
              onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
              className="bg-white/10 border-white/20 text-white"
              placeholder="Full Name"
            />
          </div>
        </div>
        {/* Avatar (future) */}
        {/* <div>
          <label className="block text-sm text-gray-300 mb-1">Avatar URL</label>
          <Input
            value={avatarUrl}
            onChange={e => setAvatarUrl(e.target.value)}
            className="bg-white/10 border-white/20 text-white"
            placeholder="Paste image URL"
          />
        </div> */}
        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white border border-blue-400 font-semibold"
          disabled={saving}
        >
          Save Profile
        </Button>
      </form>

      {/* Email */}
      <form className="space-y-4 glass-card p-6 mb-6" onSubmit={handleEmailUpdate}>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Email</label>
          <Input
            value={profile.email}
            disabled
            className="bg-white/10 border-white/20 text-white"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Change Email</label>
          <Input
            value={editEmail}
            onChange={e => setEditEmail(e.target.value)}
            type="email"
            placeholder="Enter new email"
            className="bg-white/10 border-white/20 text-white"
          />
        </div>
        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white border border-blue-400 font-semibold"
          disabled={saving}
        >
          Update Email
        </Button>
      </form>

      {/* Password */}
      <form className="space-y-4 glass-card p-6 mb-6" onSubmit={handlePasswordUpdate}>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Change Password</label>
          <Input
            value={editPassword}
            onChange={e => setEditPassword(e.target.value)}
            type="password"
            placeholder="Enter new password"
            minLength={8}
            className="bg-white/10 border-white/20 text-white"
          />
        </div>
        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white border border-blue-400 font-semibold"
          disabled={saving}
        >
          Update Password
        </Button>
      </form>

      {/* Master Password */}
      <form className="space-y-4 glass-card p-6" onSubmit={handleMasterPasswordUpdate}>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Change Master Password</label>
          <Input
            value={editMasterPassword}
            onChange={e => setEditMasterPassword(e.target.value)}
            type="password"
            placeholder="Enter new master password"
            minLength={8}
            className="bg-white/10 border-white/20 text-white"
          />
        </div>
        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white border border-blue-400 font-semibold"
          disabled={saving}
        >
          Update Master Password
        </Button>
      </form>
    </div>
  );
};

export default ProfilePage;
