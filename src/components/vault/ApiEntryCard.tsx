
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Edit, Trash2, Eye, EyeOff, Clock, Globe, Key, Link } from 'lucide-react';
import { ApiEntry } from '@/types/apiVault';
import { decryptPassword } from '@/utils/encryption';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to copy ${label}`,
        variant: "destructive",
      });
    }
  };

  const copyEndpointUrl = () => {
    if (entry.endpoint_url) {
      copyToClipboard(entry.endpoint_url, "Endpoint URL");
    }
  };

  const copyApiSecret = async () => {
    if (!entry.api_secret_encrypted || !masterPassword) return;
    
    try {
      const decryptedSecret = decryptPassword(entry.api_secret_encrypted, masterPassword);
      await copyToClipboard(decryptedSecret, "API Secret");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to decrypt and copy API secret",
        variant: "destructive",
      });
    }
  };

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case 'production': return 'bg-red-100 text-red-800 border-red-200';
      case 'staging': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'development': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderApiKey = () => {
    if (!masterPassword) return '••••••••••••••••';
    
    try {
      if (isVisible) {
        const decrypted = decryptPassword(entry.api_key_encrypted, masterPassword);
        return decrypted;
      }
      return '••••••••••••••••';
    } catch (error) {
      return 'Decryption failed';
    }
  };

  const renderApiSecret = () => {
    if (!entry.api_secret_encrypted || !masterPassword) return null;
    
    try {
      if (isVisible) {
        const decrypted = decryptPassword(entry.api_secret_encrypted, masterPassword);
        return decrypted;
      }
      return '••••••••••••••••';
    } catch (error) {
      return 'Decryption failed';
    }
  };

  return (
    <Card className="glass-card p-6 bg-white/5 backdrop-blur-xl border-white/20 hover:bg-white/10 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-white">{entry.title}</h3>
            <Badge className={`text-xs ${getEnvironmentColor(entry.environment)}`}>
              {entry.environment}
            </Badge>
            {entry.is_expired && (
              <Badge variant="destructive" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                Expired
              </Badge>
            )}
          </div>
          {entry.api_name && (
            <p className="text-sm text-gray-400 mb-2">API: {entry.api_name}</p>
          )}
          {entry.description && (
            <p className="text-sm text-gray-300 mb-3">{entry.description}</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {/* API Key */}
        <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-300">API Key:</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="text-sm text-green-400 bg-black/40 px-2 py-1 rounded max-w-48 overflow-hidden">
              {renderApiKey()}
            </code>
            <Button
              size="sm"
              variant="ghost"
              onClick={onToggleVisibility}
              className="text-gray-400 hover:text-white p-1"
            >
              {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCopy}
              className="text-gray-400 hover:text-white p-1"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* API Secret */}
        {entry.api_secret_encrypted && (
          <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-300">API Secret:</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-sm text-green-400 bg-black/40 px-2 py-1 rounded max-w-48 overflow-hidden">
                {renderApiSecret()}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={copyApiSecret}
                className="text-gray-400 hover:text-white p-1"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Endpoint URL */}
        {entry.endpoint_url && (
          <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-gray-300">Endpoint:</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-sm text-cyan-400 bg-black/40 px-2 py-1 rounded max-w-48 overflow-hidden">
                {entry.endpoint_url}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={copyEndpointUrl}
                className="text-gray-400 hover:text-white p-1"
                title="Copy Endpoint URL"
              >
                <Link className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Expiration Info */}
        {entry.expires_at && (
          <div className="text-xs text-gray-400">
            Expires: {new Date(entry.expires_at).toLocaleDateString()}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-white/10">
        <Button
          size="sm"
          variant="ghost"
          onClick={onShowHistory}
          className="text-gray-400 hover:text-white"
        >
          <Clock className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onEdit}
          className="text-blue-400 hover:text-blue-300"
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          className="text-red-400 hover:text-red-300"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};

export default ApiEntryCard;
