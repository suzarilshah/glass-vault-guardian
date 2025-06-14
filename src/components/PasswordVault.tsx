
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { encryptPassword, decryptPassword, hashMasterPassword } from '@/utils/encryption';
import MasterPasswordModal from './MasterPasswordModal';
import GroupManager from './GroupManager';
import VaultHeader from './vault/VaultHeader';
import TimerSettings from './vault/TimerSettings';
import ExpiredPasswordsAlert from './vault/ExpiredPasswordsAlert';
import GroupSidebar from './vault/GroupSidebar';
import PasswordEntryCard from './vault/PasswordEntryCard';
import PasswordForm from './vault/PasswordForm';
import EmptyState from './vault/EmptyState';

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
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [lockTimeoutMinutes, setLockTimeoutMinutes] = useState<number>(5);
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
  const [lockTimer, setLockTimer] = useState<NodeJS.Timeout | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const { user } = useAuth();
  const { toast } = useToast();

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
  }, [masterPassword, lockTimeoutMinutes]);

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

    const timeoutMs = lockTimeoutMinutes * 60 * 1000;
    const startTime = Date.now();
    setRemainingTime(timeoutMs / 1000);

    // Update countdown every second
    const countdownInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, Math.ceil((timeoutMs - elapsed) / 1000));
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
    }, timeoutMs);

    setLockTimer(newTimer);
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
          description: `Vault unlocked (auto-lock in ${lockTimeoutMinutes} minutes)`
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

  const generateNewPassword = () => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let newPassword = '';
    for (let i = 0; i < 16; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    setFormData(prev => ({ ...prev, password: newPassword }));
    return newPassword;
  };

  const regeneratePassword = async (entry: PasswordEntry) => {
    if (!masterPassword) return;

    try {
      const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
      let newPassword = '';
      for (let i = 0; i < 16; i++) {
        newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
      }

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
      startLockTimer();
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
      startLockTimer();
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
      startLockTimer();
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
    startLockTimer();
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
      startLockTimer();
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
    startLockTimer();
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
      startLockTimer();
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

  const getGroupStats = () => {
    const stats = groups.map(group => ({
      ...group,
      count: entries.filter(entry => entry.group_id === group.id).length
    }));
    const ungroupedCount = entries.filter(entry => !entry.group_id).length;
    return { groupStats: stats, ungroupedCount };
  };

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

  const { groupStats, ungroupedCount } = getGroupStats();

  return (
    <div className="space-y-6">
      <VaultHeader
        remainingTime={remainingTime}
        onShowTimerSettings={() => setShowTimerSettings(!showTimerSettings)}
        onShowGroupManager={() => setShowGroupManager(true)}
        onExportPasswords={exportPasswords}
        onShowForm={() => setShowForm(true)}
      />

      {showTimerSettings && (
        <TimerSettings
          lockTimeoutMinutes={lockTimeoutMinutes}
          onTimeoutChange={setLockTimeoutMinutes}
          onClose={() => setShowTimerSettings(false)}
        />
      )}

      <ExpiredPasswordsAlert expiredCount={expiredEntries.length} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1">
          <GroupSidebar
            groups={groups}
            selectedGroup={selectedGroup}
            onGroupSelect={setSelectedGroup}
            totalEntries={entries.length}
            groupStats={groupStats}
            ungroupedCount={ungroupedCount}
          />
        </div>

        <div className="md:col-span-3 space-y-4">
          {showForm && (
            <PasswordForm
              formData={formData}
              groups={groups}
              editingEntry={editingEntry}
              onFormDataChange={(data) => setFormData(prev => ({ ...prev, ...data }))}
              onGeneratePassword={generateNewPassword}
              onSave={saveEntry}
              onCancel={() => {
                setShowForm(false);
                setEditingEntry(null);
                setFormData({ title: '', username: '', password: '', website: '', notes: '', group_id: '', expiration_days: '' });
              }}
            />
          )}

          <div className="grid gap-4">
            {filteredEntries.map((entry) => (
              <PasswordEntryCard
                key={entry.id}
                entry={entry}
                groups={groups}
                visiblePasswords={visiblePasswords}
                masterPassword={masterPassword}
                onToggleVisibility={togglePasswordVisibility}
                onCopyPassword={copyPassword}
                onEditEntry={editEntry}
                onDeleteEntry={deleteEntry}
                onRegeneratePassword={regeneratePassword}
              />
            ))}
          </div>

          {filteredEntries.length === 0 && (
            <EmptyState
              selectedGroup={selectedGroup}
              onShowForm={() => setShowForm(true)}
            />
          )}
        </div>
      </div>

      <GroupManager
        isOpen={showGroupManager}
        onClose={() => {
          setShowGroupManager(false);
          fetchGroups();
        }}
      />
    </div>
  );
};

export default PasswordVault;
