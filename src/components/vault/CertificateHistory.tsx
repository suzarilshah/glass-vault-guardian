
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { History, Download, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CertificateHistory } from '@/types/certificateVault';

interface CertificateHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  entryId: string;
  masterPassword: string;
}

const CertificateHistoryComponent: React.FC<CertificateHistoryProps> = ({
  isOpen,
  onClose,
  entryId,
  masterPassword
}) => {
  const [historyEntries, setHistoryEntries] = useState<CertificateHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('certificate_histories')
        .select('*')
        .eq('entry_id', entryId)
        .order('changed_at', { ascending: false });

      if (error) throw error;
      setHistoryEntries(data || []);
    } catch (error) {
      console.error('Error fetching certificate history:', error);
      toast({
        title: "Error",
        description: "Failed to fetch certificate history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && entryId) {
      fetchHistory();
    }
  }, [isOpen, entryId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card bg-gray-900/95 backdrop-blur-xl border-white/20 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <History className="w-5 h-5" />
            Certificate History
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-400">Loading history...</div>
            </div>
          ) : historyEntries.length === 0 ? (
            <div className="text-center py-8">
              <History className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <div className="text-gray-400">No history available</div>
            </div>
          ) : (
            historyEntries.map((historyEntry, index) => (
              <Card key={historyEntry.id} className="glass-card p-4 bg-white/5 border-white/20">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-blue-400">
                        Version {historyEntries.length - index}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(historyEntry.changed_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      Certificate was updated on {new Date(historyEntry.changed_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-green-400 hover:text-green-300"
                    title="Download historical certificate"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CertificateHistoryComponent;
