
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Brain, Sparkles, Eye } from 'lucide-react';
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
          requirements: {
            includeNumbers: options.includeNumbers,
            includeLowercase: options.includeLowercase,
            includeUppercase: options.includeUppercase,
            includeSpecialChars: options.includeSpecialChars,
          }
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

  const selectPassword = (password: string) => {
    setSelectedPassword(password);
    onPasswordGenerated(password);
    toast({
      title: "Password Selected",
      description: "AI-generated password has been applied",
    });
  };

  const handleAnalyzeSelected = () => {
    if (!selectedPassword) {
      toast({
        title: "Error",
        description: "Please select a password first",
        variant: "destructive"
      });
      return;
    }
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
        
        <Button
          onClick={generateAIPasswords}
          disabled={isGenerating || !keywords.trim()}
          className="w-full glass-button bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {isGenerating ? 'Generating...' : 'Generate AI Passwords'}
        </Button>

        {suggestions.length > 0 && (
          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-300">AI Suggestions:</h4>
              {selectedPassword && (
                <Button
                  onClick={handleAnalyzeSelected}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Analyze Selected
                </Button>
              )}
            </div>
            {suggestions.map((suggestion, index) => (
              <div 
                key={index} 
                className={`glass-option p-3 rounded-lg border transition-colors ${
                  selectedPassword === suggestion.password 
                    ? 'border-purple-400 bg-purple-400/10' 
                    : 'border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <code className="text-sm font-mono text-green-400 break-all">
                    {suggestion.password}
                  </code>
                  <Button
                    onClick={() => selectPassword(suggestion.password)}
                    size="sm"
                    className={`ml-2 ${
                      selectedPassword === suggestion.password
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'bg-green-600 hover:bg-green-700'
                    } text-white`}
                  >
                    {selectedPassword === suggestion.password ? 'Selected' : 'Use'}
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mb-1">{suggestion.explanation}</p>
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
