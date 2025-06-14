
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { History, Copy, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { decryptPassword } from '@/utils/encryption';

interface PasswordHistoryEntry {
  id: string;
  password_encrypted: string;
  changed_at: string;
}

interface PasswordHistoryProps {
  entryId: string;
  masterPassword: string;
  isOpen: boolean;
  onClose: () => void;
}

const PasswordHistory: React.FC<PasswordHistoryProps> = ({
  entryId,
  masterPassword,
  isOpen,
  onClose
}) => {
  const [history, setHistory] = useState<PasswordHistoryEntry[]>([]);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && entryId) {
      fetchHistory();
    }
  }, [isOpen, entryId]);

  const fetchHistory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('password_histories')
      .select('*')
      .eq('entry_id', entryId)
      .eq('user_id', user?.id)
      .order('changed_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch password history",
        variant: "destructive"
      });
    } else {
      setHistory(data || []);
    }
    setLoading(false);
  };

  const togglePasswordVisibility = (id: string) => {
    const newVisible = new Set(visiblePasswords);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisiblePasswords(newVisible);
  };

  const copyPassword = async (encryptedPassword: string) => {
    try {
      const decryptedPassword = decryptPassword(encryptedPassword, masterPassword);
      await navigator.clipboard.writeText(decryptedPassword);
      toast({
        title: "Copied",
        description: "Password copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy password",
        variant: "destructive"
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="glass-card bg-white/5 backdrop-blur-xl border-white/20 w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardHeader className="border-b border-white/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <History className="w-5 h-5 text-green-400" />
              Password History
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center text-gray-400">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="text-center text-gray-400">No password history found</div>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-white/5 rounded-lg p-4 border border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-gray-400 text-sm mb-2">
                        Changed on {new Date(entry.changed_at).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-mono">
                          {visiblePasswords.has(entry.id) 
                            ? (() => {
                                try {
                                  return decryptPassword(entry.password_encrypted, masterPassword);
                                } catch {
                                  return '••••••••';
                                }
                              })()
                            : '••••••••'
                          }
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => togglePasswordVisibility(entry.id)}
                        className="text-gray-400 hover:text-white p-1 h-6 w-6"
                      >
                        {visiblePasswords.has(entry.id) ? 
                          <EyeOff className="w-3 h-3" /> : 
                          <Eye className="w-3 h-3" />
                        }
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyPassword(entry.password_encrypted)}
                        className="text-green-400 hover:text-green-300 p-1 h-6 w-6"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PasswordHistory;
