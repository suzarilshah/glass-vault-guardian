
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Download, Users, Settings, Lock, Upload, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface VaultHeaderProps {
  remainingTime: number;
  onShowTimerSettings: () => void;
  onShowGroupManager: () => void;
  onExportPasswords: () => void;
  onShowForm: () => void;
  onLockVault: () => void;
  onImportData?: () => void;
  onDownloadTemplate?: () => void;
  title?: string;
  addButtonText?: string;
  lockTimeoutMinutes?: number;
  onTimeoutChange?: (minutes: number) => void;
}

const VaultHeader: React.FC<VaultHeaderProps> = ({
  remainingTime,
  onShowTimerSettings,
  onShowGroupManager,
  onExportPasswords,
  onShowForm,
  onLockVault,
  onImportData,
  onDownloadTemplate,
  title = "Password Vault",
  addButtonText = "Add Password",
  lockTimeoutMinutes = 5,
  onTimeoutChange
}) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleTimeoutChange = (value: string) => {
    if (value === 'lock_now') {
      onLockVault();
    } else if (onTimeoutChange) {
      onTimeoutChange(parseInt(value));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-600/20 rounded-lg border border-green-500/30">
            <Lock className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-sm font-medium">
              Auto-lock: {formatTime(remainingTime)}
            </span>
            <Select value={lockTimeoutMinutes.toString()} onValueChange={handleTimeoutChange}>
              <SelectTrigger className="w-20 h-6 text-xs glass-input bg-green-600/20 border-green-500/30 text-green-400">
                <Settings className="w-3 h-3" />
              </SelectTrigger>
              <SelectContent className="glass-card bg-gray-800 backdrop-blur-xl border-white/20">
                <SelectItem value="1" className="text-white hover:bg-white/10">1 min</SelectItem>
                <SelectItem value="5" className="text-white hover:bg-white/10">5 min</SelectItem>
                <SelectItem value="10" className="text-white hover:bg-white/10">10 min</SelectItem>
                <SelectItem value="15" className="text-white hover:bg-white/10">15 min</SelectItem>
                <SelectItem value="30" className="text-white hover:bg-white/10">30 min</SelectItem>
                <SelectItem value="60" className="text-white hover:bg-white/10">1 hour</SelectItem>
                <SelectItem value="lock_now" className="text-red-400 hover:bg-red-500/10">Lock Now</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-start gap-4">
        {/* Left side buttons */}
        <div className="flex gap-2 flex-wrap">
          {onDownloadTemplate && (
            <Button
              onClick={onDownloadTemplate}
              variant="outline"
              className="bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200 hover:text-purple-900 border font-semibold"
            >
              <FileText className="w-4 h-4 mr-2" />
              Template
            </Button>
          )}
          {onImportData && (
            <Button
              onClick={onImportData}
              variant="outline"
              className="bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200 hover:text-orange-900 border font-semibold"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
          )}
          <Button
            onClick={onExportPasswords}
            variant="outline"
            className="bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200 hover:text-blue-900 border font-semibold"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Right side buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={onShowForm}
            className="glass-button bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            {addButtonText}
          </Button>
          <Button
            onClick={onShowGroupManager}
            variant="outline"
            className="bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200 hover:text-blue-900 border font-semibold"
          >
            <Users className="w-4 h-4 mr-2" />
            Manage Groups
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VaultHeader;
