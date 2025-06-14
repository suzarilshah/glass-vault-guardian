
import React from 'react';
import { Card } from '@/components/ui/card';

interface PasswordGroup {
  id: string;
  name: string;
  description: string;
}

interface GroupSidebarProps {
  groups: PasswordGroup[];
  selectedGroup: string;
  onGroupSelect: (groupId: string) => void;
  totalEntries: number;
  groupStats: Array<{ id: string; name: string; count: number }>;
  ungroupedCount: number;
}

const GroupSidebar: React.FC<GroupSidebarProps> = ({
  groups,
  selectedGroup,
  onGroupSelect,
  totalEntries,
  groupStats,
  ungroupedCount
}) => {
  return (
    <Card className="glass-card p-4 bg-white/5 backdrop-blur-xl border-white/20">
      <h3 className="text-lg font-semibold text-white mb-4">Groups</h3>
      <div className="space-y-2">
        <button
          onClick={() => onGroupSelect('all')}
          className={`w-full text-left p-2 rounded transition-colors ${
            selectedGroup === 'all' ? 'bg-green-600/20 text-green-400' : 'text-gray-300 hover:bg-white/10'
          }`}
        >
          <div className="flex justify-between">
            <span>All Passwords</span>
            <span className="text-sm">{totalEntries}</span>
          </div>
        </button>
        {groupStats.map((group) => (
          <button
            key={group.id}
            onClick={() => onGroupSelect(group.id)}
            className={`w-full text-left p-2 rounded transition-colors ${
              selectedGroup === group.id ? 'bg-blue-600/20 text-blue-400' : 'text-gray-300 hover:bg-white/10'
            }`}
          >
            <div className="flex justify-between">
              <span className="truncate">{group.name}</span>
              <span className="text-sm">{group.count}</span>
            </div>
          </button>
        ))}
        {ungroupedCount > 0 && (
          <button
            onClick={() => onGroupSelect('')}
            className={`w-full text-left p-2 rounded transition-colors ${
              selectedGroup === '' ? 'bg-gray-600/20 text-gray-400' : 'text-gray-300 hover:bg-white/10'
            }`}
          >
            <div className="flex justify-between">
              <span>Ungrouped</span>
              <span className="text-sm">{ungroupedCount}</span>
            </div>
          </button>
        )}
      </div>
    </Card>
  );
};

export default GroupSidebar;
