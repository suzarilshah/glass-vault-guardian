
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Edit, Trash2, Eye, EyeOff, AlertTriangle, ExternalLink } from 'lucide-react';
import { ApiEntry } from '@/types/apiVault';

interface ApiEntryCardProps {
  entry: ApiEntry;
  isVisible: boolean;
  onCopy: (id: string, type: 'api_key' | 'api_secret') => void;
  onToggleVisibility: (id: string) => void;
  onEdit: (entry: ApiEntry) => void;
  onDelete: (id: string) => void;
}

const ApiEntryCard: React.FC<ApiEntryCardProps> = ({
  entry,
  isVisible,
  onCopy,
  onToggleVisibility,
  onEdit,
  onDelete
}) => {
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <Card className="glass-card p-4 bg-white/5 backdrop-blur-xl border-white/20 hover:border-white/30 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">{entry.title}</h3>
          {entry.api_name && (
            <p className="text-sm text-gray-300 mb-1">{entry.api_name}</p>
          )}
          {entry.environment && (
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
              entry.environment === 'production' 
                ? 'bg-red-900/30 text-red-300' 
                : entry.environment === 'staging'
                ? 'bg-yellow-900/30 text-yellow-300'
                : 'bg-green-900/30 text-green-300'
            }`}>
              {entry.environment}
            </span>
          )}
        </div>
        
        {entry.is_expired && (
          <div className="flex items-center gap-1 text-red-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs">Expired</span>
          </div>
        )}
      </div>

      {entry.endpoint_url && (
        <div className="mb-3">
          <label className="block text-xs text-gray-400 mb-1">Endpoint URL</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm bg-gray-800 text-green-400 p-2 rounded font-mono break-all">
              {entry.endpoint_url}
            </code>
            <Button
              onClick={() => copyToClipboard(entry.endpoint_url!)}
              size="sm"
              variant="ghost"
              className="text-blue-400 hover:text-blue-300 p-1 h-8 w-8"
              title="Copy endpoint URL to clipboard"
            >
              <Copy className="w-4 h-4" />
            </Button>
            {entry.endpoint_url.startsWith('http') && (
              <Button
                onClick={() => window.open(entry.endpoint_url, '_blank')}
                size="sm"
                variant="ghost"
                className="text-blue-400 hover:text-blue-300 p-1 h-8 w-8"
                title="Open endpoint URL in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">API Key</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm bg-gray-800 text-green-400 p-2 rounded font-mono">
              {isVisible ? entry.api_key_encrypted : '••••••••••••••••'}
            </code>
            <Button
              onClick={() => onToggleVisibility(entry.id)}
              size="sm"
              variant="ghost"
              className="text-gray-400 hover:text-gray-300 p-1 h-8 w-8"
            >
              {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Button
              onClick={() => onCopy(entry.id, 'api_key')}
              size="sm"
              variant="ghost"
              className="text-blue-400 hover:text-blue-300 p-1 h-8 w-8"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {entry.api_secret_encrypted && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">API Secret</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm bg-gray-800 text-green-400 p-2 rounded font-mono">
                {isVisible ? entry.api_secret_encrypted : '••••••••••••••••'}
              </code>
              <Button
                onClick={() => onToggleVisibility(entry.id)}
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-gray-300 p-1 h-8 w-8"
              >
                {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                onClick={() => onCopy(entry.id, 'api_secret')}
                size="sm"
                variant="ghost"
                className="text-blue-400 hover:text-blue-300 p-1 h-8 w-8"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {entry.description && (
        <div className="mt-3">
          <label className="block text-xs text-gray-400 mb-1">Description</label>
          <p className="text-sm text-gray-300">{entry.description}</p>
        </div>
      )}

      <div className="flex justify-end gap-2 mt-4">
        <Button
          onClick={() => onEdit(entry)}
          size="sm"
          variant="ghost"
          className="text-blue-400 hover:text-blue-300"
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          onClick={() => onDelete(entry.id)}
          size="sm"
          variant="ghost"
          className="text-red-400 hover:text-red-300"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};

export default ApiEntryCard;
