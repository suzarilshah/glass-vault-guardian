
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PasswordGroup {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface GroupManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const GroupManager: React.FC<GroupManagerProps> = ({ isOpen, onClose }) => {
  const [groups, setGroups] = useState<PasswordGroup[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<PasswordGroup | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchGroups();
    }
  }, [isOpen]);

  const fetchGroups = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('password_groups')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch groups",
        variant: "destructive"
      });
      return;
    }

    setGroups(data || []);
  };

  const handleSaveGroup = async () => {
    if (!user || !formData.name.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const groupData = {
        user_id: user.id,
        name: formData.name.trim(),
        description: formData.description.trim()
      };

      let error;
      if (editingGroup) {
        ({ error } = await supabase
          .from('password_groups')
          .update(groupData)
          .eq('id', editingGroup.id));
      } else {
        ({ error } = await supabase
          .from('password_groups')
          .insert(groupData));
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: editingGroup ? "Group updated" : "Group created"
      });

      setFormData({ name: '', description: '' });
      setEditingGroup(null);
      setShowCreateForm(false);
      fetchGroups();
    } catch (error) {
      console.error('Error saving group:', error);
      toast({
        title: "Error",
        description: "Failed to save group",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditGroup = (group: PasswordGroup) => {
    setEditingGroup(group);
    setFormData({ name: group.name, description: group.description });
    setShowCreateForm(true);
  };

  const handleDeleteGroup = async (groupId: string) => {
    const { error } = await supabase
      .from('password_groups')
      .delete()
      .eq('id', groupId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete group",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: "Group deleted"
    });
    fetchGroups();
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditingGroup(null);
    setShowCreateForm(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card bg-white/5 backdrop-blur-xl border-white/20 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Manage Password Groups
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg text-white">Your Groups</h3>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="glass-button bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Group
            </Button>
          </div>

          {showCreateForm && (
            <Card className="glass-card p-4 bg-white/5 backdrop-blur-xl border-white/20">
              <h4 className="text-white mb-3">
                {editingGroup ? 'Edit Group' : 'Create New Group'}
              </h4>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="groupName" className="text-gray-300">Group Name *</Label>
                  <Input
                    id="groupName"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="glass-input bg-white/5 border-white/20 text-white"
                    placeholder="Enter group name"
                  />
                </div>
                <div>
                  <Label htmlFor="groupDescription" className="text-gray-300">Description</Label>
                  <Textarea
                    id="groupDescription"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="glass-input bg-white/5 border-white/20 text-white"
                    placeholder="Enter group description"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={resetForm}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveGroup}
                    disabled={isLoading}
                    className="glass-button bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isLoading ? 'Saving...' : (editingGroup ? 'Update' : 'Create')}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <div className="grid gap-3 max-h-60 overflow-y-auto">
            {groups.map((group) => (
              <Card key={group.id} className="glass-card p-3 bg-white/5 backdrop-blur-xl border-white/20">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{group.name}</h4>
                    {group.description && (
                      <p className="text-gray-400 text-sm mt-1">{group.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditGroup(group)}
                      className="text-blue-400 hover:text-blue-300 p-1"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteGroup(group.id)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {groups.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-400">No groups created yet</p>
              <p className="text-gray-500 text-sm">Create a group to organize your passwords</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupManager;
