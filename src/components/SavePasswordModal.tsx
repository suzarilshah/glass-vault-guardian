
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Save, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PasswordGroup {
  id: string;
  name: string;
  description: string;
}

interface SavePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  password: string;
}

const SavePasswordModal: React.FC<SavePasswordModalProps> = ({ 
  isOpen, 
  onClose, 
  password 
}) => {
  const [groups, setGroups] = useState<PasswordGroup[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupData, setNewGroupData] = useState({ name: '', description: '' });
  const [formData, setFormData] = useState({
    title: '',
    username: '',
    website: '',
    notes: '',
    group_id: '',
    expiration_days: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && user) {
      fetchGroups();
    }
  }, [isOpen, user]);

  const fetchGroups = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('password_groups')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) {
        console.error('Error fetching groups:', error);
        return;
      }

      if (data) {
        setGroups(data);
      }
    } catch (error) {
      console.error('Error in fetchGroups:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!user || !newGroupData.name.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingGroup(true);

    try {
      const groupData = {
        user_id: user.id,
        name: newGroupData.name.trim(),
        description: newGroupData.description.trim()
      };

      const { data, error } = await supabase
        .from('password_groups')
        .insert(groupData)
        .select()
        .single();

      if (error) {
        console.error('Error creating group:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Group created successfully"
      });

      setFormData(prev => ({ ...prev, group_id: data.id }));
      setNewGroupData({ name: '', description: '' });
      setShowCreateGroup(false);
      
      // Refresh groups list
      await fetchGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Error",
        description: "Failed to create group",
        variant: "destructive"
      });
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleSave = async () => {
    if (!user || !password) {
      toast({
        title: "Error",
        description: "Missing required information",
        variant: "destructive"
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      let expiresAt = null;
      if (formData.expiration_days && parseInt(formData.expiration_days) > 0) {
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + parseInt(formData.expiration_days));
        expiresAt = expDate.toISOString();
      }

      const entryData = {
        user_id: user.id,
        title: formData.title.trim(),
        username: formData.username.trim(),
        password_encrypted: password, // Password should already be encrypted
        website: formData.website.trim(),
        notes: formData.notes.trim(),
        group_id: formData.group_id === 'NO_GROUP' ? null : formData.group_id,
        expires_at: expiresAt,
        is_expired: false
      };

      const { error } = await supabase
        .from('password_entries')
        .insert(entryData);

      if (error) {
        console.error('Error saving password:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Password saved successfully"
      });

      handleClose();
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

  const handleClose = () => {
    setFormData({
      title: '',
      username: '',
      website: '',
      notes: '',
      group_id: '',
      expiration_days: ''
    });
    setNewGroupData({ name: '', description: '' });
    setShowCreateGroup(false);
    setIsLoading(false);
    setIsCreatingGroup(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-card bg-white/5 backdrop-blur-xl border-white/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Save Password</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-gray-300">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="glass-input bg-white/5 border-white/20 text-white"
              placeholder="Enter title"
            />
          </div>

          <div>
            <Label htmlFor="username" className="text-gray-300">Username/Email</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              className="glass-input bg-white/5 border-white/20 text-white"
              placeholder="Enter username or email"
            />
          </div>

          <div>
            <Label htmlFor="website" className="text-gray-300">Website</Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              className="glass-input bg-white/5 border-white/20 text-white"
              placeholder="Enter website URL"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="group" className="text-gray-300">Group</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateGroup(!showCreateGroup)}
                className="text-green-400 hover:text-green-300 p-1 h-auto"
              >
                <Plus className="w-3 h-3 mr-1" />
                New Group
              </Button>
            </div>
            
            {showCreateGroup && (
              <div className="space-y-2 mb-3 p-3 bg-white/5 rounded border border-white/10">
                <Input
                  placeholder="Group name"
                  value={newGroupData.name}
                  onChange={(e) => setNewGroupData(prev => ({ ...prev, name: e.target.value }))}
                  className="glass-input bg-white/5 border-white/20 text-white text-sm"
                />
                <Input
                  placeholder="Description (optional)"
                  value={newGroupData.description}
                  onChange={(e) => setNewGroupData(prev => ({ ...prev, description: e.target.value }))}
                  className="glass-input bg-white/5 border-white/20 text-white text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setShowCreateGroup(false)}
                    variant="outline"
                    className="text-xs border-white/20 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateGroup}
                    disabled={isCreatingGroup}
                    className="text-xs glass-button bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isCreatingGroup ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </div>
            )}

            <Select 
              value={formData.group_id || 'NO_GROUP'} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, group_id: value === 'NO_GROUP' ? '' : value }))}
            >
              <SelectTrigger className="glass-input bg-white/5 border-white/20 text-white">
                <SelectValue placeholder="Select group (optional)" />
              </SelectTrigger>
              <SelectContent className="glass-card bg-gray-800 backdrop-blur-xl border-white/20 z-50">
                <SelectItem value="NO_GROUP" className="text-white hover:bg-white/10">
                  (No Group)
                </SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id} className="text-white hover:bg-white/10">
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
              value={formData.expiration_days}
              onChange={(e) => setFormData(prev => ({ ...prev, expiration_days: e.target.value }))}
              className="glass-input bg-white/5 border-white/20 text-white"
              placeholder="Leave empty for no expiration"
              min="1"
            />
          </div>

          <div>
            <Label htmlFor="notes" className="text-gray-300">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="glass-input bg-white/5 border-white/20 text-white"
              placeholder="Additional notes"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/10"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1 glass-button bg-green-600 hover:bg-green-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SavePasswordModal;
