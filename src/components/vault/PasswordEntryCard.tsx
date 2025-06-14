
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Edit, Trash2, Eye, EyeOff, RefreshCw, Clock, History } from 'lucide-react';
import { decryptPassword } from '@/utils/encryption';
import { PasswordGroup, PasswordEntry } from '@/types/vault';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import PasswordHistory from './PasswordHistory';
import ConfirmationDialog from './ConfirmationDialog';

interface PasswordEntryCardProps {
  entry: PasswordEntry;
  groups: PasswordGroup[];
  visiblePasswords: Set<string>;
  masterPassword: string;
  onToggleVisibility: (id: string) => void;
  onCopyPassword: (entry: PasswordEntry) => void;
  onEditEntry: (entry: PasswordEntry) => void;
  onDeleteEntry: (id: string) => void;
  onRegeneratePassword: (entry: PasswordEntry) => void;
}

const PasswordEntryCard: React.FC<PasswordEntryCardProps> = ({
  entry,
  groups,
  visiblePasswords,
  masterPassword,
  onToggleVisibility,
  onCopyPassword,
  onEditEntry,
  onDeleteEntry,
  onRegeneratePassword
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const groupName = groups.find(g => g.id === entry.group_id)?.name;
  const isExpired = entry.is_expired;
  const isExpiringSoon = entry.expires_at && !isExpired && 
    new Date(entry.expires_at).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000;

  const getDecryptedPassword = () => {
    try {
      return decryptPassword(entry.password_encrypted, masterPassword);
    } catch {
      return '';
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDeleteEntry(entry.id);
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <Card className={`glass-card p-4 bg-white/5 backdrop-blur-xl border-white/20 ${
        isExpired ? 'border-red-500/50 bg-red-900/10' : 
        isExpiringSoon ? 'border-yellow-500/50 bg-yellow-900/10' : ''
      }`}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-white">{entry.title}</h3>
              {groupName && (
                <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded">
                  {groupName}
                </span>
              )}
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
            <p className="text-gray-400">{entry.username}</p>
            {entry.website && (
              <p className="text-green-400 text-sm">{entry.website}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-gray-300 text-sm">Password:</span>
              <span className="text-white font-mono">
                {visiblePasswords.has(entry.id) 
                  ? getDecryptedPassword()
                  : '••••••••'
                }
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onToggleVisibility(entry.id)}
                className="text-gray-400 hover:text-white p-1 h-6 w-6"
              >
                {visiblePasswords.has(entry.id) ? 
                  <EyeOff className="w-3 h-3" /> : 
                  <Eye className="w-3 h-3" />
                }
              </Button>
            </div>

            {/* Password Strength Indicator */}
            {visiblePasswords.has(entry.id) && (
              <div className="mt-3">
                <PasswordStrengthIndicator 
                  password={getDecryptedPassword()} 
                  showWarning={true}
                />
              </div>
            )}

            {entry.expires_at && (
              <p className="text-gray-400 text-sm mt-1">
                Expires: {new Date(entry.expires_at).toLocaleDateString()}
              </p>
            )}
            {entry.notes && (
              <p className="text-gray-400 text-sm mt-2">{entry.notes}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowHistory(true)}
              className="text-purple-400 hover:text-purple-300 p-2"
              title="View password history"
            >
              <History className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRegeneratePassword(entry)}
              className="text-blue-400 hover:text-blue-300 p-2"
              title="Regenerate password"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onCopyPassword(entry)}
              className="text-green-400 hover:text-green-300 p-2"
            >
              <Copy className="w-4 h-4" />
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
              onClick={handleDeleteClick}
              className="text-red-400 hover:text-red-300 p-2"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      <PasswordHistory
        entryId={entry.id}
        masterPassword={masterPassword}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Password Entry"
        description={`Are you sure you want to delete "${entry.title}"? This action cannot be undone.`}
        confirmText="Delete"
        isDangerous={true}
      />
    </>
  );
};

export default PasswordEntryCard;
