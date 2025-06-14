
import React, { useState, useEffect } from 'react';
import { History, Eye, EyeOff, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { decryptPassword } from '@/utils/encryption';

interface PasswordHistoryEntry {
  id: string;
  password_encrypted: string;
  changed_at: string;
}

interface PasswordHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  entryId: string;
  masterPassword: string;
}

const PasswordHistory: React.FC<PasswordHistoryProps> = ({
  isOpen,
  onClose,
  entryId,
  masterPassword
}) => {
  const [history, setHistory] = useState<PasswordHistoryEntry[]>([]);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && entryId) {
      fetchPasswordHistory();
    }
  }, [isOpen, entryId]);

  const fetchPasswordHistory = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('password_histories')
        .select('*')
        .eq('entry_id', entryId)
        .eq('user_id', user.id)
        .order('changed_at', { ascending: false });

      if (error) {
        console.error('Error fetching password history:', error);
        return;
      }

      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching password history:', error);
    } finally {
      setLoading(false);
    }
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card bg-white/5 backdrop-blur-xl border-white/20 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <History className="w-5 h-5" />
            Password History
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-4 text-gray-400">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-4 text-gray-400">No password history found.</div>
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
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-gray-300 text-sm">Password:</span>
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
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordHistory;
