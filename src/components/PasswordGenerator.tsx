
import React, { useState, useEffect } from 'react';
import { Copy, RefreshCw, Shield, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
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

  useEffect(() => {
    generatePassword();
  }, [options]);

  useEffect(() => {
    setStrength(calculateStrength(password));
  }, [password]);

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

  const handleKeywordPasswordGenerated = (keywordPassword: string) => {
    setPassword(keywordPassword);
  };

  const generatedPasswordCrackTime = password ? calculateCrackTime(password) : null;
  const generatedPasswordBreach = password ? checkPasswordBreach(password) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-white to-green-400 bg-clip-text text-transparent">
            Password Generator
          </h1>
          <p className="text-gray-400">Generate secure passwords with advanced customization</p>
        </div>

        {/* Main Password Card */}
        <Card className="glass-card mb-6 p-6 border-0 bg-white/5 backdrop-blur-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                Generated Password
              </h2>
              <Button
                onClick={generatePassword}
                variant="outline"
                size="sm"
                className="glass-button border-white/20 text-white hover:bg-white/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
            </div>
            
            <div className="relative">
              <div className="glass-input p-4 rounded-lg border border-white/20 bg-white/5 font-mono text-lg text-white break-all">
                {password || 'Click regenerate to create a password'}
              </div>
              <Button
                onClick={copyToClipboard}
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2 text-green-400 hover:text-green-300 hover:bg-white/10"
                disabled={!password}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>

            {/* Strength Indicator */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Password Strength</span>
                <span className={`text-sm font-medium ${
                  strength <= 2 ? 'text-red-400' : 
                  strength <= 3 ? 'text-yellow-400' : 
                  strength <= 4 ? 'text-blue-400' : 'text-green-400'
                }`}>
                  {getStrengthText(strength)}
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${getStrengthColor(strength)}`}
                  style={{ width: `${(strength / 5) * 100}%` }}
                />
              </div>
            </div>

            {/* Breach Status and Crack Time Display */}
            {password && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Breach Status */}
                {generatedPasswordBreach && (
                  <div className="glass-option p-3 rounded-lg border border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                      {generatedPasswordBreach.isBreached ? 
                        <AlertTriangle className="w-4 h-4 text-red-400" /> : 
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      }
                      <span className="text-sm text-gray-300">Breach Status:</span>
                    </div>
                    <span className={`text-sm font-semibold ${
                      generatedPasswordBreach.isBreached ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {generatedPasswordBreach.isBreached ? 'Compromised' : 'Safe'}
                    </span>
                  </div>
                )}

                {/* Crack Time */}
                {generatedPasswordCrackTime && (
                  <div className="glass-option p-3 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Time to crack:</span>
                      <span className="text-sm font-semibold text-green-400">
                        {generatedPasswordCrackTime.humanReadable}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Options Card */}
          <Card className="glass-card p-6 border-0 bg-white/5 backdrop-blur-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Customization Options</h3>
            
            <div className="space-y-6">
              {/* Length Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-300">Password Length</label>
                  <span className="text-sm text-green-400 font-mono">{options.length} characters</span>
                </div>
                <Slider
                  value={[options.length]}
                  onValueChange={(value) => setOptions(prev => ({ ...prev, length: value[0] }))}
                  max={64}
                  min={4}
                  step={1}
                  className="slider-custom"
                />
              </div>

              {/* Character Type Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between glass-option p-3 rounded-lg border border-white/10">
                  <label className="text-sm text-gray-300">Uppercase (A-Z)</label>
                  <Switch
                    checked={options.includeUppercase}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeUppercase: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between glass-option p-3 rounded-lg border border-white/10">
                  <label className="text-sm text-gray-300">Lowercase (a-z)</label>
                  <Switch
                    checked={options.includeLowercase}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeLowercase: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between glass-option p-3 rounded-lg border border-white/10">
                  <label className="text-sm text-gray-300">Numbers (0-9)</label>
                  <Switch
                    checked={options.includeNumbers}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeNumbers: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between glass-option p-3 rounded-lg border border-white/10">
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

        {/* Password Analyzer */}
        <PasswordAnalyzer />
      </div>
    </div>
  );
};

export default PasswordGenerator;
