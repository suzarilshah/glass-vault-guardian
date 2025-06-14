import React, { useState, useEffect } from 'react';
import { Copy, RefreshCw, Shield, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { calculateCrackTime } from '@/utils/passwordUtils';
import { checkPasswordBreach } from '@/utils/breachChecker';
import KeywordObfuscator from './KeywordObfuscator';
import PasswordAnalyzer from './PasswordAnalyzer';

interface PasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSpecialChars: boolean;
}

const PasswordGenerator = () => {
  const [password, setPassword] = useState('');
  const [options, setOptions] = useState<PasswordOptions>({
    length: 12,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSpecialChars: true,
  });
  const [strength, setStrength] = useState(0);
  const { toast } = useToast();

  const generatePassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let charset = '';
    if (options.includeUppercase) charset += uppercase;
    if (options.includeLowercase) charset += lowercase;
    if (options.includeNumbers) charset += numbers;
    if (options.includeSpecialChars) charset += specialChars;
    
    if (charset === '') {
      toast({
        title: "Error",
        description: "Please select at least one character type",
        variant: "destructive"
      });
      return;
    }
    
    let result = '';
    for (let i = 0; i < options.length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    setPassword(result);
  };

  const calculateStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    if (pwd.length >= 16) score += 1;
    
    return Math.min(score, 5);
  };

  const copyToClipboard = async () => {
    if (!password) return;
    
    try {
      await navigator.clipboard.writeText(password);
      toast({
        title: "Copied!",
        description: "Password copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy password",
        variant: "destructive"
      });
    }
  };

  const getStrengthColor = (strength: number) => {
    if (strength <= 2) return 'bg-red-500';
    if (strength <= 3) return 'bg-yellow-500';
    if (strength <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthText = (strength: number) => {
    if (strength <= 2) return 'Weak';
    if (strength <= 3) return 'Fair';
    if (strength <= 4) return 'Good';
    return 'Strong';
  };

  const getStrengthTextColor = (strength: number) => {
    if (strength <= 2) return 'text-red-400';
    if (strength <= 3) return 'text-yellow-400';
    if (strength <= 4) return 'text-blue-400';
    return 'text-green-400';
  };

  const handleKeywordPasswordGenerated = (keywordPassword: string) => {
    setPassword(keywordPassword);
  };

  useEffect(() => {
    if (password) {
      setStrength(calculateStrength(password));
    }
  }, [password]);

  const generatedPasswordCrackTime = password ? calculateCrackTime(password) : null;
  const generatedPasswordBreach = password ? checkPasswordBreach(password) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Password Security Suite
          </h1>
          <p className="text-gray-300">Generate secure passwords and analyze their strength</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="generator" className="w-full">
          <TabsList className="grid w-full grid-cols-2 glass-card">
            <TabsTrigger value="generator" className="text-white">
              Password Generator
            </TabsTrigger>
            <TabsTrigger value="analyzer" className="text-white">
              Password Analyzer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generator" className="space-y-6 mt-6">
            {/* Main Password Card */}
            <Card className="glass-card p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Generated Password
                  </h2>
                  <Button
                    onClick={generatePassword}
                    variant="outline"
                    size="sm"
                    className="glass-button text-white"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generate
                  </Button>
                </div>
                
                <div className="relative">
                  <div className="glass-input p-4 rounded-lg font-mono text-lg text-white break-all min-h-[60px] flex items-center">
                    {password || 'Click generate to create a password'}
                  </div>
                  <Button
                    onClick={copyToClipboard}
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 text-white hover:text-gray-300"
                    disabled={!password}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>

                {/* Strength Indicator */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Password Strength</span>
                    <span className={`text-sm font-medium ${getStrengthTextColor(strength)}`}>
                      {getStrengthText(strength)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-full transition-all duration-500 ${getStrengthColor(strength)} rounded-full`}
                      style={{ width: `${(strength / 5) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Breach Status and Crack Time Display */}
                {password && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Breach Status */}
                    {generatedPasswordBreach && (
                      <div className="glass-option p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          {generatedPasswordBreach.isBreached ? 
                            <AlertTriangle className="w-5 h-5 text-red-400" /> : 
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                          }
                          <span className="text-sm text-gray-300 font-medium">Breach Status:</span>
                        </div>
                        <span className={`text-sm font-bold ${
                          generatedPasswordBreach.isBreached ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {generatedPasswordBreach.isBreached ? 'Compromised' : 'Safe'}
                        </span>
                      </div>
                    )}

                    {/* Crack Time */}
                    {generatedPasswordCrackTime && (
                      <div className="glass-option p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-300 font-medium">Time to crack:</span>
                        </div>
                        <span className="text-sm font-bold text-green-400">
                          {generatedPasswordCrackTime.humanReadable}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Options Card */}
              <Card className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Options</h3>
                
                <div className="space-y-6">
                  {/* Length Slider */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-300">Password Length</label>
                      <span className="text-sm text-blue-400 font-mono">
                        {options.length} characters
                      </span>
                    </div>
                    <Slider
                      value={[options.length]}
                      onValueChange={(value) => setOptions(prev => ({ ...prev, length: value[0] }))}
                      max={64}
                      min={4}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Character Type Options */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between glass-option p-3 rounded-lg">
                      <label className="text-sm text-gray-300">Uppercase (A-Z)</label>
                      <Switch
                        checked={options.includeUppercase}
                        onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeUppercase: checked }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between glass-option p-3 rounded-lg">
                      <label className="text-sm text-gray-300">Lowercase (a-z)</label>
                      <Switch
                        checked={options.includeLowercase}
                        onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeLowercase: checked }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between glass-option p-3 rounded-lg">
                      <label className="text-sm text-gray-300">Numbers (0-9)</label>
                      <Switch
                        checked={options.includeNumbers}
                        onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeNumbers: checked }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between glass-option p-3 rounded-lg">
                      <label className="text-sm text-gray-300">Special Characters (!@#$)</label>
                      <Switch
                        checked={options.includeSpecialChars}
                        onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeSpecialChars: checked }))}
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Keyword Obfuscator */}
              <KeywordObfuscator onPasswordGenerated={handleKeywordPasswordGenerated} />
            </div>
          </TabsContent>

          <TabsContent value="analyzer" className="space-y-6 mt-6">
            <PasswordAnalyzer />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PasswordGenerator;
