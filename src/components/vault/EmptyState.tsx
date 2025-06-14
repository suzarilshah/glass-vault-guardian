
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  selectedGroup: string;
  onShowForm: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ selectedGroup, onShowForm }) => {
  return (
    <Card className="glass-card p-8 text-center bg-white/5 backdrop-blur-xl border-white/20">
      <h3 className="text-lg font-semibold text-white mb-2">No passwords found</h3>
      <p className="text-gray-400 mb-4">
        {selectedGroup === 'all' 
          ? 'Start building your secure password vault' 
          : 'No passwords in this group'
        }
      </p>
      <Button
        onClick={onShowForm}
        className="glass-button bg-green-600 hover:bg-green-700 text-white"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Your First Password
      </Button>
    </Card>
  );
};

export default EmptyState;
