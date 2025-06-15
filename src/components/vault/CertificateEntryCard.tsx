
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Download, Clock, AlertTriangle, History, Shield } from 'lucide-react';
import { CertificateGroup, CertificateEntry } from '@/types/certificateVault';
import CertificateHistory from './CertificateHistory';
import ConfirmationDialog from './ConfirmationDialog';

interface CertificateEntryCardProps {
  entry: CertificateEntry;
  groups: CertificateGroup[];
  masterPassword: string;
  onEditEntry: (entry: CertificateEntry) => void;
  onDeleteEntry: (id: string) => void;
}

const CertificateEntryCard: React.FC<CertificateEntryCardProps> = ({
  entry,
  groups,
  masterPassword,
  onEditEntry,
  onDeleteEntry
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const groupName = groups.find(g => g.id === entry.group_id)?.name;
  const isExpired = entry.is_expired;
  const isExpiringSoon = entry.expires_at && !isExpired && 
    new Date(entry.expires_at).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000; // 30 days

  const getCertificateTypeIcon = (type: string) => {
    switch (type) {
      case 'ssl':
        return <Shield className="w-4 h-4" />;
      case 'code_signing':
        return <Shield className="w-4 h-4" />;
      case 'client':
        return <Shield className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const getCertificateTypeColor = (type: string) => {
    switch (type) {
      case 'ssl':
        return 'bg-green-600/20 text-green-400';
      case 'code_signing':
        return 'bg-blue-600/20 text-blue-400';
      case 'client':
        return 'bg-purple-600/20 text-purple-400';
      default:
        return 'bg-gray-600/20 text-gray-400';
    }
  };

  return (
    <>
      <Card className={`glass-card p-4 bg-white/5 backdrop-blur-xl border-white/20 ${
        isExpired ? 'border-red-500/50 bg-red-900/10' : 
        isExpiringSoon ? 'border-yellow-500/50 bg-yellow-900/10' : ''
      }`}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h3 className="text-lg font-semibold text-white">{entry.title}</h3>
              <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${getCertificateTypeColor(entry.certificate_type)}`}>
                {getCertificateTypeIcon(entry.certificate_type)}
                {entry.certificate_type.replace('_', ' ').toUpperCase()}
              </span>
              {groupName && (
                <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded">
                  {groupName}
                </span>
              )}
              <span className={`text-xs px-2 py-1 rounded ${
                entry.environment === 'production' 
                  ? 'bg-red-600/20 text-red-400' 
                  : 'bg-yellow-600/20 text-yellow-400'
              }`}>
                {entry.environment.toUpperCase()}
              </span>
              {isExpired && (
                <span className="text-xs bg-red-600/20 text-red-400 px-2 py-1 rounded flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Expired
                </span>
              )}
              {isExpiringSoon && (
                <span className="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Expires Soon
                </span>
              )}
            </div>
            
            {entry.common_name && (
              <p className="text-gray-400 text-sm">Common Name: {entry.common_name}</p>
            )}
            {entry.issuer && (
              <p className="text-gray-400 text-sm">Issuer: {entry.issuer}</p>
            )}
            {entry.expires_at && (
              <p className="text-gray-400 text-sm">
                Expires: {new Date(entry.expires_at).toLocaleDateString()}
              </p>
            )}
            
            <div className="flex items-center gap-2 mt-2">
              <span className="text-gray-300 text-sm">Certificate:</span>
              <span className="text-green-400 text-sm">Available</span>
              {entry.private_key_encrypted && (
                <>
                  <span className="text-gray-300 text-sm">• Private Key:</span>
                  <span className="text-green-400 text-sm">Available</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowHistory(true)}
              className="text-purple-400 hover:text-purple-300 p-2"
              title="View certificate history"
            >
              <History className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-green-400 hover:text-green-300 p-2"
              title="Download certificate"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEditEntry(entry)}
              className="text-blue-400 hover:text-blue-300 p-2"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-400 hover:text-red-300 p-2"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      <CertificateHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        entryId={entry.id}
        masterPassword={masterPassword}
      />

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => onDeleteEntry(entry.id)}
        title="Delete Certificate"
        message={`Are you sure you want to delete "${entry.title}"? This action cannot be undone.`}
        confirmText="Delete"
        isDangerous={true}
      />
    </>
  );
};

export default CertificateEntryCard;
