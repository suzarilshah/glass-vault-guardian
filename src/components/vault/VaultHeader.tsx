
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Download, Users, Settings, Lock } from 'lucide-react';

interface VaultHeaderProps {
  remainingTime: number;
  onShowTimerSettings: () => void;
  onShowGroupManager: () => void;
  onExportPasswords: () => void;
  onShowForm: () => void;
}

const VaultHeader: React.FC<VaultHeaderProps> = ({
  remainingTime,
  onShowTimerSettings,
  onShowGroupManager,
  onExportPasswords,
  onShowForm
}) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold text-white">Password Vault</h2>
        <div className="flex items-center gap-2 px-3 py-1 bg-green-600/20 rounded-lg border border-green-500/30">
          <Lock className="w-4 h-4 text-green-400" />
          <span className="text-green-400 text-sm font-medium">
            Auto-lock: {formatTime(remainingTime)}
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={onShowTimerSettings}
          variant="outline"
          className="border-white/20 text-gray-300 hover:bg-gray-700 hover:text-white"
        >
          <Settings className="w-4 h-4 mr-2" />
          Timer
        </Button>
        <Button
          onClick={onShowGroupManager}
          variant="outline"
          className="border-white/20 text-gray-300 hover:bg-gray-700 hover:text-white"
        >
          <Users className="w-4 h-4 mr-2" />
          Manage Groups
        </Button>
        <Button
          onClick={onExportPasswords}
          variant="outline"
          className="border-white/20 text-gray-300 hover:bg-gray-700 hover:text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
        <Button
          onClick={onShowForm}
          className="glass-button bg-green-600 hover:bg-green-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Password
        </Button>
      </div>
    </div>
  );
};

export default VaultHeader;
