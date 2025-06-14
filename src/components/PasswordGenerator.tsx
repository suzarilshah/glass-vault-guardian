
import React, { useState, useEffect } from 'react';
import { Save, Copy, RefreshCw, Shield, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { calculateCrackTime } from '@/utils/passwordUtils';
import { calculatePasswordScore } from '@/utils/passwordScoring';
import { checkPasswordBreach } from '@/utils/breachChecker';
import { useAuth } from '@/contexts/AuthContext';
import KeywordObfuscator from './KeywordObfuscator';
import PasswordAnalyzer from './PasswordAnalyzer';
import SavePasswordModal from './SavePasswordModal';
import AdvancedPasswordStrengthIndicator from './vault/AdvancedPasswordStrengthIndicator';

interface PasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSpecialChars: boolean;
}

interface PasswordGeneratorProps {
  onSavePassword?: (password: string) => void;
}

const PasswordGenerator: React.FC<PasswordGeneratorProps> = () => {
  const [password, setPassword] = useState('');
  const [options, setOptions] = useState<PasswordOptions>({
    length: 12,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSpecialChars: true,
  });
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showAdvancedScoring, setShowAdvancedScoring] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

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

  const handleSavePassword = () => {
    if (!password) {
      toast({
        title: "Error",
        description: "No password to save",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "Please sign in to save passwords",
        variant: "destructive"
      });
      return;
    }

    setShowSaveModal(true);
  };

  const handleKeywordPasswordGenerated = (keywordPassword: string) => {
    setPassword(keywordPassword);
  };

  useEffect(() => {
    generatePassword();
  }, [options]);

  const generatedPasswordCrackTime = password ? calculateCrackTime(password) : null;
  const generatedPasswordBreach = password ? checkPasswordBreach(password) : null;
  const passwordScore = password ? calculatePasswordScore(password) : null;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="generator" className="w-full">
        <TabsList className="grid w-full grid-cols-2 glass-card bg-white/5 backdrop-blur-xl border-white/20">
          <TabsTrigger 
            value="generator" 
            className="text-white data-[state=active]:bg-white/10 data-[state=active]:text-green-400"
          >
            Password Generator
          </TabsTrigger>
          <TabsTrigger 
            value="analyzer" 
            className="text-white data-[state=active]:bg-white/10 data-[state=active]:text-green-400"
          >
            Password Analyzer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-6 mt-6">
          <Card className="glass-card mb-6 p-6 border-0 bg-white/5 backdrop-blur-xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  Generated Password
                </h2>
                <div className="flex gap-2">
                  <Button
                    onClick={generatePassword}
                    variant="outline"
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-black border-green-500 hover:border-green-400 font-semibold"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                </div>
              </div>
              
              <div className="relative">
                <div className="glass-input p-4 rounded-lg border border-white/20 bg-white/5 font-mono text-lg text-white break-all">
                  {password || 'Click regenerate to create a password'}
                </div>
                <div className="absolute right-2 top-2 flex gap-2">
                  {user && password && (
                    <Button
                      onClick={handleSavePassword}
                      variant="ghost"
                      size="sm"
                      className="glass-button text-white hover:text-green-400 hover:bg-white/20"
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    onClick={copyToClipboard}
                    variant="ghost"
                    size="sm"
                    className="glass-button text-white hover:text-green-400 hover:bg-white/20"
                    disabled={!password}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {password && passwordScore && (
                <>
                  {/* New Advanced Password Scoring */}
                  <AdvancedPasswordStrengthIndicator 
                    password={password} 
                    showDetailed={showAdvancedScoring} 
                  />
                  
                  <div className="flex justify-center">
                    <Button
                      onClick={() => setShowAdvancedScoring(!showAdvancedScoring)}
                      variant="ghost"
                      size="sm"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      {showAdvancedScoring ? 'Hide' : 'Show'} Detailed Analysis
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card p-6 border-0 bg-white/5 backdrop-blur-xl">
              <h3 className="text-lg font-semibold text-white mb-4">Customization Options</h3>
              
              <div className="space-y-6">
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
                  {options.length < 10 && (
                    <div className="flex items-center gap-2 mt-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-red-400 font-medium">
                        Warning: Secure passwords require 10 or more characters
                      </span>
                    </div>
                  )}
                </div>

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
                    <label className="text-sm text-gray-300">Special Characters</label>
                    <Switch
                      checked={options.includeSpecialChars}
                      onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeSpecialChars: checked }))}
                    />
                  </div>
                </div>
              </div>
            </Card>

            <KeywordObfuscator onPasswordGenerated={handleKeywordPasswordGenerated} />
          </div>
        </TabsContent>

        <TabsContent value="analyzer" className="space-y-6 mt-6">
          <PasswordAnalyzer />
        </TabsContent>
      </Tabs>

      {showSaveModal && (
        <SavePasswordModal
          isOpen={showSaveModal}
          password={password}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
};

export default PasswordGenerator;
