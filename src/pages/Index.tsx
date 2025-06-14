
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AuthPage from "@/components/AuthPage";
import PasswordVault from "@/components/PasswordVault";

const Index = () => {
  const { user, loading } = useAuth();
  const [masterPassword, setMasterPassword] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-white to-green-400 bg-clip-text text-transparent">
            PWShield
          </h1>
          <p className="text-gray-400 text-lg">Your secure password manager</p>
        </div>
        <PasswordVault 
          masterPassword={masterPassword}
          onMasterPasswordSet={setMasterPassword}
        />
      </div>
    </div>
  );
};

export default Index;
