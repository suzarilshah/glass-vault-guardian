
import React from 'react';
import { Brain, Copy, Save, Lightbulb, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface AIAnalysisDisplayProps {
  analysis: {
    insights: string;
    suggestions: string[];
    riskAssessment: string;
    improvements: string[];
  };
  onSavePassword?: (password: string) => void;
}

const AIAnalysisDisplay: React.FC<AIAnalysisDisplayProps> = ({ analysis, onSavePassword }) => {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Password copied to clipboard",
    });
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Grok 3 AI Analysis</h3>
        </div>

        {/* AI Insights */}
        <div className="glass-option p-4 rounded-lg border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-yellow-400" />
            <div className="text-sm font-medium text-gray-300">AI Insights</div>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">{analysis.insights}</p>
        </div>

        {/* Risk Assessment */}
        <div className="glass-option p-4 rounded-lg border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <div className="text-sm font-medium text-gray-300">Risk Assessment</div>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">{analysis.riskAssessment}</p>
        </div>

        {/* Password Suggestions */}
        {analysis.suggestions.length > 0 && (
          <div className="glass-option p-4 rounded-lg border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-green-400" />
              <div className="text-sm font-medium text-gray-300">AI Generated Suggestions</div>
            </div>
            <div className="space-y-2">
              {analysis.suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                >
                  <code className="flex-1 text-green-400 font-mono text-sm break-all">
                    {suggestion}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(suggestion)}
                    className="text-gray-400 hover:text-white"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSavePassword(suggestion)}
                    className="text-gray-400 hover:text-white"
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Improvements */}
        {analysis.improvements.length > 0 && (
          <div className="glass-option p-4 rounded-lg border border-white/10">
            <div className="text-sm font-medium text-gray-300 mb-2">Recommended Improvements</div>
            <ul className="text-xs text-gray-300 space-y-1">
              {analysis.improvements.map((improvement, index) => (
                <li key={index} className="flex items-start gap-1">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>{improvement}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AIAnalysisDisplay;
