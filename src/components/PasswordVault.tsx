import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Copy, Edit, Trash2, Eye, EyeOff, Download, Save, RefreshCw, Clock, AlertTriangle, Users, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { encryptPassword, decryptPassword, hashMasterPassword } from '@/utils/encryption';
import MasterPasswordModal from './MasterPasswordModal';
import GroupManager from './GroupManager';

interface PasswordGroup {
  id: string;
  name: string;
  description: string;
}

interface PasswordEntry {
  id: string;
  title: string;
  username: string;
  password_encrypted: string;
  website: string;
  notes: string;
  group_id: string | null;
  expires_at: string | null;
  is_expired: boolean;
  created_at: string;
  updated_at: string;
}

interface PasswordVaultProps {
  masterPassword?: string | null;
  onMasterPasswordSet?: (password: string) => void;
}

const PasswordVault: React.FC<PasswordVaultProps> = ({ masterPassword: propMasterPassword, onMasterPasswordSet }) => {
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [groups, setGroups] = useState<PasswordGroup[]>([]);
  const [masterPassword, setMasterPassword] = useState<string | null>(propMasterPassword || null);
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [isCreatingMaster, setIsCreatingMaster] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PasswordEntry | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [formData, setFormData] = useState({
    title: '',
    username: '',
    password: '',
    website: '',
    notes: '',
    group_id: '',
    expiration_days: ''
  });
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [lockTimer, setLockTimer] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const { user } = useAuth();
  const { toast } = useToast();

  const LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

  useEffect(() => {
    if (user && !masterPassword) {
      checkMasterPassword();
    }
  }, [user]);

  useEffect(() => {
    if (masterPassword) {
      fetchEntries();
      fetchGroups();
      startLockTimer();
    }
  }, [masterPassword]);

  useEffect(() => {
    return () => {
      if (lockTimer) {
        clearTimeout(lockTimer);
      }
    };
  }, [lockTimer]);

  const startLockTimer = () => {
    if (lockTimer) {
      clearTimeout(lockTimer);
    }

    const startTime = Date.now();
    setRemainingTime(LOCK_TIMEOUT / 1000);

    // Update countdown every second
    const countdownInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, Math.ceil((LOCK_TIMEOUT - elapsed) / 1000));
      setRemainingTime(remaining);

      if (remaining === 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);

    // Set main timer
    const newTimer = setTimeout(() => {
      clearInterval(countdownInterval);
      setMasterPassword(null);
      setVisiblePasswords(new Set());
      setShowForm(false);
      setEditingEntry(null);
      toast({
        title: "Vault Locked",
        description: "Your vault has been automatically locked for security",
        variant: "destructive"
      });
    }, LOCK_TIMEOUT);

    setLockTimer(newTimer);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const checkMasterPassword = async () => {
    const { data, error } = await supabase
      .from('user_master_passwords')
      .select('*')
      .eq('user_id', user?.id)
      .maybeSingle();

    if (error) {
      console.error('Error checking master password:', error);
      return;
    }

    if (!data) {
      setIsCreatingMaster(true);
      setShowMasterModal(true);
    } else {
      setShowMasterModal(true);
    }
  };

  const handleMasterPasswordSubmit = async (password: string) => {
    const hashedPassword = hashMasterPassword(password);

    if (isCreatingMaster) {
      const { error } = await supabase
        .from('user_master_passwords')
        .insert({
          user_id: user?.id,
          master_password_hash: hashedPassword
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to set master password",
          variant: "destructive"
        });
        return;
      }

      setMasterPassword(password);
      setShowMasterModal(false);
      setIsCreatingMaster(false);
      onMasterPasswordSet?.(password);
      toast({
        title: "Success",
        description: "Master password set successfully"
      });
    } else {
      const { data, error } = await supabase
        .from('user_master_passwords')
        .select('master_password_hash')
        .eq('user_id', user?.id)
        .single();

      if (error || !data) {
        toast({
          title: "Error",
          description: "Failed to verify master password",
          variant: "destructive"
        });
        return;
      }

      if (data.master_password_hash === hashedPassword) {
        setMasterPassword(password);
        setShowMasterModal(false);
        onMasterPasswordSet?.(password);
        toast({
          title: "Success",
          description: `Vault unlocked (auto-lock in 5 minutes)`
        });
      } else {
        toast({
          title: "Error",
          description: "Incorrect master password",
          variant: "destructive"
        });
      }
    }
  };

  const fetchGroups = async () => {
    const { data, error } = await supabase
      .from('password_groups')
      .select('*')
      .eq('user_id', user?.id)
      .order('name');

    if (!error && data) {
      setGroups(data);
    }
  };

  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from('password_entries')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch password entries",
        variant: "destructive"
      });
      return;
    }

    setEntries(data || []);
  };

  const generateNewPassword = (entryId: string) => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let newPassword = '';
    for (let i = 0; i < 16; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    if (editingEntry?.id === entryId) {
      setFormData(prev => ({ ...prev, password: newPassword }));
    }
    
    return newPassword;
  };

  const regeneratePassword = async (entry: PasswordEntry) => {
    if (!masterPassword) return;

    try {
      const newPassword = generateNewPassword(entry.id);
      const encryptedPassword = encryptPassword(newPassword, masterPassword);
      
      let expiresAt = entry.expires_at;
      if (entry.expires_at) {
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + 90);
        expiresAt = expDate.toISOString();
      }

      const { error } = await supabase
        .from('password_entries')
        .update({
          password_encrypted: encryptedPassword,
          expires_at: expiresAt,
          is_expired: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', entry.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to regenerate password",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Password regenerated successfully"
      });

      fetchEntries();
      startLockTimer(); // Reset timer on activity
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to regenerate password",
        variant: "destructive"
      });
    }
  };

  const saveEntry = async () => {
    if (!masterPassword) return;

    try {
      const encryptedPassword = encryptPassword(formData.password, masterPassword);
      
      let expiresAt = null;
      if (formData.expiration_days && parseInt(formData.expiration_days) > 0) {
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + parseInt(formData.expiration_days));
        expiresAt = expDate.toISOString();
      }

      const entryData = {
        user_id: user?.id,
        title: formData.title,
        username: formData.username,
        password_encrypted: encryptedPassword,
        website: formData.website,
        notes: formData.notes,
        group_id: formData.group_id || null,
        expires_at: expiresAt,
        is_expired: false
      };

      let error;
      if (editingEntry) {
        ({ error } = await supabase
          .from('password_entries')
          .update(entryData)
          .eq('id', editingEntry.id));
      } else {
        ({ error } = await supabase
          .from('password_entries')
          .insert(entryData));
      }

      if (error) {
        toast({
          title: "Error",
          description: "Failed to save password entry",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: editingEntry ? "Password updated" : "Password saved"
      });

      setFormData({ title: '', username: '', password: '', website: '', notes: '', group_id: '', expiration_days: '' });
      setEditingEntry(null);
      setShowForm(false);
      fetchEntries();
      startLockTimer(); // Reset timer on activity
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to encrypt password",
        variant: "destructive"
      });
    }
  };

  const editEntry = (entry: PasswordEntry) => {
    if (!masterPassword) return;

    try {
      const decryptedPassword = decryptPassword(entry.password_encrypted, masterPassword);
      
      let expirationDays = '';
      if (entry.expires_at) {
        const expDate = new Date(entry.expires_at);
        const today = new Date();
        const diffTime = expDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 0) {
          expirationDays = diffDays.toString();
        }
      }

      setFormData({
        title: entry.title,
        username: entry.username,
        password: decryptedPassword,
        website: entry.website,
        notes: entry.notes,
        group_id: entry.group_id || '',
        expiration_days: expirationDays
      });
      setEditingEntry(entry);
      setShowForm(true);
      startLockTimer(); // Reset timer on activity
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to decrypt password",
        variant: "destructive"
      });
    }
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase
      .from('password_entries')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete password entry",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: "Password deleted"
    });
    fetchEntries();
    startLockTimer(); // Reset timer on activity
  };

  const copyPassword = async (entry: PasswordEntry) => {
    if (!masterPassword) return;

    try {
      const decryptedPassword = decryptPassword(entry.password_encrypted, masterPassword);
      await navigator.clipboard.writeText(decryptedPassword);
      toast({
        title: "Copied",
        description: "Password copied to clipboard"
      });
      startLockTimer(); // Reset timer on activity
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy password",
        variant: "destructive"
      });
    }
  };

  const togglePasswordVisibility = (id: string) => {
    const newVisible = new Set(visiblePasswords);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisiblePasswords(newVisible);
    startLockTimer(); // Reset timer on activity
  };

  const exportPasswords = async () => {
    if (!masterPassword) return;

    try {
      const decryptedEntries = entries.map(entry => ({
        title: entry.title,
        username: entry.username,
        password: decryptPassword(entry.password_encrypted, masterPassword),
        website: entry.website,
        notes: entry.notes,
        group: groups.find(g => g.id === entry.group_id)?.name || '',
        expires_at: entry.expires_at || '',
        is_expired: entry.is_expired
      }));

      const csvContent = [
        'Title,Username,Password,Website,Notes,Group,Expires At,Is Expired',
        ...decryptedEntries.map(entry => 
          `"${entry.title}","${entry.username}","${entry.password}","${entry.website}","${entry.notes}","${entry.group}","${entry.expires_at}","${entry.is_expired}"`
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'passwords_export.csv';
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Passwords exported to CSV"
      });
      startLockTimer(); // Reset timer on activity
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export passwords",
        variant: "destructive"
      });
    }
  };

  const filteredEntries = selectedGroup === 'all' 
    ? entries 
    : entries.filter(entry => entry.group_id === selectedGroup);

  const expiredEntries = entries.filter(entry => entry.is_expired);

  if (!masterPassword) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-6">
          <Card className="glass-card w-full max-w-md p-8 bg-white/5 backdrop-blur-xl border-white/20 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Password Vault Locked</h2>
            <p className="text-gray-400 mb-6">Enter your master password to access your vault</p>
            <Button
              onClick={() => setShowMasterModal(true)}
              className="glass-button bg-green-600 hover:bg-green-700 text-white"
            >
              Unlock Vault
            </Button>
          </Card>
        </div>
        <MasterPasswordModal
          isOpen={showMasterModal}
          onClose={() => setShowMasterModal(false)}
          onSubmit={handleMasterPasswordSubmit}
          isCreating={isCreatingMaster}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-white">Password Vault</h2>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-600/20 rounded-lg border border-green-500/30">
            <Lock className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-sm font-medium">
              Auto-lock: {formatTime(remainingTime)}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowGroupManager(true)}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Users className="w-4 h-4 mr-2" />
            Manage Groups
          </Button>
          <Button
            onClick={exportPasswords}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={() => setShowForm(true)}
            className="glass-button bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Password
          </Button>
        </div>
      </div>

      {expiredEntries.length > 0 && (
        <Card className="glass-card p-4 bg-red-900/20 backdrop-blur-xl border-red-500/30">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">
              {expiredEntries.length} password{expiredEntries.length !== 1 ? 's have' : ' has'} expired
            </span>
          </div>
        </Card>
      )}

      <div className="flex gap-4 items-center">
        <Select value={selectedGroup} onValueChange={setSelectedGroup}>
          <SelectTrigger className="w-48 glass-input bg-white/5 border-white/20 text-white">
            <SelectValue placeholder="Filter by group" />
          </SelectTrigger>
          <SelectContent className="glass-card bg-gray-800 backdrop-blur-xl border-white/20 z-50">
            <SelectItem value="all" className="text-white hover:bg-white/10">All Groups</SelectItem>
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id} className="text-white hover:bg-white/10">
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-gray-400 text-sm">
          {filteredEntries.length} password{filteredEntries.length !== 1 ? 's' : ''}
        </span>
      </div>

      {showForm && (
        <Card className="glass-card p-6 bg-white/5 backdrop-blur-xl border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingEntry ? 'Edit Password' : 'Add New Password'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="glass-input bg-white/5 border-white/20 text-white"
            />
            <Input
              placeholder="Username/Email"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              className="glass-input bg-white/5 border-white/20 text-white"
            />
            <div className="relative">
              <Input
                placeholder="Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="glass-input bg-white/5 border-white/20 text-white pr-10"
              />
              <Button
                type="button"
                onClick={() => {
                  const newPassword = generateNewPassword('');
                  setFormData(prev => ({ ...prev, password: newPassword }));
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6 text-green-400 hover:text-green-300"
                variant="ghost"
                size="sm"
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>
            <Input
              placeholder="Website"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              className="glass-input bg-white/5 border-white/20 text-white"
            />
            <Select value={formData.group_id} onValueChange={(value) => setFormData(prev => ({ ...prev, group_id: value }))}>
              <SelectTrigger className="glass-input bg-white/5 border-white/20 text-white">
                <SelectValue placeholder="Select group (optional)" />
              </SelectTrigger>
              <SelectContent className="glass-card bg-gray-800 backdrop-blur-xl border-white/20 z-50">
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id} className="text-white hover:bg-white/10">
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Expiration (days)"
              type="number"
              value={formData.expiration_days}
              onChange={(e) => setFormData(prev => ({ ...prev, expiration_days: e.target.value }))}
              className="glass-input bg-white/5 border-white/20 text-white"
              min="1"
            />
          </div>
          <Textarea
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="glass-input bg-white/5 border-white/20 text-white mt-4"
          />
          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => {
                setShowForm(false);
                setEditingEntry(null);
                setFormData({ title: '', username: '', password: '', website: '', notes: '', group_id: '', expiration_days: '' });
              }}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={saveEntry}
              className="glass-button bg-green-600 hover:bg-green-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {editingEntry ? 'Update' : 'Save'}
            </Button>
          </div>
        </Card>
      )}

      <div className="grid gap-4">
        {filteredEntries.map((entry) => {
          const groupName = groups.find(g => g.id === entry.group_id)?.name;
          const isExpired = entry.is_expired;
          const isExpiringSoon = entry.expires_at && !isExpired && 
            new Date(entry.expires_at).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000;

          return (
            <Card key={entry.id} className={`glass-card p-4 bg-white/5 backdrop-blur-xl border-white/20 ${
              isExpired ? 'border-red-500/50 bg-red-900/10' : 
              isExpiringSoon ? 'border-yellow-500/50 bg-yellow-900/10' : ''
            }`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">{entry.title}</h3>
                    {groupName && (
                      <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded">
                        {groupName}
                      </span>
                    )}
                    {isExpired && (
                      <span className="text-xs bg-red-600/20 text-red-400 px-2 py-1 rounded flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Expired
                      </span>
                    )}
                    {isExpiringSoon && (
                      <span className="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Expires Soon
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400">{entry.username}</p>
                  {entry.website && (
                    <p className="text-green-400 text-sm">{entry.website}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-gray-300 text-sm">Password:</span>
                    <span className="text-white font-mono">
                      {visiblePasswords.has(entry.id) 
                        ? (() => {
                            try {
                              return decryptPassword(entry.password_encrypted, masterPassword!);
                            } catch {
                              return '••••••••';
                            }
                          })()
                        : '••••••••'
                      }
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => togglePasswordVisibility(entry.id)}
                      className="text-gray-400 hover:text-white p-1 h-6 w-6"
                    >
                      {visiblePasswords.has(entry.id) ? 
                        <EyeOff className="w-3 h-3" /> : 
                        <Eye className="w-3 h-3" />
                      }
                    </Button>
                  </div>
                  {entry.expires_at && (
                    <p className="text-gray-400 text-sm mt-1">
                      Expires: {new Date(entry.expires_at).toLocaleDateString()}
                    </p>
                  )}
                  {entry.notes && (
                    <p className="text-gray-400 text-sm mt-2">{entry.notes}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {(isExpired || isExpiringSoon) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => regeneratePassword(entry)}
                      className="text-orange-400 hover:text-orange-300 p-2"
                      title="Regenerate password"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyPassword(entry)}
                    className="text-green-400 hover:text-green-300 p-2"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => editEntry(entry)}
                    className="text-blue-400 hover:text-blue-300 p-2"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteEntry(entry.id)}
                    className="text-red-400 hover:text-red-300 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredEntries.length === 0 && (
        <Card className="glass-card p-8 text-center bg-white/5 backdrop-blur-xl border-white/20">
          <h3 className="text-lg font-semibold text-white mb-2">No passwords found</h3>
          <p className="text-gray-400 mb-4">
            {selectedGroup === 'all' 
              ? 'Start building your secure password vault' 
              : 'No passwords in this group'
            }
          </p>
          <Button
            onClick={() => setShowForm(true)}
            className="glass-button bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Password
          </Button>
        </Card>
      )}

      <GroupManager
        isOpen={showGroupManager}
        onClose={() => {
          setShowGroupManager(false);
          fetchGroups(); // Refresh groups when modal closes
        }}
      />
    </div>
  );
};

export default PasswordVault;
