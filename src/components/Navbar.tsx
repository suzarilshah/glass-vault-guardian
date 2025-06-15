import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Lock, Key, Shield, User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface NavbarProps {
  onShowVault: () => void;
  onShowApiVault: () => void;
  onShowCertificateVault: () => void;
  currentView: 'generator' | 'vault' | 'api-vault' | 'certificate-vault';
}

const Navbar = ({ onShowVault, onShowApiVault, onShowCertificateVault, currentView }: NavbarProps) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('delete-user', {
        headers: {
          Authorization: `Bearer ${supabase.auth.getSession().data.session?.access_token}`,
        },
      });

      if (error) {
        console.error('Error deleting account:', error);
        toast({
          title: "Error",
          description: "Failed to delete account. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Account deleted successfully.",
        });
        await signOut();
      }
    } catch (error) {
      console.error('Unexpected error deleting account:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <nav className="flex items-center justify-between py-4 mb-8">
      <div className="flex items-center space-x-6">
        <Button
          onClick={() => window.location.reload()}
          variant={currentView === 'generator' ? 'default' : 'ghost'}
          className={currentView === 'generator' 
            ? 'glass-button bg-green-600 hover:bg-green-700 text-white' 
            : 'text-gray-300 hover:text-white'
          }
        >
          <Zap className="w-4 h-4 mr-2" />
          Generator
        </Button>
        <Button
          onClick={onShowVault}
          variant={currentView === 'vault' ? 'default' : 'ghost'}
          className={currentView === 'vault' 
            ? 'glass-button bg-green-600 hover:bg-green-700 text-white' 
            : 'text-gray-300 hover:text-white'
          }
        >
          <Lock className="w-4 h-4 mr-2" />
          Password Vault
        </Button>
        <Button
          onClick={onShowApiVault}
          variant={currentView === 'api-vault' ? 'default' : 'ghost'}
          className={currentView === 'api-vault' 
            ? 'glass-button bg-green-600 hover:bg-green-700 text-white' 
            : 'text-gray-300 hover:text-white'
          }
        >
          <Key className="w-4 h-4 mr-2" />
          API Vault
        </Button>
        <Button
          onClick={onShowCertificateVault}
          variant={currentView === 'certificate-vault' ? 'default' : 'ghost'}
          className={currentView === 'certificate-vault' 
            ? 'glass-button bg-green-600 hover:bg-green-700 text-white' 
            : 'text-gray-300 hover:text-white'
          }
        >
          <Shield className="w-4 h-4 mr-2" />
          Certificate Vault
        </Button>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 lg:h-10 lg:w-10 rounded-full">
            <Avatar className="h-8 w-8 lg:h-10 lg:w-10">
              <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.full_name} />
              <AvatarFallback>{user?.user_metadata?.full_name?.charAt(0)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>{user?.email}</DropdownMenuItem>
          <DropdownMenuItem onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-500" onClick={handleDeleteAccount} disabled={isDeleting}>
            <User className="mr-2 h-4 w-4" />
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
};

export default Navbar;
