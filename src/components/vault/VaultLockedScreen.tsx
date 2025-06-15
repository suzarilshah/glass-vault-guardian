
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Lock, Key } from 'lucide-react';
import TimerSettings from './TimerSettings';
import MasterPasswordModal from '../MasterPasswordModal';

interface VaultLockedScreenProps {
  type?: string;
  showMasterModal?: boolean;
  setShowMasterModal?: (show: boolean) => void;
  handleMasterPasswordSubmit?: (password: string) => Promise<void>;
  isCreatingMaster?: boolean;
  lockTimeoutMinutes?: number;
  handleTimeoutChange?: (minutes: number) => void;
}

const VaultLockedScreen: React.FC<VaultLockedScreenProps> = ({
  type = "Password",
  showMasterModal = false,
  setShowMasterModal,
  handleMasterPasswordSubmit,
  isCreatingMaster = false,
  lockTimeoutMinutes = 5,
  handleTimeoutChange,
}) => {
  const [localShowModal, setLocalShowModal] = useState(false);
  const [showTimerSettings, setShowTimerSettings] = useState(false);

  const handleUnlockClick = () => {
    if (setShowMasterModal) {
      setShowMasterModal(true);
    } else {
      setLocalShowModal(true);
    }
  };

  const handleModalClose = () => {
    if (setShowMasterModal) {
      setShowMasterModal(false);
    } else {
      setLocalShowModal(false);
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'Certificate':
        return Shield;
      case 'API':
        return Key;
      default:
        return Lock;
    }
  };

  const Icon = getIcon();

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-6">
        <Card className="glass-card w-full max-w-md p-8 bg-white/5 backdrop-blur-xl border-white/20 text-center">
          <Icon className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">{type} Vault Locked</h2>
          <p className="text-gray-400 mb-6">Enter your master password to access your vault</p>
          
          {handleTimeoutChange && (
            <div className="mb-6">
              <TimerSettings
                lockTimeoutMinutes={lockTimeoutMinutes}
                onTimeoutChange={handleTimeoutChange}
              />
            </div>
          )}
          
          <Button
            onClick={handleUnlockClick}
            className="glass-button bg-green-600 hover:bg-green-700 text-white w-full"
          >
            Unlock Vault
          </Button>
        </Card>
      </div>
      
      <MasterPasswordModal
        isOpen={showMasterModal || localShowModal}
        onClose={handleModalClose}
        onSubmit={handleMasterPasswordSubmit || (async () => {})}
        isCreating={isCreatingMaster}
        type={type}
      />
    </>
  );
};

export default VaultLockedScreen;
