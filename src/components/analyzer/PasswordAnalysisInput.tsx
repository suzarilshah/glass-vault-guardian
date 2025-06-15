
import React from 'react';
import { Calculator, Brain, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface PasswordAnalysisInputProps {
  testPassword: string;
  onPasswordChange: (password: string) => void;
  onAIAnalysis: () => void;
  isAnalyzing: boolean;
  hasAnalysis: boolean;
}

const PasswordAnalysisInput: React.FC<PasswordAnalysisInputProps> = ({
  testPassword,
  onPasswordChange,
  onAIAnalysis,
  isAnalyzing,
  hasAnalysis
}) => {
  return (
    <Card className="glass-card p-6 border-0 bg-white/5 backdrop-blur-xl">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Password Analyzer</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Enter password to analyze
            </label>
            <Input
              type="password"
              value={testPassword}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="Enter a password to check strength, crack time and breach status"
              className="glass-input border-white/20 bg-white/5 text-white placeholder:text-gray-400"
            />
          </div>

          {testPassword && hasAnalysis && (
            <div className="flex gap-2">
              <Button
                onClick={onAIAnalysis}
                disabled={isAnalyzing}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing with Grok 3...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Get AI Insights
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PasswordAnalysisInput;
