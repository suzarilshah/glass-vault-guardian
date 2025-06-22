
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface PasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean;
  keywords?: string;
}

export const usePasswordGeneration = () => {
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { canUseFeature, incrementUsage, createCheckout } = useSubscription();

  const generatePassword = (options: PasswordOptions): string => {
    let charset = '';
    
    if (options.includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (options.includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (options.includeNumbers) charset += '0123456789';
    if (options.includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    if (options.excludeSimilar) {
      charset = charset.replace(/[il1Lo0O]/g, '');
    }
    
    if (!charset) {
      throw new Error('At least one character type must be selected');
    }
    
    let password = '';
    for (let i = 0; i < options.length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  };

  const generateAIPassword = async (options: PasswordOptions) => {
    // Check if user can use AI generation
    if (!canUseFeature('ai_generation')) {
      toast({
        title: "Daily Limit Reached",
        description: "You've reached your daily AI generation limit. Upgrade to Pro for unlimited access.",
        variant: "destructive",
        action: (
          <button 
            onClick={createCheckout}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
          >
            Upgrade
          </button>
        ),
      });
      return;
    }

    // Try to increment usage first
    const canProceed = await incrementUsage('ai_password_generations');
    if (!canProceed) {
      toast({
        title: "Usage Error",
        description: "Unable to process request. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-passwords', {
        body: {
          length: options.length,
          includeUppercase: options.includeUppercase,
          includeLowercase: options.includeLowercase,
          includeNumbers: options.includeNumbers,
          includeSymbols: options.includeSymbols,
          excludeSimilar: options.excludeSimilar,
          keywords: options.keywords || '',
          count: 1
        }
      });

      if (error) throw error;

      if (data?.passwords && data.passwords.length > 0) {
        setGeneratedPassword(data.passwords[0]);
        toast({
          title: "AI Password Generated",
          description: "Grok 3 has created a secure password for you",
        });
      }
    } catch (error) {
      console.error('Error generating AI password:', error);
      toast({
        title: "AI Generation Failed",
        description: "Unable to generate AI password. Using standard generation.",
        variant: "destructive",
      });
      
      // Fallback to standard generation
      try {
        const password = generatePassword(options);
        setGeneratedPassword(password);
      } catch (fallbackError) {
        toast({
          title: "Generation Error",
          description: "Please check your password options and try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const generateStandardPassword = (options: PasswordOptions) => {
    try {
      const password = generatePassword(options);
      setGeneratedPassword(password);
      toast({
        title: "Password Generated",
        description: "A secure password has been created",
      });
    } catch (error) {
      toast({
        title: "Generation Error",
        description: error instanceof Error ? error.message : "Please check your password options and try again.",
        variant: "destructive",
      });
    }
  };

  return {
    generatedPassword,
    setGeneratedPassword,
    isGenerating,
    generateAIPassword,
    generateStandardPassword,
  };
};
