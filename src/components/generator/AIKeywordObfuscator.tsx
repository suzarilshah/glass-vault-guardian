
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Brain, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AIKeywordObfuscatorProps {
  onPasswordGenerated: (password: string) => void;
}

interface AIPasswordSuggestion {
  password: string;
  explanation: string;
  strength: string;
}

const AIKeywordObfuscator: React.FC<AIKeywordObfuscatorProps> = ({ onPasswordGenerated }) => {
  const [keywords, setKeywords] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<AIPasswordSuggestion[]>([]);
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
        body: { keywords: keywords.trim() }
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
      toast({
        title: "Generation Failed",
        description: "Unable to generate AI passwords. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const selectPassword = (password: string) => {
    onPasswordGenerated(password);
    toast({
      title: "Password Selected",
      description: "AI-generated password has been applied",
    });
  };

  return (
    <Card className="glass-card p-6 border-0 bg-white/5 backdrop-blur-xl">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Brain className="w-5 h-5 text-purple-400" />
        AI Password Generation
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
            <h4 className="text-sm font-medium text-gray-300">AI Suggestions:</h4>
            {suggestions.map((suggestion, index) => (
              <div key={index} className="glass-option p-3 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <code className="text-sm font-mono text-green-400 break-all">
                    {suggestion.password}
                  </code>
                  <Button
                    onClick={() => selectPassword(suggestion.password)}
                    size="sm"
                    className="ml-2 bg-green-600 hover:bg-green-700 text-white"
                  >
                    Use
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
