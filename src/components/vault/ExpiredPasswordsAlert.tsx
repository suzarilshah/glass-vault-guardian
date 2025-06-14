
import React from 'react';
import { Card } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface ExpiredPasswordsAlertProps {
  expiredCount: number;
}

const ExpiredPasswordsAlert: React.FC<ExpiredPasswordsAlertProps> = ({ expiredCount }) => {
  if (expiredCount === 0) return null;

  return (
    <Card className="glass-card p-4 bg-red-900/20 backdrop-blur-xl border-red-500/30">
      <div className="flex items-center gap-2 text-red-400">
        <AlertTriangle className="w-5 h-5" />
        <span className="font-medium">
          {expiredCount} password{expiredCount !== 1 ? 's have' : ' has'} expired
        </span>
      </div>
    </Card>
  );
};

export default ExpiredPasswordsAlert;
