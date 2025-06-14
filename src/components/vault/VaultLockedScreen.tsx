
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import TimerSettings from './TimerSettings';
import MasterPasswordModal from '../MasterPasswordModal';

interface VaultLockedScreenProps {
  showMasterModal: boolean;
  setShowMasterModal: (show: boolean) => void;
  handleMasterPasswordSubmit: (password: string) => Promise<void>;
  isCreatingMaster: boolean;
  lockTimeoutMinutes: number;
  handleTimeoutChange: (minutes: number) => void;
}

const VaultLockedScreen: React.FC<VaultLockedScreenProps> = ({
  showMasterModal,
  setShowMasterModal,
  handleMasterPasswordSubmit,
  isCreatingMaster,
  lockTimeoutMinutes,
  handleTimeoutChange,
}) => {
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-6">
        <Card className="glass-card w-full max-w-md p-8 bg-white/5 backdrop-blur-xl border-white/20 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Password Vault Locked</h2>
          <p className="text-gray-400 mb-6">Enter your master password to access your vault</p>
          
          <div className="mb-6">
            <TimerSettings
              lockTimeoutMinutes={lockTimeoutMinutes}
              onTimeoutChange={handleTimeoutChange}
            />
          </div>
          
          <Button
            onClick={() => setShowMasterModal(true)}
            className="glass-button bg-green-600 hover:bg-green-700 text-white"
          >
            Unlock Vault
          </Button>
        </Card>
      </div>
      <MasterPasswordModal
        isOpen={showMasterModal}
        onClose={() => setShowMasterModal(false)}
        onSubmit={handleMasterPasswordSubmit}
        isCreating={isCreatingMaster}
      />
    </>
  );
};

export default VaultLockedScreen;
