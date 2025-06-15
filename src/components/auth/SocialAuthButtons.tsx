
import React from 'react';
import { Button } from '@/components/ui/button';
import { Github } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SocialAuthButtonsProps {
  isSignUp: boolean;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({ 
  isSignUp, 
  loading, 
  setLoading 
}) => {
  const { signInWithGoogle, signInWithGitHub } = useAuth();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({ 
          title: "Authentication Error", 
          description: error.message, 
          variant: "destructive" 
        });
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "An unexpected error occurred", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithGitHub();
      if (error) {
        toast({ 
          title: "Authentication Error", 
          description: error.message, 
          variant: "destructive" 
        });
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "An unexpected error occurred", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 space-y-3">
      <Button
        onClick={handleGoogleSignIn}
        variant="outline"
        className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 transition-colors"
        disabled={loading}
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {isSignUp ? 'Sign up with Google' : 'Sign in with Google'}
      </Button>

      <Button
        onClick={handleGitHubSignIn}
        variant="outline"
        className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 transition-colors"
        disabled={loading}
      >
        <Github className="w-5 h-5 mr-2" />
        {isSignUp ? 'Sign up with GitHub' : 'Sign in with GitHub'}
      </Button>
      
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/20" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-gray-900 px-2 text-gray-400">Or continue with email</span>
        </div>
      </div>
    </div>
  );
};

export default SocialAuthButtons;
