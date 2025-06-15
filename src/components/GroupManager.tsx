
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Group {
  id: string;
  name: string;
  description: string;
}

interface GroupManagerProps {
  isOpen: boolean;
  onClose: () => void;
  groupType: 'password' | 'api'; // New prop to distinguish group types
}

const GroupManager: React.FC<GroupManagerProps> = ({ isOpen, onClose, groupType }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

  const tableName = groupType === 'password' ? 'password_groups' : 'api_groups';

  const fetchGroups = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('name');

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast({
        title: "Error",
        description: "Failed to fetch groups",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchGroups();
    }
  }, [isOpen, user, tableName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.name.trim()) return;

    setLoading(true);
    try {
      if (editingGroup) {
        const { error } = await supabase
          .from(tableName)
          .update({
            name: formData.name,
            description: formData.description,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingGroup.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Group updated successfully",
        });
      } else {
        const { error } = await supabase
          .from(tableName)
          .insert({
            name: formData.name,
            description: formData.description,
            user_id: user.id,
          });

        if (error) throw error;
        toast({
          title: "Success",
          description: "Group created successfully",
        });
      }

      setFormData({ name: '', description: '' });
      setEditingGroup(null);
      fetchGroups();
    } catch (error) {
      console.error('Error saving group:', error);
      toast({
        title: "Error",
        description: "Failed to save group",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setFormData({ name: group.name, description: group.description });
  };

  const handleDelete = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group?')) return;

    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', groupId);

      if (error) throw error;
      toast({
        title: "Success",
        description: "Group deleted successfully",
      });
      fetchGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: "Error",
        description: "Failed to delete group",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setEditingGroup(null);
    setFormData({ name: '', description: '' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card bg-white/10 backdrop-blur-xl border-white/20 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">
            Manage {groupType === 'password' ? 'Password' : 'API'} Groups
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Group name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="glass-input bg-white/5 border-white/20 text-white placeholder:text-gray-400"
              required
            />
          </div>
          <div>
            <Textarea
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="glass-input bg-white/5 border-white/20 text-white placeholder:text-gray-400"
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 glass-button bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              {editingGroup ? 'Update' : 'Create'} Group
            </Button>
            {editingGroup && (
              <Button
                type="button"
                onClick={handleCancel}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {groups.map((group) => (
            <div key={group.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex-1">
                <h4 className="font-medium text-white">{group.name}</h4>
                {group.description && (
                  <p className="text-sm text-gray-400">{group.description}</p>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEdit(group)}
                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(group.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupManager;
