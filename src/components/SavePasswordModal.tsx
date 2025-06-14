
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { encryptPassword } from '@/utils/encryption';

interface PasswordGroup {
  id: string;
  name: string;
  description: string;
}

interface SavePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  password: string;
  masterPassword: string | null;
}

const SavePasswordModal: React.FC<SavePasswordModalProps> = ({
  isOpen,
  onClose,
  password,
  masterPassword
}) => {
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [expirationDays, setExpirationDays] = useState<string>('');
  const [groups, setGroups] = useState<PasswordGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchGroups();
      setTitle('Generated Password');
    }
  }, [isOpen]);

  const fetchGroups = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('password_groups')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (!error && data) {
      setGroups(data);
    }
  };

  const handleSave = async () => {
    if (!masterPassword || !user) {
      toast({
        title: "Error",
        description: "Master password required",
        variant: "destructive"
      });
      return;
    }

    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const encryptedPassword = encryptPassword(password, masterPassword);
      
      let expiresAt = null;
      if (expirationDays && parseInt(expirationDays) > 0) {
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + parseInt(expirationDays));
        expiresAt = expDate.toISOString();
      }

      const entryData = {
        user_id: user.id,
        title: title.trim(),
        username: username.trim(),
        password_encrypted: encryptedPassword,
        website: website.trim(),
        notes: notes.trim(),
        group_id: selectedGroup || null,
        expires_at: expiresAt
      };

      const { error } = await supabase
        .from('password_entries')
        .insert(entryData);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Password saved successfully"
      });

      // Reset form
      setTitle('');
      setUsername('');
      setWebsite('');
      setNotes('');
      setSelectedGroup('');
      setExpirationDays('');
      onClose();
    } catch (error) {
      console.error('Error saving password:', error);
      toast({
        title: "Error",
        description: "Failed to save password",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card bg-white/5 backdrop-blur-xl border-white/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Save Password</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-gray-300">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="glass-input bg-white/5 border-white/20 text-white"
              placeholder="Enter title"
            />
          </div>

          <div>
            <Label htmlFor="username" className="text-gray-300">Username/Email</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="glass-input bg-white/5 border-white/20 text-white"
              placeholder="Enter username or email"
            />
          </div>

          <div>
            <Label htmlFor="website" className="text-gray-300">Website</Label>
            <Input
              id="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="glass-input bg-white/5 border-white/20 text-white"
              placeholder="Enter website URL"
            />
          </div>

          <div>
            <Label htmlFor="group" className="text-gray-300">Group</Label>
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger className="glass-input bg-white/5 border-white/20 text-white">
                <SelectValue placeholder="Select a group (optional)" />
              </SelectTrigger>
              <SelectContent className="glass-card bg-white/10 backdrop-blur-xl border-white/20">
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id} className="text-white">
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="expiration" className="text-gray-300">Expiration (days)</Label>
            <Input
              id="expiration"
              type="number"
              value={expirationDays}
              onChange={(e) => setExpirationDays(e.target.value)}
              className="glass-input bg-white/5 border-white/20 text-white"
              placeholder="Days until expiration (optional)"
              min="1"
            />
          </div>

          <div>
            <Label htmlFor="notes" className="text-gray-300">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="glass-input bg-white/5 border-white/20 text-white"
              placeholder="Additional notes"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1 glass-button bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? 'Saving...' : 'Save Password'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SavePasswordModal;
