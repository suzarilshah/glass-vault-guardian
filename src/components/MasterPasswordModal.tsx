
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AdvancedPasswordStrengthIndicator from '@/components/vault/AdvancedPasswordStrengthIndicator';
import { analyzePasswordStrength } from '@/utils/passwordStrength';

interface MasterPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (masterPassword: string) => void;
  isCreating?: boolean;
}

const MasterPasswordModal: React.FC<MasterPasswordModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isCreating = false
}) => {
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const validatePassword = (password: string) => {
    const errors = [];
    
    // Check length
    if (password.length <= 10) {
      errors.push('Password must be more than 10 characters');
    }
    
    // Check for uppercase
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    // Check for lowercase
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    // Check for special characters
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    // Check for alphanumeric (numbers)
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isCreating) {
      const validation = validatePassword(masterPassword);
      
      if (!validation.isValid) {
        toast({
          title: "Password Validation Failed",
          description: validation.errors.join('. '),
          variant: "destructive"
        });
        return;
      }

      const strengthResult = analyzePasswordStrength(masterPassword);
      if (strengthResult.isWeak) {
        toast({
          title: "Weak Password",
          description: "Please choose a stronger master password",
          variant: "destructive"
        });
        return;
      }

      if (masterPassword !== confirmPassword) {
        toast({
          title: "Error",
          description: "Passwords do not match",
          variant: "destructive"
        });
        return;
      }
    } else {
      if (masterPassword.length < 8) {
        toast({
          title: "Error",
          description: "Master password must be at least 8 characters long",
          variant: "destructive"
        });
        return;
      }
    }

    onSubmit(masterPassword);
    setMasterPassword('');
    setConfirmPassword('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card bg-white/10 backdrop-blur-xl border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Lock className="w-5 h-5 text-green-400" />
            {isCreating ? 'Set Master Password' : 'Enter Master Password'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-300">
              {isCreating ? 'Master Password' : 'Master Password'}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                className="glass-input pl-10 pr-10 bg-white/5 border-white/20 text-white"
                placeholder="Enter master password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {isCreating && (
              <AdvancedPasswordStrengthIndicator 
                password={masterPassword} 
                showDetailed={true}
              />
            )}
          </div>

          {isCreating && (
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Confirm Master Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="glass-input pl-10 bg-white/5 border-white/20 text-white"
                  placeholder="Confirm master password"
                  required
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-white border-blue-400 text-blue-600 hover:bg-blue-50 hover:text-blue-700 border font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700 text-black font-bold border border-green-500"
            >
              {isCreating ? 'Set Password' : 'Unlock Vault'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MasterPasswordModal;
