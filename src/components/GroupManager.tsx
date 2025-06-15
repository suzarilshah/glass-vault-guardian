
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Group {
  id: string;
  name: string;
  description?: string;
}

interface GroupManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupsChanged?: () => Promise<void>;
  type: string;
}

const GroupManager: React.FC<GroupManagerProps> = ({
  isOpen,
  onClose,
  onGroupsChanged,
  type
}) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getTableName = () => {
    switch (type) {
      case 'password': return 'password_groups';
      case 'api': return 'api_groups';
      case 'certificate': return 'certificate_groups';
      default: return 'password_groups';
    }
  };

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from(getTableName())
        .select('*')
        .order('name');

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast({
        title: "Error",
        description: "Failed to fetch groups",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchGroups();
    }
  }, [isOpen, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingGroup) {
        const { error } = await supabase
          .from(getTableName())
          .update({
            name: formData.name,
            description: formData.description || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingGroup.id);

        if (error) throw error;
        toast({ title: "Success", description: "Group updated successfully" });
      } else {
        const { error } = await supabase
          .from(getTableName())
          .insert({
            name: formData.name,
            description: formData.description || null,
            user_id: (await supabase.auth.getUser()).data.user?.id
          });

        if (error) throw error;
        toast({ title: "Success", description: "Group created successfully" });
      }

      setFormData({ name: '', description: '' });
      setEditingGroup(null);
      setShowForm(false);
      await fetchGroups();
      if (onGroupsChanged) {
        await onGroupsChanged();
      }
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

  const handleDelete = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from(getTableName())
        .delete()
        .eq('id', groupId);

      if (error) throw error;
      
      toast({ title: "Success", description: "Group deleted successfully" });
      await fetchGroups();
      if (onGroupsChanged) {
        await onGroupsChanged();
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: "Error",
        description: "Failed to delete group",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setFormData({ name: group.name, description: group.description || '' });
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingGroup(null);
    setFormData({ name: '', description: '' });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-card bg-gray-900/95 backdrop-blur-xl border-white/20 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Users className="w-5 h-5 text-green-400" />
            Manage {type.charAt(0).toUpperCase() + type.slice(1)} Groups
          </DialogTitle>
        </DialogHeader>

        {!showForm ? (
          <div className="space-y-4">
            <Button
              onClick={() => setShowForm(true)}
              className="glass-button bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Group
            </Button>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {groups.map((group) => (
                <Card key={group.id} className="glass-card bg-white/5 border-white/20 p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{group.name}</h3>
                      {group.description && (
                        <p className="text-sm text-gray-400 mt-1">{group.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEdit(group)}
                        size="sm"
                        variant="outline"
                        className="border-white/20 text-gray-300 hover:bg-gray-700"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(group.id)}
                        size="sm"
                        variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              {groups.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  No groups created yet
                </div>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="groupName" className="text-gray-300">Group Name</Label>
              <Input
                id="groupName"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="glass-input bg-white/5 border-white/20 text-white"
                placeholder="Enter group name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="groupDescription" className="text-gray-300">Description (Optional)</Label>
              <Textarea
                id="groupDescription"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="glass-input bg-white/5 border-white/20 text-white"
                placeholder="Enter group description"
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingGroup(null);
                  setFormData({ name: '', description: '' });
                }}
                className="flex-1 border-white/20 text-gray-300 hover:bg-gray-700"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 glass-button bg-green-600 hover:bg-green-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : (editingGroup ? 'Update' : 'Create')}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GroupManager;
