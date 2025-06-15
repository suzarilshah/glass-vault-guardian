
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Download, Users, Settings, Lock, Upload, FileText } from 'lucide-react';

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
  addButtonText = "Add Password"
}) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        {/* First line of buttons */}
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
          <Button
            onClick={onLockVault}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold border border-red-300"
          >
            <Lock className="w-4 h-4 mr-2" />
            Manual Lock
          </Button>
          <Button
            onClick={onShowTimerSettings}
            variant="outline"
            className="bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200 hover:text-blue-900 border font-semibold"
          >
            <Settings className="w-4 h-4 mr-2" />
            Timer
          </Button>
        </div>

        {/* Second line of buttons */}
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
      </div>
    </div>
  );
};

export default VaultHeader;
