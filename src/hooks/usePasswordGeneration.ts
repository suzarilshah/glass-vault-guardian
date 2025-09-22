
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';


interface PasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSpecialChars: boolean;
  excludeSimilar?: boolean;
  keywords?: string;
}

export const usePasswordGeneration = () => {
  const [password, setPassword] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [options, setOptions] = useState<PasswordOptions>({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSpecialChars: true,
    excludeSimilar: false,
  });
  const { toast } = useToast();
  

  const generatePasswordString = (options: PasswordOptions): string => {
    let charset = '';
    
    if (options.includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (options.includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (options.includeNumbers) charset += '0123456789';
    if (options.includeSpecialChars) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    if (options.excludeSimilar) {
      charset = charset.replace(/[il1Lo0O]/g, '');
    }
    
    if (!charset) {
      throw new Error('At least one character type must be selected');
    }
    
    let generatedPassword = '';
    for (let i = 0; i < options.length; i++) {
      generatedPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return generatedPassword;
  };

  const generateAIPassword = async (passwordOptions: PasswordOptions) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-passwords', {
        body: {
          length: passwordOptions.length,
          includeUppercase: passwordOptions.includeUppercase,
          includeLowercase: passwordOptions.includeLowercase,
          includeNumbers: passwordOptions.includeNumbers,
          includeSymbols: passwordOptions.includeSpecialChars,
          excludeSimilar: passwordOptions.excludeSimilar,
          keywords: passwordOptions.keywords || '',
          count: 1
        }
      });

      if (error) throw error;

      if (data?.passwords && data.passwords.length > 0) {
        setPassword(data.passwords[0]);
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
        const generatedPassword = generatePasswordString(passwordOptions);
        setPassword(generatedPassword);
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

  const generatePassword = () => {
    try {
      const generatedPassword = generatePasswordString(options);
      setPassword(generatedPassword);
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

  const copyToClipboard = async () => {
    if (!password) {
      toast({
        title: "Error",
        description: "No password to copy",
        variant: "destructive"
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(password);
      toast({
        title: "Copied!",
        description: "Password copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy password",
        variant: "destructive"
      });
    }
  };

  return {
    password,
    setPassword,
    options,
    setOptions,
    isGenerating,
    generatePassword,
    generateAIPassword,
    copyToClipboard,
  };
};
