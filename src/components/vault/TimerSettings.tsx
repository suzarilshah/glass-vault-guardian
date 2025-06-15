
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock } from 'lucide-react';

interface TimerSettingsProps {
  isOpen?: boolean;
  onClose?: () => void;
  lockTimeoutMinutes: number;
  onTimeoutChange: (minutes: number) => void;
}

const TimerSettings: React.FC<TimerSettingsProps> = ({
  isOpen,
  onClose,
  lockTimeoutMinutes,
  onTimeoutChange
}) => {
  const content = (
    <Card className="glass-card p-4 bg-white/5 backdrop-blur-xl border-white/20">
      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
        <Clock className="w-5 h-5 text-green-400" />
        Auto-lock Timer Settings
      </h3>
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
            className="bg-green-600 hover:bg-green-700 text-white border-green-500 hover:border-green-400 font-semibold"
          >
            Done
          </Button>
        )}
      </div>
    </Card>
  );

  if (isOpen && onClose) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="glass-card bg-gray-900/95 backdrop-blur-xl border-white/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Clock className="w-5 h-5 text-green-400" />
              Timer Settings
            </DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return content;
};

export default TimerSettings;
