
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PasswordGenerator from '@/components/PasswordGenerator';
import PasswordVault from '@/components/PasswordVault';
import ApiVault from '@/components/ApiVault';
import CertificateVault from '@/components/CertificateVault';
import AuthPage from '@/components/AuthPage';
import LandingPage from '@/components/LandingPage';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'generator' | 'vault' | 'api-vault' | 'certificate-vault'>('generator');
  const [showAuth, setShowAuth] = useState(false);
  const [masterPasswords, setMasterPasswords] = useState<{
    unified: string | null;
    password: string | null;
    api: string | null;
    certificate: string | null;
  }>({
    unified: null,
    password: null,
    api: null,
    certificate: null,
  });
  const [useUnifiedPassword, setUseUnifiedPassword] = useState(true);
  const [unifiedLockTimeoutMinutes, setUnifiedLockTimeoutMinutes] = useState(5);

  useEffect(() => {
    if (user) {
      checkUnifiedPasswordSetting();
    }
  }, [user]);

  const checkUnifiedPasswordSetting = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_master_passwords')
        .select('use_unified_password')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setUseUnifiedPassword(data.use_unified_password);
      }
    } catch (error) {
      console.error('Error checking unified password setting:', error);
    }
  };

  const handleMasterPasswordSet = (password: string | null, vaultType?: 'password' | 'api' | 'certificate') => {
    if (useUnifiedPassword) {
      // If using unified password, set it for all vaults
      setMasterPasswords({
        unified: password,
        password: password,
        api: password,
        certificate: password,
      });
    } else {
      // Set password for specific vault type
      if (vaultType) {
        setMasterPasswords(prev => ({
          ...prev,
          [vaultType]: password,
        }));
      }
    }
  };

  const handleNavigation = (view: 'generator' | 'vault' | 'api-vault' | 'certificate-vault') => {
    setCurrentView(view);
    // Only clear master passwords when going to generator
    if (view === 'generator') {
      setMasterPasswords({
        unified: null,
        password: null,
        api: null,
        certificate: null,
      });
    }
  };

  const getMasterPasswordForVault = (vaultType: 'password' | 'api' | 'certificate') => {
    if (useUnifiedPassword) {
      return masterPasswords.unified;
    }
    return masterPasswords[vaultType];
  };

  const handleUnifiedTimeoutChange = (minutes: number) => {
    setUnifiedLockTimeoutMinutes(minutes);
  };

  const handleUnifiedMasterPasswordClear = () => {
    if (useUnifiedPassword) {
      setMasterPasswords({
        unified: null,
        password: null,
        api: null,
        certificate: null,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    if (showAuth) {
      return <AuthPage />;
    }
    return <LandingPage onShowAuth={() => setShowAuth(true)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex flex-col">
      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <Navbar 
            onShowVault={() => handleNavigation('vault')}
            onShowApiVault={() => handleNavigation('api-vault')}
            onShowCertificateVault={() => handleNavigation('certificate-vault')}
            currentView={currentView}
          />
          
          {currentView === 'generator' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-white to-green-400 bg-clip-text text-transparent">
                  Shielder
                </h1>
                <p className="text-gray-400">AI-powered password security and protection</p>
              </div>
              <PasswordGenerator />
            </div>
          )}
          
          {currentView === 'vault' && (
            <PasswordVault 
              masterPassword={getMasterPasswordForVault('password')} 
              onMasterPasswordSet={(password) => handleMasterPasswordSet(password, 'password')}
              useUnifiedPassword={useUnifiedPassword}
              unifiedLockTimeoutMinutes={useUnifiedPassword ? unifiedLockTimeoutMinutes : undefined}
              onUnifiedTimeoutChange={useUnifiedPassword ? handleUnifiedTimeoutChange : undefined}
              onUnifiedMasterPasswordClear={useUnifiedPassword ? handleUnifiedMasterPasswordClear : undefined}
            />
          )}

          {currentView === 'api-vault' && (
            <ApiVault 
              masterPassword={getMasterPasswordForVault('api')} 
              onMasterPasswordSet={(password) => handleMasterPasswordSet(password, 'api')}
              useUnifiedPassword={useUnifiedPassword}
              unifiedLockTimeoutMinutes={useUnifiedPassword ? unifiedLockTimeoutMinutes : undefined}
              onUnifiedTimeoutChange={useUnifiedPassword ? handleUnifiedTimeoutChange : undefined}
              onUnifiedMasterPasswordClear={useUnifiedPassword ? handleUnifiedMasterPasswordClear : undefined}
            />
          )}

          {currentView === 'certificate-vault' && (
            <CertificateVault 
              masterPassword={getMasterPasswordForVault('certificate')} 
              onMasterPasswordSet={(password) => handleMasterPasswordSet(password, 'certificate')}
              useUnifiedPassword={useUnifiedPassword}
              unifiedLockTimeoutMinutes={useUnifiedPassword ? unifiedLockTimeoutMinutes : undefined}
              onUnifiedTimeoutChange={useUnifiedPassword ? handleUnifiedTimeoutChange : undefined}
              onUnifiedMasterPasswordClear={useUnifiedPassword ? handleUnifiedMasterPasswordClear : undefined}
            />
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Index;
