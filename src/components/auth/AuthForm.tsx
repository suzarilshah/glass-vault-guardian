
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff } from 'lucide-react';

interface AuthFormProps {
  mode: 'signin' | 'signup' | 'change-password';
  onModeChange?: (mode: 'signin' | 'signup') => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ mode, onModeChange }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'change-password') {
        if (!currentPassword) {
          toast({
            title: "Error",
            description: "Current password is required",
            variant: "destructive"
          });
          return;
        }

        if (password !== confirmPassword) {
          toast({
            title: "Error",
            description: "New passwords do not match",
            variant: "destructive"
          });
          return;
        }

        if (password.length < 6) {
          toast({
            title: "Error",
            description: "New password must be at least 6 characters long",
            variant: "destructive"
          });
          return;
        }

        // First verify the current password by attempting to sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email || (await supabase.auth.getUser()).data.user?.email || '',
          password: currentPassword
        });

        if (signInError) {
          toast({
            title: "Error",
            description: "Current password is incorrect",
            variant: "destructive"
          });
          return;
        }

        // If current password is correct, update to new password
        const { error } = await supabase.auth.updateUser({
          password: password
        });

        if (error) {
          throw error;
        }

        toast({
          title: "Success",
          description: "Password updated successfully"
        });

        // Clear form
        setCurrentPassword('');
        setPassword('');
        setConfirmPassword('');
      } else if (mode === 'signup') {
        if (password !== confirmPassword) {
          toast({
            title: "Error",
            description: "Passwords do not match",
            variant: "destructive"
          });
          return;
        }
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto p-6 glass-card">
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'change-password' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </>
        )}

        {mode !== 'change-password' && (
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="password">
            {mode === 'change-password' ? 'New Password' : 'Password'}
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {(mode === 'signup' || mode === 'change-password') && (
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              {mode === 'change-password' ? 'Confirm New Password' : 'Confirm Password'}
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Loading...' : 
           mode === 'change-password' ? 'Update Password' :
           mode === 'signup' ? 'Sign Up' : 'Sign In'}
        </Button>

        {mode !== 'change-password' && onModeChange && (
          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={() => onModeChange(mode === 'signin' ? 'signup' : 'signin')}
            >
              {mode === 'signin' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </Button>
          </div>
        )}
      </form>
    </Card>
  );
};

export default AuthForm;
