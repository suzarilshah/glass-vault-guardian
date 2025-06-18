
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Brain, Sparkles, Copy, Save, RefreshCw, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { obfuscateKeyword } from '@/utils/passwordUtils';

interface AIKeywordObfuscatorProps {
  onPasswordGenerated: (password: string) => void;
  onAnalyzePassword: () => void;
}

interface AIPasswordSuggestion {
  password: string;
  explanation: string;
  strength: string;
}

interface PasswordOptions {
  includeNumbers: boolean;
  includeLowercase: boolean;
  includeUppercase: boolean;
  includeSpecialChars: boolean;
  length: number;
}

const AIKeywordObfuscator: React.FC<AIKeywordObfuscatorProps> = ({ 
  onPasswordGenerated, 
  onAnalyzePassword 
}) => {
  const [keywords, setKeywords] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<AIPasswordSuggestion[]>([]);
  const [selectedPassword, setSelectedPassword] = useState<string>('');
  const [options, setOptions] = useState<PasswordOptions>({
    includeNumbers: true,
    includeLowercase: true,
    includeUppercase: true,
    includeSpecialChars: true,
    length: 12,
  });
  const { toast } = useToast();

  const generateAIPasswords = async () => {
    if (!keywords.trim()) {
      toast({
        title: "Error",
        description: "Please enter at least one keyword",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-passwords', {
        body: { 
          keywords: keywords.trim(),
          requirements: options
        }
      });

      if (error) {
        throw error;
      }

      setSuggestions(data.suggestions || []);
      toast({
        title: "AI Passwords Generated",
        description: `Generated ${data.suggestions?.length || 0} secure password suggestions`,
      });
    } catch (error) {
      console.error('Failed to generate AI passwords:', error);
      
      // Fallback to local obfuscation
      const fallbackPassword = obfuscateKeyword(
        keywords,
        options.includeNumbers,
        options.includeSpecialChars,
        options.includeUppercase
      );
      
      setSuggestions([{
        password: fallbackPassword,
        explanation: "Locally generated using keyword obfuscation (AI temporarily unavailable)",
        strength: "Strong"
      }]);
      
      toast({
        title: "Fallback Generation",
        description: "AI temporarily unavailable, using local generation",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (password: string) => {
    try {
      await navigator.clipboard.writeText(password);
      toast({
        title: "Password Copied",
        description: "Password has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy password to clipboard",
        variant: "destructive",
      });
    }
  };

  const saveToVault = (password: string) => {
    setSelectedPassword(password);
    onPasswordGenerated(password);
    toast({
      title: "Password Selected",
      description: "Password has been selected for saving to vault",
    });
  };

  const analyzePassword = (password: string) => {
    setSelectedPassword(password);
    onPasswordGenerated(password);
    onAnalyzePassword();
  };

  return (
    <Card className="glass-card p-6 border-0 bg-white/5 backdrop-blur-xl">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Brain className="w-5 h-5 text-purple-400" />
        AI Keyword Obfuscator
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Keywords (comma-separated)
          </label>
          <Input
            placeholder="e.g., work, secure, 2024"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="glass-input bg-white/5 border-white/20 text-white"
            onKeyDown={(e) => e.key === 'Enter' && generateAIPasswords()}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">Password Length</label>
            <span className="text-sm text-green-400 font-mono">{options.length} characters</span>
          </div>
          <Slider
            value={[options.length]}
            onValueChange={(value) => setOptions(prev => ({ ...prev, length: value[0] }))}
            max={32}
            min={8}
            step={1}
            className="slider-custom"
          />
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-300">Password Requirements</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center justify-between glass-option p-3 rounded-lg border border-white/10">
              <label className="text-xs text-gray-300">Uppercase (A-Z)</label>
              <Switch
                checked={options.includeUppercase}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeUppercase: checked }))}
              />
            </div>
            
            <div className="flex items-center justify-between glass-option p-3 rounded-lg border border-white/10">
              <label className="text-xs text-gray-300">Lowercase (a-z)</label>
              <Switch
                checked={options.includeLowercase}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeLowercase: checked }))}
              />
            </div>
            
            <div className="flex items-center justify-between glass-option p-3 rounded-lg border border-white/10">
              <label className="text-xs text-gray-300">Numbers (0-9)</label>
              <Switch
                checked={options.includeNumbers}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeNumbers: checked }))}
              />
            </div>
            
            <div className="flex items-center justify-between glass-option p-3 rounded-lg border border-white/10">
              <label className="text-xs text-gray-300">Special Characters</label>
              <Switch
                checked={options.includeSpecialChars}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeSpecialChars: checked }))}
              />
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={generateAIPasswords}
            disabled={isGenerating || !keywords.trim()}
            className="flex-1 glass-button bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate AI Passwords'}
          </Button>

          {suggestions.length > 0 && (
            <Button
              onClick={generateAIPasswords}
              disabled={isGenerating}
              variant="outline"
              className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:border-purple-400"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>

        {suggestions.length > 0 && (
          <div className="space-y-3 mt-4">
            <h4 className="text-sm font-medium text-gray-300">AI Suggestions:</h4>
            {suggestions.map((suggestion, index) => (
              <div 
                key={index} 
                className={`glass-option p-4 rounded-lg border transition-colors ${
                  selectedPassword === suggestion.password 
                    ? 'border-purple-400 bg-purple-400/10' 
                    : 'border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <code className="text-sm font-mono text-green-400 break-all flex-1 mr-3">
                    {suggestion.password}
                  </code>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => copyToClipboard(suggestion.password)}
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => saveToVault(suggestion.password)}
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-green-400 hover:text-green-300 hover:bg-green-400/10"
                      title="Save to vault"
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => analyzePassword(suggestion.password)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3"
                      title="Analyze with AI"
                    >
                      <BarChart3 className="w-4 h-4 mr-1" />
                      AI Analysis
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mb-2">{suggestion.explanation}</p>
                <span className="text-xs text-purple-400 font-medium">
                  Strength: {suggestion.strength}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default AIKeywordObfuscator;
