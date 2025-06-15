
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Shield, Mail, Lock, Eye, EyeOff, Key } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp";
import { supabase } from '@/integrations/supabase/client';

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp, signIn } = useAuth();
  const { toast } = useToast();
  const [isMfaChallenge, setIsMfaChallenge] = useState(false);
  const [mfaCode, setMfaCode] = useState('');

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
      } else {
        // @ts-ignore - The 'aal' property is used for MFA checks, but TS isn't finding it in the User type.
        const aal = data.session?.user?.aal;
        if (aal === 'aal1') {
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
    if (!email || !password) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setLoading(true);

    try {
      const { error } = await signUp(email, password);
      if (error) {
        toast({ title: "Authentication Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Account created! Please check your email to verify your account." });
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data } = await supabase.auth.getSession();
    const factor = data.session?.user?.factors?.find(f => f.factor_type === 'totp' && f.status === 'verified');

    if (!factor) {
      toast({ title: "Error", description: "No 2FA method found. Please try logging in again.", variant: "destructive" });
      setLoading(false);
      setIsMfaChallenge(false);
      return;
    }

    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: mfaCode });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Welcome back!", description: "Successfully signed in." });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-6">
      <Card className="glass-card w-full max-w-md p-8 bg-white/5 backdrop-blur-xl border-white/20">
        <div className="text-center mb-6">
          <Shield className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            {isMfaChallenge ? 'Enter 2FA Code' : (isSignUp ? 'Create Account' : 'Welcome Back')}
          </h1>
          <p className="text-gray-400">
            {isMfaChallenge ? 'Enter the code from your authenticator app.' : (isSignUp ? 'Sign up for SecurePass' : 'Sign in to your account')}
          </p>
        </div>

        {isMfaChallenge ? (
          <form onSubmit={handleMfaSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Authentication Code</label>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={mfaCode} onChange={(value) => setMfaCode(value)}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full glass-button bg-green-600 hover:bg-green-700 text-white"
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </Button>
            <Button
              type="button"
              variant="link"
              onClick={() => setIsMfaChallenge(false)}
              className="w-full text-green-400 hover:text-green-300"
            >
              Back to login
            </Button>
          </form>
        ) : (
          <>
            <form onSubmit={isSignUp ? handleSignUpSubmit : handleLoginSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="glass-input pl-10 bg-white/5 border-white/20 text-white"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-300">Password</label>
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
              </div>

              <Button
                type="submit"
                className="w-full glass-button bg-green-600 hover:bg-green-700 text-white"
                disabled={loading}
              >
                {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-green-400 hover:text-green-300 text-sm"
              >
                {isSignUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"
                }
              </button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default AuthPage;
