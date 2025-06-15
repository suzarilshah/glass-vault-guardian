
import React from 'react';
import { Save, Copy, RefreshCw, Shield, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import AdvancedPasswordStrengthIndicator from '@/components/vault/AdvancedPasswordStrengthIndicator';

interface GeneratedPasswordDisplayProps {
  password: string;
  onRegenerate: () => void;
  onSave: () => void;
  onCopy: () => void;
  onAnalyzeWithAI?: () => void;
  showAdvancedScoring: boolean;
  onToggleAdvancedScoring: () => void;
  passwordScore: any;
  crackTime: any;
  breach: any;
}

const GeneratedPasswordDisplay: React.FC<GeneratedPasswordDisplayProps> = ({
  password,
  onRegenerate,
  onSave,
  onCopy,
  onAnalyzeWithAI,
  showAdvancedScoring,
  onToggleAdvancedScoring,
  passwordScore,
  crackTime,
  breach
}) => {
  const { user } = useAuth();

  return (
    <Card className="glass-card mb-6 p-6 border-0 bg-white/5 backdrop-blur-xl">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-400" />
            Generated Password
          </h2>
          <div className="flex gap-2">
            <Button
              onClick={onRegenerate}
              variant="outline"
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-black border-green-500 hover:border-green-400 font-semibold"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
            {password && onAnalyzeWithAI && (
              <Button
                onClick={onAnalyzeWithAI}
                variant="outline"
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white border-purple-500 hover:border-purple-400 font-semibold"
              >
                <Brain className="w-4 h-4 mr-2" />
                Analyze with AI
              </Button>
            )}
          </div>
        </div>
        
        <div className="relative">
          <div className="glass-input p-4 rounded-lg border border-white/20 bg-white/5 font-mono text-lg text-white break-all">
            {password || 'Click regenerate to create a password'}
          </div>
          <div className="absolute right-2 top-2 flex gap-2">
            {user && password && (
              <Button
                onClick={onSave}
                variant="ghost"
                size="sm"
                className="glass-button text-white hover:text-green-400 hover:bg-white/20"
              >
                <Save className="w-4 h-4" />
              </Button>
            )}
            <Button
              onClick={onCopy}
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
            <AdvancedPasswordStrengthIndicator 
              password={password} 
              showDetailed={showAdvancedScoring} 
            />
            
            <div className="flex justify-center">
              <Button
                onClick={onToggleAdvancedScoring}
                variant="ghost"
                size="sm"
                className="text-blue-400 hover:text-blue-300"
              >
                {showAdvancedScoring ? 'Hide' : 'Show'} Detailed Analysis
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {breach && (
                <div className="glass-option p-3 rounded-lg border border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    {breach.isBreached ? 
                      <div className="w-4 h-4 text-red-400">⚠️</div> : 
                      <div className="w-4 h-4 text-green-400">✓</div>
                    }
                    <span className="text-sm text-gray-300">Breach Status:</span>
                  </div>
                  <span className={`text-sm font-semibold ${
                    breach.isBreached ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {breach.isBreached ? 'Compromised' : 'Safe'}
                  </span>
                </div>
              )}

              {crackTime && (
                <div className="glass-option p-3 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Time to crack:</span>
                    <span className="text-sm font-semibold text-green-400">
                      {crackTime.humanReadable}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

export default GeneratedPasswordDisplay;
