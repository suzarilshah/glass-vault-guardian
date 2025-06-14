import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PasswordGroup {
  id: string;
  name: string;
  description: string;
}

interface GroupManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const GroupManager: React.FC<GroupManagerProps> = ({ isOpen, onClose }) => {
  const [groups, setGroups] = useState<PasswordGroup[]>([]);
  const [newGroupData, setNewGroupData] = useState({ name: '', description: '' });
  const [editingGroup, setEditingGroup] = useState<PasswordGroup | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
        toast({
          title: "Error",
          description: "Failed to fetch groups",
          variant: "destructive"
        });
        return;
      }

      if (data) {
        setGroups(data);
      }
    } catch (error) {
      console.error('Error in fetchGroups:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
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

    setIsLoading(true);

    try {
      const groupData = {
        user_id: user.id,
        name: newGroupData.name.trim(),
        description: newGroupData.description.trim()
      };

      const { error } = await supabase
        .from('password_groups')
        .insert(groupData);

      if (error) {
        console.error('Error creating group:', error);
        toast({
          title: "Error",
          description: "Failed to create group",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Group created successfully"
      });

      setNewGroupData({ name: '', description: '' });
      await fetchGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Error",
        description: "Failed to create group",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateGroup = async () => {
    if (!user || !editingGroup || !editingGroup.id) {
      toast({
        title: "Error",
        description: "Invalid group data",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('password_groups')
        .update({
          name: newGroupData.name.trim(),
          description: newGroupData.description.trim()
        })
        .eq('id', editingGroup.id);

      if (error) {
        console.error('Error updating group:', error);
        toast({
          title: "Error",
          description: "Failed to update group",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Group updated successfully"
      });

      setEditingGroup(null);
      setNewGroupData({ name: '', description: '' });
      await fetchGroups();
    } catch (error) {
      console.error('Error updating group:', error);
      toast({
        title: "Error",
        description: "Failed to update group",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!user || !groupId) {
      toast({
        title: "Error",
        description: "Invalid group ID",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('password_groups')
        .delete()
        .eq('id', groupId);

      if (error) {
        console.error('Error deleting group:', error);
        toast({
          title: "Error",
          description: "Failed to delete group",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Group deleted successfully"
      });

      await fetchGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: "Error",
        description: "Failed to delete group",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditGroup = (group: PasswordGroup) => {
    setEditingGroup(group);
    setNewGroupData({ name: group.name, description: group.description });
  };

  const handleClose = () => {
    setNewGroupData({ name: '', description: '' });
    setEditingGroup(null);
    setIsLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass-card bg-white/5 backdrop-blur-xl border-white/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Manage Groups</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-gray-300">Group Name</Label>
            <Input
              id="name"
              value={newGroupData.name}
              onChange={(e) => setNewGroupData(prev => ({ ...prev, name: e.target.value }))}
              className="glass-input bg-white/5 border-white/20 text-white"
              placeholder="Enter group name"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-gray-300">Description (optional)</Label>
            <Textarea
              id="description"
              value={newGroupData.description}
              onChange={(e) => setNewGroupData(prev => ({ ...prev, description: e.target.value }))}
              className="glass-input bg-white/5 border-white/20 text-white"
              placeholder="Enter description"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={editingGroup ? handleUpdateGroup : handleCreateGroup}
              disabled={isLoading}
              className="flex-1 glass-button bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? 'Saving...' : editingGroup ? 'Update Group' : 'Create Group'}
            </Button>
            {editingGroup && (
              <Button
                onClick={() => {
                  setEditingGroup(null);
                  setNewGroupData({ name: '', description: '' });
                }}
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                Cancel Edit
              </Button>
            )}
          </div>

          {groups.length > 0 ? (
            <div className="space-y-2">
              <Label className="text-gray-300">Existing Groups</Label>
              <ScrollArea className="h-[200px] w-full rounded-md border bg-white/5 border-white/20">
                <div className="p-3 space-y-2">
                  {groups.map((group) => (
                    <div key={group.id} className="flex items-center justify-between p-2 rounded bg-white/5 hover:bg-white/10">
                      <div className="text-white">{group.name}</div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEditGroup(group)}
                          variant="ghost"
                          size="sm"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteGroup(group.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <p className="text-gray-400">No groups created yet.</p>
          )}

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleClose}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupManager;
