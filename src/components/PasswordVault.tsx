
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Copy, Edit, Trash2, Eye, EyeOff, Download, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { encryptPassword, decryptPassword, hashMasterPassword } from '@/utils/encryption';
import MasterPasswordModal from './MasterPasswordModal';

interface PasswordEntry {
  id: string;
  title: string;
  username: string;
  password_encrypted: string;
  website: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

const PasswordVault = () => {
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [masterPassword, setMasterPassword] = useState<string | null>(null);
  const [showMasterModal, setShowMasterModal] = useState(false);
  const [isCreatingMaster, setIsCreatingMaster] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PasswordEntry | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    username: '',
    password: '',
    website: '',
    notes: ''
  });
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      checkMasterPassword();
    }
  }, [user]);

  useEffect(() => {
    if (masterPassword) {
      fetchEntries();
    }
  }, [masterPassword]);

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
        toast({
          title: "Success",
          description: "Vault unlocked"
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

  const saveEntry = async () => {
    if (!masterPassword) return;

    try {
      const encryptedPassword = encryptPassword(formData.password, masterPassword);
      
      const entryData = {
        user_id: user?.id,
        title: formData.title,
        username: formData.username,
        password_encrypted: encryptedPassword,
        website: formData.website,
        notes: formData.notes
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

      setFormData({ title: '', username: '', password: '', website: '', notes: '' });
      setEditingEntry(null);
      setShowForm(false);
      fetchEntries();
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
      setFormData({
        title: entry.title,
        username: entry.username,
        password: decryptedPassword,
        website: entry.website,
        notes: entry.notes
      });
      setEditingEntry(entry);
      setShowForm(true);
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
  };

  const exportPasswords = async () => {
    if (!masterPassword) return;

    try {
      const decryptedEntries = entries.map(entry => ({
        title: entry.title,
        username: entry.username,
        password: decryptPassword(entry.password_encrypted, masterPassword),
        website: entry.website,
        notes: entry.notes
      }));

      const csvContent = [
        'Title,Username,Password,Website,Notes',
        ...decryptedEntries.map(entry => 
          `"${entry.title}","${entry.username}","${entry.password}","${entry.website}","${entry.notes}"`
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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export passwords",
        variant: "destructive"
      });
    }
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Password Vault</h2>
        <div className="flex gap-2">
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
            <Input
              placeholder="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="glass-input bg-white/5 border-white/20 text-white"
            />
            <Input
              placeholder="Website"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              className="glass-input bg-white/5 border-white/20 text-white"
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
                setFormData({ title: '', username: '', password: '', website: '', notes: '' });
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
        {entries.map((entry) => (
          <Card key={entry.id} className="glass-card p-4 bg-white/5 backdrop-blur-xl border-white/20">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">{entry.title}</h3>
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
                {entry.notes && (
                  <p className="text-gray-400 text-sm mt-2">{entry.notes}</p>
                )}
              </div>
              <div className="flex gap-2">
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
        ))}
      </div>

      {entries.length === 0 && (
        <Card className="glass-card p-8 text-center bg-white/5 backdrop-blur-xl border-white/20">
          <h3 className="text-lg font-semibold text-white mb-2">No passwords saved yet</h3>
          <p className="text-gray-400 mb-4">Start building your secure password vault</p>
          <Button
            onClick={() => setShowForm(true)}
            className="glass-button bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Password
          </Button>
        </Card>
      )}
    </div>
  );
};

export default PasswordVault;
