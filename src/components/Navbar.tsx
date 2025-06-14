
import React from 'react';
import { Button } from '@/components/ui/button';
import { Shield, LogOut, User, Key } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavbarProps {
  onShowVault: () => void;
  currentView: 'generator' | 'vault';
}

const Navbar: React.FC<NavbarProps> = ({ onShowVault, currentView }) => {
  const { user, signOut } = useAuth();

  return (
    <nav className="glass-card bg-white/5 backdrop-blur-xl border-white/20 px-6 py-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-green-400" />
            <h1 className="text-xl font-bold text-white">SecurePass</h1>
          </div>
          
          {user && (
            <div className="flex items-center gap-4">
              <Button
                variant={currentView === 'generator' ? 'default' : 'ghost'}
                size="sm"
                className="text-white"
                onClick={() => window.location.reload()}
              >
                <Key className="w-4 h-4 mr-2" />
                Generator
              </Button>
              <Button
                variant={currentView === 'vault' ? 'default' : 'ghost'}
                size="sm"
                className="text-white"
                onClick={onShowVault}
              >
                <Shield className="w-4 h-4 mr-2" />
                Password Vault
              </Button>
            </div>
          )}
        </div>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-white">
                <User className="w-4 h-4 mr-2" />
                {user.email}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="glass-card bg-white/10 backdrop-blur-xl border-white/20">
              <DropdownMenuItem className="text-white">
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/20" />
              <DropdownMenuItem 
                className="text-red-400 hover:text-red-300"
                onClick={signOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="text-sm text-gray-400">
            Please sign in to access password vault
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
