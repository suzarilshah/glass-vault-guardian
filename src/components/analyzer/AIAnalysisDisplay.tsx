
import React, { useState } from 'react';
import { Brain, Copy, Save, Lightbulb, Shield, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface AIAnalysisDisplayProps {
  analysis: {
    insights: string;
    suggestions: string[];
    riskAssessment: string;
    improvements: string[];
    crossCheck?: {
      scoreValidation: string;
      entropyValidation: string;
      timeValidation: string;
      overallAssessment: string;
    };
  };
  onSavePassword?: (password: string) => void;
}

const AIAnalysisDisplay: React.FC<AIAnalysisDisplayProps> = ({ analysis, onSavePassword }) => {
  const { toast } = useToast();
  const [showCrossCheck, setShowCrossCheck] = useState(true); // Default to true (expanded)
  const [showImprovements, setShowImprovements] = useState(true); // Default to true (expanded)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Password copied to clipboard",
      });
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast({
        title: "Error",
        description: "Failed to copy password to clipboard",
        variant: "destructive"
      });
    }
  };

  const handleSavePassword = (password: string) => {
    if (onSavePassword) {
      onSavePassword(password);
    } else {
      toast({
        title: "Feature Coming Soon",
        description: "Password vault integration will be available soon",
      });
    }
  };

  return (
    <Card className="glass-card p-6 border-0 bg-white/5 backdrop-blur-xl">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Grok 3 AI Analysis</h3>
        </div>

        {/* Main Insights & Risk Assessment - Side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-option p-4 rounded-lg border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              <div className="text-sm font-medium text-gray-300">AI Insights</div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">{analysis.insights}</p>
          </div>

          <div className="glass-option p-4 rounded-lg border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <div className="text-sm font-medium text-gray-300">Risk Assessment</div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">{analysis.riskAssessment}</p>
          </div>
        </div>

        {/* AI Cross-Check Validation - Collapsible - Only show if crossCheck exists */}
        {analysis.crossCheck && (
          <div className="glass-option p-4 rounded-lg border border-white/10">
            <Button
              variant="ghost"
              onClick={() => setShowCrossCheck(!showCrossCheck)}
              className="w-full flex items-center justify-between p-0 text-left hover:bg-transparent"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <div className="text-sm font-medium text-gray-300">Technical Validation</div>
              </div>
              {showCrossCheck ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            
            {showCrossCheck && (
              <div className="mt-3 space-y-2">
                <div className="text-xs text-gray-400 mb-2">{analysis.crossCheck.overallAssessment}</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-purple-400">Score:</span>
                    <span className="text-gray-300 ml-1">{analysis.crossCheck.scoreValidation}</span>
                  </div>
                  <div>
                    <span className="text-blue-400">Entropy:</span>
                    <span className="text-gray-300 ml-1">{analysis.crossCheck.entropyValidation}</span>
                  </div>
                  <div>
                    <span className="text-green-400">Time:</span>
                    <span className="text-gray-300 ml-1">{analysis.crossCheck.timeValidation}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Password Suggestions */}
        {analysis.suggestions.length > 0 && (
          <div className="glass-option p-4 rounded-lg border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-green-400" />
              <div className="text-sm font-medium text-gray-300">AI Generated Suggestions</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {analysis.suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-gray-800/50 rounded border border-gray-700"
                >
                  <code className="flex-1 text-green-400 font-mono text-xs break-all">
                    {suggestion}
                  </code>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(suggestion)}
                      className="text-gray-400 hover:text-white p-1 h-auto"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSavePassword(suggestion)}
                      className="text-gray-400 hover:text-white p-1 h-auto"
                    >
                      <Save className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Improvements - Collapsible */}
        {analysis.improvements.length > 0 && (
          <div className="glass-option p-4 rounded-lg border border-white/10">
            <Button
              variant="ghost"
              onClick={() => setShowImprovements(!showImprovements)}
              className="w-full flex items-center justify-between p-0 text-left hover:bg-transparent"
            >
              <div className="text-sm font-medium text-gray-300">Recommended Improvements</div>
              {showImprovements ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            
            {showImprovements && (
              <ul className="text-xs text-gray-300 space-y-1 mt-2">
                {analysis.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default AIAnalysisDisplay;
