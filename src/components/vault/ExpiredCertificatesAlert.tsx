
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Edit, Clock } from 'lucide-react';
import { CertificateEntry } from '@/types/certificateVault';

interface ExpiredCertificatesAlertProps {
  expiredEntries: CertificateEntry[];
  onEditEntry: (entry: CertificateEntry) => void;
}

const ExpiredCertificatesAlert: React.FC<ExpiredCertificatesAlertProps> = ({
  expiredEntries,
  onEditEntry
}) => {
  const expiringSoonEntries = expiredEntries.filter(entry => {
    if (!entry.expires_at || entry.is_expired) return false;
    const daysUntilExpiry = Math.ceil((new Date(entry.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  });

  const expiredCertificates = expiredEntries.filter(entry => entry.is_expired);

  if (expiredCertificates.length === 0 && expiringSoonEntries.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {expiredCertificates.length > 0 && (
        <Alert className="border-red-500/50 bg-red-900/20 backdrop-blur-xl">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300">
            <div className="flex items-center justify-between">
              <div>
                <strong>{expiredCertificates.length}</strong> certificate{expiredCertificates.length !== 1 ? 's have' : ' has'} expired
              </div>
              <div className="flex gap-2">
                {expiredCertificates.slice(0, 3).map((entry) => (
                  <Button
                    key={entry.id}
                    size="sm"
                    variant="outline"
                    onClick={() => onEditEntry(entry)}
                    className="border-red-500/50 text-red-300 hover:bg-red-900/30"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    {entry.title}
                  </Button>
                ))}
                {expiredCertificates.length > 3 && (
                  <span className="text-sm text-red-400 self-center">
                    +{expiredCertificates.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {expiringSoonEntries.length > 0 && (
        <Alert className="border-yellow-500/50 bg-yellow-900/20 backdrop-blur-xl">
          <Clock className="h-4 w-4 text-yellow-400" />
          <AlertDescription className="text-yellow-300">
            <div className="flex items-center justify-between">
              <div>
                <strong>{expiringSoonEntries.length}</strong> certificate{expiringSoonEntries.length !== 1 ? 's expire' : ' expires'} within 30 days
              </div>
              <div className="flex gap-2">
                {expiringSoonEntries.slice(0, 3).map((entry) => (
                  <Button
                    key={entry.id}
                    size="sm"
                    variant="outline"
                    onClick={() => onEditEntry(entry)}
                    className="border-yellow-500/50 text-yellow-300 hover:bg-yellow-900/30"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    {entry.title}
                  </Button>
                ))}
                {expiringSoonEntries.length > 3 && (
                  <span className="text-sm text-yellow-400 self-center">
                    +{expiringSoonEntries.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ExpiredCertificatesAlert;
