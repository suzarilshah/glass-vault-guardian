
import React, { useState } from 'react';
import { Type, Wand2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { obfuscateKeyword, calculateCrackTime } from '@/utils/passwordUtils';

interface KeywordObfuscatorProps {
  onPasswordGenerated: (password: string) => void;
}

const KeywordObfuscator = ({ onPasswordGenerated }: KeywordObfuscatorProps) => {
  const [keyword, setKeyword] = useState('');
  const [obfuscatedPassword, setObfuscatedPassword] = useState('');
  const [options, setOptions] = useState({
    includeNumbers: true,
    includeSpecialChars: true,
    includeUppercase: true,
  });
  const { toast } = useToast();

  const handleObfuscate = () => {
    if (!keyword.trim()) {
      toast({
        title: "Error",
        description: "Please enter a keyword to obfuscate",
        variant: "destructive"
      });
      return;
    }

    const obfuscated = obfuscateKeyword(
      keyword,
      options.includeNumbers,
      options.includeSpecialChars,
      options.includeUppercase
    );
    
    setObfuscatedPassword(obfuscated);
    onPasswordGenerated(obfuscated);
  };

  const copyToClipboard = async () => {
    if (!obfuscatedPassword) return;
    
    try {
      await navigator.clipboard.writeText(obfuscatedPassword);
      toast({
        title: "Copied!",
        description: "Obfuscated password copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy password",
        variant: "destructive"
      });
    }
  };

  const crackTime = obfuscatedPassword ? calculateCrackTime(obfuscatedPassword) : null;

  return (
    <Card className="glass-card p-6 border-0 bg-white/5 backdrop-blur-xl">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Type className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Keyword Obfuscator</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Enter your keyword
            </label>
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g., sunshine, coffee, adventure"
              className="glass-input border-white/20 bg-white/5 text-white placeholder:text-gray-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center justify-between glass-option p-3 rounded-lg border border-white/10">
              <label className="text-xs text-gray-300">Numbers</label>
              <Switch
                checked={options.includeNumbers}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeNumbers: checked }))}
              />
            </div>
            
            <div className="flex items-center justify-between glass-option p-3 rounded-lg border border-white/10">
              <label className="text-xs text-gray-300">Special Chars</label>
              <Switch
                checked={options.includeSpecialChars}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeSpecialChars: checked }))}
              />
            </div>
            
            <div className="flex items-center justify-between glass-option p-3 rounded-lg border border-white/10">
              <label className="text-xs text-gray-300">Uppercase</label>
              <Switch
                checked={options.includeUppercase}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeUppercase: checked }))}
              />
            </div>
          </div>

          <Button
            onClick={handleObfuscate}
            className="w-full glass-button border-white/20 text-white hover:bg-white/10"
            variant="outline"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Obfuscate Keyword
          </Button>

          {obfuscatedPassword && (
            <div className="space-y-3">
              <div className="relative">
                <div className="glass-input p-4 rounded-lg border border-white/20 bg-white/5 font-mono text-lg text-white break-all pr-12">
                  {obfuscatedPassword}
                </div>
                <Button
                  onClick={copyToClipboard}
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2 text-green-400 hover:text-green-300 hover:bg-white/10"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>

              {crackTime && (
                <div className="glass-option p-3 rounded-lg border border-white/10">
                  <div className="text-sm text-gray-300">Time to crack:</div>
                  <div className="text-lg font-semibold text-green-400">
                    {crackTime.humanReadable}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default KeywordObfuscator;
