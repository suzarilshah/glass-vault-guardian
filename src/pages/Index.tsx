
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { encryptPassword } from '@/utils/encryption';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import PasswordGenerator from '@/components/PasswordGenerator';
import PasswordVault from '@/components/PasswordVault';
import AuthPage from '@/components/AuthPage';
import Navbar from '@/components/Navbar';

const Index = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'generator' | 'vault'>('generator');
  const { toast } = useToast();

  const handleSavePassword = async (password: string) => {
    if (!user) return;

    try {
      // For auto-save, we'll use a simple title and encrypt with a default master password
      // In a real implementation, you'd want to prompt for master password or use the existing one
      const defaultMasterPassword = 'temp-master-key'; // This should be the user's actual master password
      const encryptedPassword = encryptPassword(password, defaultMasterPassword);
      
      const { error } = await supabase
        .from('password_entries')
        .insert({
          user_id: user.id,
          title: 'Generated Password',
          username: '',
          password_encrypted: encryptedPassword,
          website: '',
          notes: `Auto-saved generated password from ${new Date().toLocaleString()}`
        });

      if (error) {
        console.error('Error saving password:', error);
        return;
      }

      toast({
        title: "Password Saved",
        description: "Generated password has been saved to your vault"
      });
    } catch (error) {
      console.error('Error saving password:', error);
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
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <Navbar 
          onShowVault={() => setCurrentView('vault')} 
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
            <PasswordGenerator onSavePassword={handleSavePassword} />
          </div>
        ) : (
          <PasswordVault />
        )}
      </div>
    </div>
  );
};

export default Index;
