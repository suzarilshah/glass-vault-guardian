
import React, { useState, useEffect } from 'react';
import { calculateCrackTime, calculatePasswordEntropy } from '@/utils/passwordUtils';
import { useDebouncedBreachCheck } from '@/hooks/useDebouncedBreachCheck';
import { calculatePasswordScore } from '@/utils/passwordScoring';
import { useAIPasswordAnalysis } from '@/hooks/useAIPasswordAnalysis';
import AIAnalysisDisplay from '@/components/analyzer/AIAnalysisDisplay';
import PasswordAnalysisInput from '@/components/analyzer/PasswordAnalysisInput';
import PasswordStrengthAnalysis from '@/components/analyzer/PasswordStrengthAnalysis';
import PasswordBreachStatus from '@/components/analyzer/PasswordBreachStatus';
import PasswordSecurityMetrics from '@/components/analyzer/PasswordSecurityMetrics';

interface PasswordAnalyzerProps {
  initialPassword?: string;
}

const PasswordAnalyzer: React.FC<PasswordAnalyzerProps> = ({ initialPassword = '' }) => {
  const [testPassword, setTestPassword] = useState(initialPassword);
  const [analysis, setAnalysis] = useState<{
    entropy: number;
    crackTime: { seconds: number; humanReadable: string };
    passwordScore: any;
  } | null>(null);

  const { result: breachResult, isLoading: breachLoading } = useDebouncedBreachCheck(testPassword, 500);
  const { isAnalyzing, aiAnalysis, analyzePasswordWithAI, clearAnalysis } = useAIPasswordAnalysis();

  // Update password when initialPassword changes
  useEffect(() => {
    if (initialPassword && initialPassword !== testPassword) {
      setTestPassword(initialPassword);
    }
  }, [initialPassword]);

  const analyzePassword = () => {
    if (!testPassword) {
      setAnalysis(null);
      clearAnalysis();
      return;
    }

    const entropy = calculatePasswordEntropy(testPassword);
    const crackTime = calculateCrackTime(testPassword);
    const passwordScore = calculatePasswordScore(testPassword);
    
    setAnalysis({ entropy, crackTime, passwordScore });
  };

  // Auto-analyze when testPassword changes
  useEffect(() => {
    analyzePassword();
    if (!testPassword) clearAnalysis();
  }, [testPassword]);

  const handlePasswordChange = (password: string) => {
    setTestPassword(password);
    if (!password) clearAnalysis();
  };

  const handleAIAnalysis = () => {
    if (analysis) {
      analyzePasswordWithAI(testPassword, {
        entropy: analysis.entropy,
        crackTime: analysis.crackTime,
        passwordScore: analysis.passwordScore,
        breachStatus: breachResult,
      });
    }
  };

  return (
    <div className="space-y-6">
      <PasswordAnalysisInput
        testPassword={testPassword}
        onPasswordChange={handlePasswordChange}
        onAIAnalysis={handleAIAnalysis}
        isAnalyzing={isAnalyzing}
        hasAnalysis={!!analysis}
      />

      {(analysis || breachResult || breachLoading) && testPassword && (
        <div className="space-y-4">
          {analysis && (
            <>
              <PasswordStrengthAnalysis passwordScore={analysis.passwordScore} />
              <PasswordBreachStatus 
                breachResult={breachResult} 
                breachLoading={breachLoading} 
              />
              <PasswordSecurityMetrics 
                entropy={analysis.entropy}
                crackTime={analysis.crackTime}
              />
            </>
          )}
        </div>
      )}

      {/* AI Analysis Results */}
      {aiAnalysis && (
        <AIAnalysisDisplay 
          analysis={aiAnalysis}
          onSavePassword={(password) => {
            // TODO: Integrate with password vault
            console.log('Save password to vault:', password);
          }}
        />
      )}
    </div>
  );
};

export default PasswordAnalyzer;
