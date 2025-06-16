
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import PasswordStrengthBar from '../vault/PasswordStrengthBar';
import { supabase } from '@/integrations/supabase/client';

interface AuthFormProps {
  isSignUp: boolean;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  firstName: string;
  setFirstName: (name: string) => void;
  lastName: string;
  setLastName: (name: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setIsMfaChallenge: (challenge: boolean) => void;
  setIsSignUp: (signUp: boolean) => void;
  setShowVerificationReminder: (show: boolean) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({
  isSignUp,
  email,
  setEmail,
  password,
  setPassword,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  showPassword,
  setShowPassword,
  loading,
  setLoading,
  setIsMfaChallenge,
  setIsSignUp,
  setShowVerificationReminder
}) => {
  const { signUp, signIn } = useAuth();
  const { toast } = useToast();

  const validatePassword = (password: string, firstName: string, lastName: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (password.length <= 10) {
      errors.push("Password must be more than 10 characters");
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }

    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number");
    }

    const lowerPassword = password.toLowerCase();
    const lowerFirstName = firstName.toLowerCase();
    const lowerLastName = lastName.toLowerCase();

    if (lowerFirstName && lowerPassword.includes(lowerFirstName)) {
      errors.push("Password must not contain your first name");
    }

    if (lowerLastName && lowerPassword.includes(lowerLastName)) {
      errors.push("Password must not contain your last name");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const signUpPasswordValidation = validatePassword(password, firstName, lastName);
  const canSignUp = email && password && firstName && lastName && signUpPasswordValidation.isValid && !loading;

  const checkMfaStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) {
        console.error('Error checking MFA status:', error);
        return false;
      }
      
      // Check if user has any verified TOTP factors
      const hasVerifiedTotp = data.totp.some(factor => factor.status === 'verified');
      return hasVerifiedTotp;
    } catch (error) {
      console.error('Error checking MFA status:', error);
      return false;
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setLoading(true);

    try {
      const { data, error } = await signIn(email, password);

      if (error) {
        toast({ title: "Authentication Error", description: error.message, variant: "destructive" });
      } else if (data.session && data.user) {
        // Check if user has MFA enabled
        const hasMfaEnabled = await checkMfaStatus(data.user.id);
        
        // Check the session's AAL level - if aal1 and MFA is enabled, prompt for 2FA
        const sessionAal = (data.session as any).aal || 'aal1';
        if (sessionAal === 'aal1' && hasMfaEnabled) {
          setIsMfaChallenge(true);
        } else {
          toast({ title: "Welcome back!", description: "Successfully signed in." });
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !firstName || !lastName) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    const validation = validatePassword(password, firstName, lastName);
    if (!validation.isValid) {
      toast({
        title: "Password Requirements Not Met",
        description: validation.errors.join(". "),
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(email, password);
      if (error) {
        toast({ title: "Authentication Error", description: error.message, variant: "destructive" });
      } else {
        setIsSignUp(false);
        setShowVerificationReminder(true);
        setEmail("");
        setPassword("");
        setFirstName("");
        setLastName("");
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={isSignUp ? handleSignUpSubmit : handleLoginSubmit} className="space-y-4">
      {isSignUp && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm text-gray-300">First Name</label>
            <p className="text-xs text-gray-400 mb-1">Enter your legal first name</p>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="glass-input pl-10 bg-white/5 border-white/20 text-white"
                placeholder="First name"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-300">Last Name</label>
            <p className="text-xs text-gray-400 mb-1">Enter your legal last name</p>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="glass-input pl-10 bg-white/5 border-white/20 text-white"
                placeholder="Last name"
                required
              />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm text-gray-300">Email Address</label>
        <p className="text-xs text-gray-400 mb-1">Use a valid email address for account verification</p>
        <div className="relative">
          <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="glass-input pl-10 bg-white/5 border-white/20 text-white"
            placeholder="Enter your email address"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm text-gray-300">
          {isSignUp ? 'Account Password' : 'Password'}
        </label>
        {isSignUp && (
          <p className="text-xs text-gray-400 mb-1">
            Create a strong password that will be different from your vault master password
          </p>
        )}
        <div className="relative">
          <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="glass-input pl-10 pr-10 bg-white/5 border-white/20 text-white"
            placeholder="Enter your password"
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
        {isSignUp && password && (
          <>
            <PasswordStrengthBar password={password} />
            {!signUpPasswordValidation.isValid && (
              <ul className="mt-2 text-xs text-red-400 space-y-1 px-2">
                {signUpPasswordValidation.errors.map((err, idx) => (
                  <li key={idx}>• {err}</li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <Button
        type="submit"
        className={`w-full glass-button bg-green-600 hover:bg-green-700 text-white 
          ${isSignUp ? (!canSignUp ? 'opacity-50 cursor-not-allowed' : '') : ''}`}
        disabled={isSignUp ? !canSignUp : loading}
      >
        {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
      </Button>
    </form>
  );
};

export default AuthForm;
