
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ExpiredApiKeysAlertProps {
  expiredCount: number;
}

const ExpiredApiKeysAlert: React.FC<ExpiredApiKeysAlertProps> = ({ expiredCount }) => {
  return (
    <Alert className="border-red-500/30 bg-red-500/10 text-red-300">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        You have {expiredCount} expired API key{expiredCount > 1 ? 's' : ''}. 
        Please review and update them to maintain security.
      </AlertDescription>
    </Alert>
  );
};

export default ExpiredApiKeysAlert;
