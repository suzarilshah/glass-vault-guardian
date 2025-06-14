
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TimerSettingsProps {
  lockTimeoutMinutes: number;
  onTimeoutChange: (minutes: number) => void;
  onClose?: () => void;
}

const TimerSettings: React.FC<TimerSettingsProps> = ({
  lockTimeoutMinutes,
  onTimeoutChange,
  onClose
}) => {
  return (
    <Card className="glass-card p-4 bg-white/5 backdrop-blur-xl border-white/20">
      <h3 className="text-lg font-semibold text-white mb-3">Auto-lock Timer Settings</h3>
      <div className="flex items-center gap-4">
        <label className="text-gray-300 text-sm">Lock after:</label>
        <Select 
          value={lockTimeoutMinutes.toString()} 
          onValueChange={(value) => onTimeoutChange(parseInt(value))}
        >
          <SelectTrigger className="w-32 glass-input bg-white/5 border-white/20 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="glass-card bg-gray-800 backdrop-blur-xl border-white/20">
            <SelectItem value="1" className="text-white hover:bg-white/10">1 minute</SelectItem>
            <SelectItem value="5" className="text-white hover:bg-white/10">5 minutes</SelectItem>
            <SelectItem value="10" className="text-white hover:bg-white/10">10 minutes</SelectItem>
            <SelectItem value="15" className="text-white hover:bg-white/10">15 minutes</SelectItem>
            <SelectItem value="30" className="text-white hover:bg-white/10">30 minutes</SelectItem>
            <SelectItem value="60" className="text-white hover:bg-white/10">1 hour</SelectItem>
          </SelectContent>
        </Select>
        {onClose && (
          <Button
            onClick={onClose}
            size="sm"
            variant="outline"
            className="bg-green-600 hover:bg-green-700 text-black border-green-500 hover:border-green-400 font-semibold"
          >
            Done
          </Button>
        )}
      </div>
    </Card>
  );
};

export default TimerSettings;
