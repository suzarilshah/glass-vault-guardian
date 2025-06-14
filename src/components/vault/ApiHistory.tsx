
import React, { useState, useEffect } from 'react';
import { History, Eye, EyeOff, Clock, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { decryptPassword } from '@/utils/encryption';
import { useToast } from '@/hooks/use-toast';

interface ApiHistoryEntry {
  id: string;
  api_key_encrypted: string;
  api_secret_encrypted?: string;
  changed_at: string;
}

interface ApiHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  entryId: string;
  masterPassword: string;
  onApiKeySelected?: (apiKey: string) => void;
}

const ApiHistory: React.FC<ApiHistoryProps> = ({
  isOpen,
  onClose,
  entryId,
  masterPassword,
  onApiKeySelected
}) => {
  const [history, setHistory] = useState<ApiHistoryEntry[]>([]);
  const [visibleApiKeys, setVisibleApiKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && entryId) {
      fetchApiHistory();
    }
  }, [isOpen, entryId]);

  const fetchApiHistory = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('api_histories')
        .select('*')
        .eq('entry_id', entryId)
        .eq('user_id', user.id)
        .order('changed_at', { ascending: false });

      if (error) {
        console.error('Error fetching API history:', error);
        return;
      }

      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching API history:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleApiKeyVisibility = (id: string) => {
    const newVisible = new Set(visibleApiKeys);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisibleApiKeys(newVisible);
  };

  const handleUseApiKey = (apiKeyEncrypted: string) => {
    try {
      const decryptedApiKey = decryptPassword(apiKeyEncrypted, masterPassword);
      onApiKeySelected?.(decryptedApiKey);
      toast({
        title: "API Key Selected",
        description: "The historical API key has been set as the current API key.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to decrypt historical API key.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card bg-white/5 backdrop-blur-xl border-white/20 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <History className="w-5 h-5" />
            API Key History
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-4 text-gray-400">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-4 text-gray-400">No API key history found.</div>
          ) : (
            history.map((entry) => (
              <div key={entry.id} className="bg-white/5 rounded p-3 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">
                      {new Date(entry.changed_at).toLocaleString()}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleUseApiKey(entry.api_key_encrypted)}
                    className="bg-green-600 hover:bg-green-700 text-white text-xs h-6 px-2"
                  >
                    <ArrowUp className="w-3 h-3 mr-1" />
                    Use This API Key
                  </Button>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-gray-300 text-sm">API Key:</span>
                  <span className="text-white font-mono flex-1">
                    {visibleApiKeys.has(entry.id) 
                      ? (() => {
                          try {
                            return decryptPassword(entry.api_key_encrypted, masterPassword);
                          } catch {
                            return '••••••••';
                          }
                        })()
                      : '••••••••'
                    }
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleApiKeyVisibility(entry.id)}
                    className="text-gray-400 hover:text-white p-1 h-6 w-6"
                  >
                    {visibleApiKeys.has(entry.id) ? 
                      <EyeOff className="w-3 h-3" /> : 
                      <Eye className="w-3 h-3" />
                    }
                  </Button>
                </div>

                {entry.api_secret_encrypted && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-gray-300 text-sm">API Secret:</span>
                    <span className="text-white font-mono flex-1">
                      {visibleApiKeys.has(entry.id) 
                        ? (() => {
                            try {
                              return decryptPassword(entry.api_secret_encrypted, masterPassword);
                            } catch {
                              return '••••••••';
                            }
                          })()
                        : '••••••••'
                      }
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApiHistory;
