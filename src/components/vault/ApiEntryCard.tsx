
import React from 'react';
import { Eye, EyeOff, Copy, Edit, Trash2, History, Globe, Key, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ApiEntry } from '@/types/apiVault';
import { decryptPassword } from '@/utils/encryption';

interface ApiEntryCardProps {
  entry: ApiEntry;
  masterPassword: string;
  isVisible: boolean;
  onToggleVisibility: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onShowHistory: () => void;
}

const ApiEntryCard: React.FC<ApiEntryCardProps> = ({
  entry,
  masterPassword,
  isVisible,
  onToggleVisibility,
  onCopy,
  onEdit,
  onDelete,
  onShowHistory,
}) => {
  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case 'development': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'staging': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'production': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getServiceIcon = (apiName?: string) => {
    if (!apiName) return <Key className="w-5 h-5 text-white" />;
    
    const name = apiName.toLowerCase();
    if (name.includes('openai')) return <div className="w-5 h-5 bg-green-500 rounded" />;
    if (name.includes('stripe')) return <div className="w-5 h-5 bg-purple-500 rounded" />;
    if (name.includes('aws')) return <div className="w-5 h-5 bg-orange-500 rounded" />;
    if (name.includes('google')) return <div className="w-5 h-5 bg-blue-500 rounded" />;
    if (name.includes('github')) return <div className="w-5 h-5 bg-gray-800 rounded" />;
    
    return <Key className="w-5 h-5 text-white" />;
  };

  return (
    <Card className="glass-card bg-white/5 backdrop-blur-xl border-white/20 hover:border-green-500/30 transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getServiceIcon(entry.api_name)}
            <div>
              <CardTitle className="text-white text-lg">{entry.title}</CardTitle>
              {entry.api_name && (
                <p className="text-gray-400 text-sm">{entry.api_name}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={getEnvironmentColor(entry.environment)}>
              {entry.environment}
            </Badge>
            {entry.is_expired && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Expired
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* API Key */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">API Key</label>
          <div className="flex items-center gap-2">
            <span className="text-white font-mono flex-1 p-2 bg-white/5 rounded border border-white/10">
              {isVisible 
                ? (() => {
                    try {
                      return decryptPassword(entry.api_key_encrypted, masterPassword);
                    } catch {
                      return '••••••••••••••••';
                    }
                  })()
                : '••••••••••••••••'
              }
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={onToggleVisibility}
              className="text-gray-400 hover:text-white"
            >
              {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCopy}
              className="text-gray-400 hover:text-white"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* API Secret (if exists) */}
        {entry.api_secret_encrypted && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">API Secret</label>
            <div className="flex items-center gap-2">
              <span className="text-white font-mono flex-1 p-2 bg-white/5 rounded border border-white/10">
                {isVisible 
                  ? (() => {
                      try {
                        return decryptPassword(entry.api_secret_encrypted, masterPassword);
                      } catch {
                        return '••••••••••••••••';
                      }
                    })()
                  : '••••••••••••••••'
                }
              </span>
            </div>
          </div>
        )}

        {/* Endpoint URL */}
        {entry.endpoint_url && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Endpoint</label>
            <div className="flex items-center gap-2 text-gray-400">
              <Globe className="w-4 h-4" />
              <span className="text-sm">{entry.endpoint_url}</span>
            </div>
          </div>
        )}

        {/* Description */}
        {entry.description && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Description</label>
            <p className="text-gray-400 text-sm">{entry.description}</p>
          </div>
        )}

        {/* Expiration */}
        {entry.expires_at && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Expires</label>
            <p className={`text-sm ${entry.is_expired ? 'text-red-400' : 'text-gray-400'}`}>
              {new Date(entry.expires_at).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={onEdit}
            className="text-gray-400 hover:text-white"
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onShowHistory}
            className="text-gray-400 hover:text-white"
          >
            <History className="w-4 h-4 mr-1" />
            History
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiEntryCard;
