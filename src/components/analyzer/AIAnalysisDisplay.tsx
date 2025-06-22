
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, CheckCircle, AlertTriangle, XCircle, Copy, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SavePasswordModal from '@/components/SavePasswordModal';

interface AIAnalysisResponse {
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
  similarPasswordSuggestions?: Array<{
    password: string;
    explanation: string;
    strength: 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Very Strong';
  }>;
}

interface AIAnalysisDisplayProps {
  analysis: AIAnalysisResponse;
  originalPassword: string;
  onSavePassword: (password: string) => void;
}

const AIAnalysisDisplay: React.FC<AIAnalysisDisplayProps> = ({ 
  analysis, 
  originalPassword, 
  onSavePassword 
}) => {
  const { toast } = useToast();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [passwordToSave, setPasswordToSave] = useState('');

  const copyToClipboard = async (password: string) => {
    try {
      await navigator.clipboard.writeText(password);
      toast({
        title: "Copied!",
        description: "Password copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy password",
        variant: "destructive"
      });
    }
  };

  const handleSavePassword = (password: string) => {
    setPasswordToSave(password);
    setShowSaveModal(true);
  };

  const getStrengthColor = (strength: string) => {
    switch (strength.toLowerCase()) {
      case 'very strong': return 'bg-green-600';
      case 'strong': return 'bg-green-500';
      case 'good': return 'bg-yellow-500';
      case 'fair': return 'bg-orange-500';
      case 'weak': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskIcon = (assessment: string) => {
    if (assessment.toLowerCase().includes('low')) return <CheckCircle className="w-5 h-5 text-green-400" />;
    if (assessment.toLowerCase().includes('medium')) return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    return <XCircle className="w-5 h-5 text-red-400" />;
  };

  return (
    <>
      <Card className="glass-card p-6 bg-white/5 backdrop-blur-xl border-white/20">
        <div className="flex items-center mb-6">
          <Brain className="w-6 h-6 text-purple-400 mr-3" />
          <h3 className="text-xl font-semibold text-white">AI Security Analysis</h3>
        </div>

        <div className="space-y-6">
          {/* AI Insights */}
          <div>
            <h4 className="text-lg font-medium text-white mb-3">Security Insights</h4>
            <p className="text-gray-300 leading-relaxed">{analysis.insights}</p>
          </div>

          {/* Risk Assessment */}
          <div>
            <h4 className="text-lg font-medium text-white mb-3 flex items-center">
              Risk Assessment
              <span className="ml-2">{getRiskIcon(analysis.riskAssessment)}</span>
            </h4>
            <p className="text-gray-300">{analysis.riskAssessment}</p>
          </div>

          {/* Suggestions */}
          {analysis.suggestions && analysis.suggestions.length > 0 && (
            <div>
              <h4 className="text-lg font-medium text-white mb-3">Recommendations</h4>
              <ul className="space-y-2">
                {analysis.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cross-check Validation */}
          <div>
            <h4 className="text-lg font-medium text-white mb-3">Cross-Check Validation</h4>
            <div className="space-y-3">
              <div className="bg-white/5 p-3 rounded-lg">
                <span className="text-sm font-medium text-gray-300">Score Validation:</span>
                <p className="text-gray-300 text-sm mt-1">{analysis.crossCheck.scoreValidation}</p>
              </div>
              <div className="bg-white/5 p-3 rounded-lg">
                <span className="text-sm font-medium text-gray-300">Entropy Validation:</span>
                <p className="text-gray-300 text-sm mt-1">{analysis.crossCheck.entropyValidation}</p>
              </div>
              <div className="bg-white/5 p-3 rounded-lg">
                <span className="text-sm font-medium text-gray-300">Time Validation:</span>
                <p className="text-gray-300 text-sm mt-1">{analysis.crossCheck.timeValidation}</p>
              </div>
              <div className="bg-white/5 p-3 rounded-lg">
                <span className="text-sm font-medium text-gray-300">Overall Assessment:</span>
                <p className="text-gray-300 text-sm mt-1">{analysis.crossCheck.overallAssessment}</p>
              </div>
            </div>
          </div>

          {/* Similar Password Suggestions */}
          {analysis.similarPasswordSuggestions && analysis.similarPasswordSuggestions.length > 0 && (
            <div>
              <h4 className="text-lg font-medium text-white mb-3">Similarly AI Generated Suggestions</h4>
              <div className="space-y-3">
                {analysis.similarPasswordSuggestions.map((suggestion, index) => (
                  <div key={index} className="bg-white/5 p-4 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <code className="text-sm font-mono text-green-400 break-all flex-1 mr-3">
                        {suggestion.password}
                      </code>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStrengthColor(suggestion.strength)} text-white text-xs`}>
                          {suggestion.strength}
                        </Badge>
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
                          onClick={() => handleSavePassword(suggestion.password)}
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-green-400 hover:text-green-300 hover:bg-green-400/10"
                          title="Save to vault"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">{suggestion.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Improvements */}
          {analysis.improvements && analysis.improvements.length > 0 && (
            <div>
              <h4 className="text-lg font-medium text-white mb-3">Security Improvements</h4>
              <ul className="space-y-2">
                {analysis.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>

      {showSaveModal && (
        <SavePasswordModal
          isOpen={showSaveModal}
          password={passwordToSave}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </>
  );
};

export default AIAnalysisDisplay;
