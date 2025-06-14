
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PasswordGenerator from '@/components/PasswordGenerator';
import PasswordVault from '@/components/PasswordVault';
import AuthPage from '@/components/AuthPage';
import Navbar from '@/components/Navbar';

const Index = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'generator' | 'vault'>('generator');
  const [masterPassword, setMasterPassword] = useState<string | null>(null);

  const handleMasterPasswordSet = (password: string | null) => {
    setMasterPassword(password);
  };

  const handleNavigation = (view: 'generator' | 'vault') => {
    setCurrentView(view);
    // Don't clear master password when switching views
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <Navbar 
          onShowVault={() => handleNavigation('vault')} 
          currentView={currentView}
        />
        
        {currentView === 'generator' ? (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-white to-green-400 bg-clip-text text-transparent">
                Password Security Suite
              </h1>
              <p className="text-gray-400">Generate secure passwords and manage your vault</p>
            </div>
            <PasswordGenerator masterPassword={masterPassword} />
          </div>
        ) : (
          <PasswordVault 
            masterPassword={masterPassword} 
            onMasterPasswordSet={handleMasterPasswordSet}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
