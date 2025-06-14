
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  isDangerous?: boolean;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  isDangerous = false
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card bg-white/5 backdrop-blur-xl border-white/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            {isDangerous && <AlertTriangle className="w-5 h-5 text-red-400" />}
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-gray-300">{message}</p>
          
          <div className="flex gap-2 justify-end">
            <Button
              onClick={onClose}
              variant="outline"
              className="border-green-500/30 text-green-400 hover:bg-green-500/10 hover:border-green-400"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`${
                isDangerous 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmationDialog;
