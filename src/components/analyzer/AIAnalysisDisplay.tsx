
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Brain, Shield, AlertTriangle, CheckCircle, Copy, Save, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AIAnalysisDisplayProps {
  analysis: {
    insights: string;
    suggestions: string[];
    riskAssessment: string;
    improvements: string[];
    crossCheck: {
      scoreValidation: string;
      entropyValidation: string;
      timeValidation: string;
      overallAssessment: string;
    };
  };
  onSavePassword: (password: string) => void;
  originalPassword: string;
}

interface SimilarPassword {
  password: string;
  explanation: string;
  strength: string;
}

const AIAnalysisDisplay: React.FC<AIAnalysisDisplayProps> = ({ 
  analysis, 
  onSavePassword,
  originalPassword 
}) => {
  const [similarPasswords, setSimilarPasswords] = useState<SimilarPassword[]>([]);
  const [isGeneratingSimilar, setIsGeneratingSimilar] = useState(false);
  const { toast } = useToast();

  const generateSimilarPasswords = async () => {
    if (!originalPassword.trim()) {
      toast({
        title: "Error",
        description: "No password provided for generating similar passwords",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingSimilar(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-passwords', {
        body: { 
          keywords: `similar to password style: ${originalPassword}`,
          requirements: {
            includeNumbers: true,
            includeLowercase: true,
            includeUppercase: true,
            includeSpecialChars: true,
            length: originalPassword.length
          }
        }
      });

      if (error) throw error;

      setSimilarPasswords(data.suggestions || []);
      toast({
        title: "Similar Passwords Generated",
        description: `Generated ${data.suggestions?.length || 0} similar password suggestions`,
      });
    } catch (error) {
      console.error('Failed to generate similar passwords:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate similar passwords. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSimilar(false);
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
    onSavePassword(password);
    toast({
      title: "Password Ready to Save",
      description: "Password is ready to be saved to vault",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card p-6 border-0 bg-white/5 backdrop-blur-xl">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          AI Security Analysis
        </h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              Security Insights
            </h4>
            <p className="text-sm text-gray-300 leading-relaxed">{analysis.insights}</p>
          </div>

          <Separator className="bg-white/10" />

          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              Risk Assessment
            </h4>
            <p className="text-sm text-gray-300 leading-relaxed">{analysis.riskAssessment}</p>
          </div>

          <Separator className="bg-white/10" />

          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Recommendations</h4>
            <ul className="space-y-2">
              {analysis.suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>

          <Separator className="bg-white/10" />

          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Technical Validation</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="glass-option p-3 rounded-lg border border-white/10">
                <h5 className="text-xs font-medium text-blue-400 mb-1">Score Validation</h5>
                <p className="text-xs text-gray-300">{analysis.crossCheck.scoreValidation}</p>
              </div>
              <div className="glass-option p-3 rounded-lg border border-white/10">
                <h5 className="text-xs font-medium text-green-400 mb-1">Entropy Assessment</h5>
                <p className="text-xs text-gray-300">{analysis.crossCheck.entropyValidation}</p>
              </div>
              <div className="glass-option p-3 rounded-lg border border-white/10">
                <h5 className="text-xs font-medium text-yellow-400 mb-1">Time Validation</h5>
                <p className="text-xs text-gray-300">{analysis.crossCheck.timeValidation}</p>
              </div>
              <div className="glass-option p-3 rounded-lg border border-white/10">
                <h5 className="text-xs font-medium text-purple-400 mb-1">Overall Assessment</h5>
                <p className="text-xs text-gray-300">{analysis.crossCheck.overallAssessment}</p>
              </div>
            </div>
          </div>

          {analysis.improvements.length > 0 && (
            <>
              <Separator className="bg-white/10" />
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-3">Suggested Improvements</h4>
                <ul className="space-y-2">
                  {analysis.improvements.map((improvement, index) => (
                    <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-orange-400">•</span>
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Similarly AI Generated Suggestions Section */}
      <Card className="glass-card p-6 border-0 bg-white/5 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            Similarly AI Generated Suggestions based on the password
          </h3>
          <Button
            onClick={generateSimilarPasswords}
            disabled={isGeneratingSimilar}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingSimilar ? 'animate-spin' : ''}`} />
            {isGeneratingSimilar ? 'Generating...' : 'Generate Similar'}
          </Button>
        </div>

        {similarPasswords.length === 0 && !isGeneratingSimilar && (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">Click "Generate Similar" to get AI-generated passwords similar to your current one</p>
          </div>
        )}

        {similarPasswords.length > 0 && (
          <div className="space-y-3">
            {similarPasswords.map((similar, index) => (
              <div key={index} className="glass-option p-4 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <code className="text-sm font-mono text-green-400 break-all flex-1 mr-3">
                    {similar.password}
                  </code>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => copyToClipboard(similar.password)}
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => saveToVault(similar.password)}
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-green-400 hover:text-green-300 hover:bg-green-400/10"
                      title="Save to vault"
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mb-2">{similar.explanation}</p>
                <Badge variant="secondary" className="text-xs">
                  Strength: {similar.strength}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AIAnalysisDisplay;
