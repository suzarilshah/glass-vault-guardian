
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Shield, Key, FileText, Lock, User, LogOut, Menu, X, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';

interface NavbarProps {
  onShowVault: () => void;
  onShowApiVault: () => void;
  onShowCertificateVault: () => void;
  currentView: 'generator' | 'vault' | 'api-vault' | 'certificate-vault';
}

const Navbar: React.FC<NavbarProps> = ({ 
  onShowVault, 
  onShowApiVault, 
  onShowCertificateVault, 
  currentView 
}) => {
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: "Signed out successfully" });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({ 
        title: "Error", 
        description: "Failed to sign out", 
        variant: "destructive" 
      });
    }
  };

  const handleGeneratorClick = () => {
    window.location.href = '/';
  };

  const getUserEmail = () => {
    return user?.email || 'User';
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <nav className="bg-gray-900/50 backdrop-blur-sm border-b border-white/10 mb-6">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-green-400" />
            <span className="font-bold text-white">Shielder</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <Button
              onClick={handleGeneratorClick}
              variant={currentView === 'generator' ? 'default' : 'ghost'}
              className={currentView === 'generator' 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }
            >
              <Key className="w-4 h-4 mr-2" />
              Generator
            </Button>
            
            <Button
              onClick={onShowVault}
              variant={currentView === 'vault' ? 'default' : 'ghost'}
              className={currentView === 'vault' 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }
            >
              <Lock className="w-4 h-4 mr-2" />
              Password Vault
            </Button>
            
            <Button
              onClick={onShowApiVault}
              variant={currentView === 'api-vault' ? 'default' : 'ghost'}
              className={currentView === 'api-vault' 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }
            >
              <Key className="w-4 h-4 mr-2" />
              API Vault
            </Button>

            <Button
              onClick={onShowCertificateVault}
              variant={currentView === 'certificate-vault' ? 'default' : 'ghost'}
              className={currentView === 'certificate-vault' 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }
            >
              <FileText className="w-4 h-4 mr-2" />
              Certificate Vault
            </Button>
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  <User className="w-4 h-4 mr-2" />
                  {getUserEmail()}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-56 bg-gray-800 border-gray-700"
              >
                <DropdownMenuItem 
                  onClick={handleProfileClick}
                  className="text-gray-300 hover:text-white hover:bg-gray-700 cursor-pointer"
                >
                  <User className="w-4 h-4 mr-2" />
                  User Profile
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="text-gray-300 hover:text-white hover:bg-gray-700 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button */}
          <Button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            variant="ghost"
            className="md:hidden text-gray-300 hover:text-white"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-white/10 py-4 space-y-2">
            <Button
              onClick={() => {
                handleGeneratorClick();
                setIsMenuOpen(false);
              }}
              variant={currentView === 'generator' ? 'default' : 'ghost'}
              className={`w-full justify-start ${currentView === 'generator' 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Key className="w-4 h-4 mr-2" />
              Generator
            </Button>
            
            <Button
              onClick={() => {
                onShowVault();
                setIsMenuOpen(false);
              }}
              variant={currentView === 'vault' ? 'default' : 'ghost'}
              className={`w-full justify-start ${currentView === 'vault' 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Lock className="w-4 h-4 mr-2" />
              Password Vault
            </Button>
            
            <Button
              onClick={() => {
                onShowApiVault();
                setIsMenuOpen(false);
              }}
              variant={currentView === 'api-vault' ? 'default' : 'ghost'}
              className={`w-full justify-start ${currentView === 'api-vault' 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Key className="w-4 h-4 mr-2" />
              API Vault
            </Button>

            <Button
              onClick={() => {
                onShowCertificateVault();
                setIsMenuOpen(false);
              }}
              variant={currentView === 'certificate-vault' ? 'default' : 'ghost'}
              className={`w-full justify-start ${currentView === 'certificate-vault' 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              <FileText className="w-4 h-4 mr-2" />
              Certificate Vault
            </Button>
            
            <div className="border-t border-white/10 pt-2 mt-2">
              <Button
                onClick={() => {
                  handleProfileClick();
                  setIsMenuOpen(false);
                }}
                variant="ghost"
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <User className="w-4 h-4 mr-2" />
                User Profile
              </Button>
              
              <Button
                onClick={() => {
                  handleSignOut();
                  setIsMenuOpen(false);
                }}
                variant="ghost"
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
