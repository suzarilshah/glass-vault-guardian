
import React, { useState } from 'react';
import { Shield, Calculator, AlertTriangle, CheckCircle, BarChart3, Loader2, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { calculateCrackTime, calculatePasswordEntropy } from '@/utils/passwordUtils';
import { useDebouncedBreachCheck } from '@/hooks/useDebouncedBreachCheck';
import { calculatePasswordScore } from '@/utils/passwordScoring';

const PasswordAnalyzer = () => {
  const [testPassword, setTestPassword] = useState('');
  const [analysis, setAnalysis] = useState<{
    entropy: number;
    crackTime: { seconds: number; humanReadable: string };
    passwordScore: any;
  } | null>(null);

  // Use the debounced breach check hook
  const { result: breachResult, isLoading: breachLoading } = useDebouncedBreachCheck(testPassword, 500);

  const analyzePassword = () => {
    if (!testPassword) {
      setAnalysis(null);
      return;
    }

    const entropy = calculatePasswordEntropy(testPassword);
    const crackTime = calculateCrackTime(testPassword);
    const passwordScore = calculatePasswordScore(testPassword);
    
    setAnalysis({ entropy, crackTime, passwordScore });
  };

  const getSecurityLevel = (entropy: number) => {
    if (entropy < 28) return { level: 'Very Weak', color: 'text-red-400', bg: 'bg-red-500' };
    if (entropy < 36) return { level: 'Weak', color: 'text-orange-400', bg: 'bg-orange-500' };
    if (entropy < 60) return { level: 'Fair', color: 'text-yellow-400', bg: 'bg-yellow-500' };
    if (entropy < 128) return { level: 'Strong', color: 'text-blue-400', bg: 'bg-blue-500' };
    return { level: 'Very Strong', color: 'text-green-400', bg: 'bg-green-500' };
  };

  const getBreachStatusIcon = () => {
    if (breachLoading) {
      return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
    }
    if (!breachResult?.isBreached) {
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    }
    return <AlertTriangle className="w-4 h-4 text-red-400" />;
  };

  const getBreachStatusColor = () => {
    if (breachLoading) return 'text-blue-400';
    if (!breachResult?.isBreached) return 'text-green-400';
    if (breachResult?.severity === 'high') return 'text-red-400';
    if (breachResult?.severity === 'medium') return 'text-orange-400';
    return 'text-yellow-400';
  };

  const getProgressBarWidth = (score: number) => {
    return `${Math.min(score, 100)}%`;
  };

  const getProgressBarColor = (score: number) => {
    if (score <= 40) return 'bg-red-500';
    if (score <= 60) return 'bg-orange-500';
    if (score <= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

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
              onChange={(e) => {
                setTestPassword(e.target.value);
                analyzePassword();
              }}
              placeholder="Enter a password to check strength, crack time and breach status"
              className="glass-input border-white/20 bg-white/5 text-white placeholder:text-gray-400"
            />
          </div>

          {(analysis || breachResult || breachLoading) && testPassword && (
            <div className="space-y-4">
              {/* Password Strength Score Card */}
              {analysis && (
                <div className="glass-option p-4 rounded-lg border border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-4 h-4 text-blue-400" />
                    <div className="text-sm text-gray-300">Password Strength Analysis</div>
                  </div>
                  
                  {/* Main Score Display */}
                  <div className="flex items-center justify-between mb-2">
                    <div className={`text-xl font-bold capitalize ${analysis.passwordScore.strengthColor}`}>
                      {analysis.passwordScore.strengthLevel}
                    </div>
                    <div className="text-lg font-mono text-white">
                      {analysis.passwordScore.totalScore}/100
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden mb-3">
                    <div 
                      className={`h-full transition-all duration-300 ${getProgressBarColor(analysis.passwordScore.totalScore)}`}
                      style={{ width: getProgressBarWidth(analysis.passwordScore.totalScore) }}
                    />
                  </div>
                  
                  {/* Feedback */}
                  <div className="text-sm text-gray-300 mb-3">
                    {analysis.passwordScore.feedback}
                  </div>
                  
                  {/* Scoring Breakdown */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">📏 Length</span>
                      <span className={`font-mono ${analysis.passwordScore.breakdown.length === 30 ? 'text-green-400' : analysis.passwordScore.breakdown.length > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {analysis.passwordScore.breakdown.length}/30
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">A Uppercase</span>
                      <span className={`font-mono ${analysis.passwordScore.breakdown.uppercase === 10 ? 'text-green-400' : 'text-red-400'}`}>
                        {analysis.passwordScore.breakdown.uppercase}/10
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">a Lowercase</span>
                      <span className={`font-mono ${analysis.passwordScore.breakdown.lowercase === 10 ? 'text-green-400' : 'text-red-400'}`}>
                        {analysis.passwordScore.breakdown.lowercase}/10
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">1 Numbers</span>
                      <span className={`font-mono ${analysis.passwordScore.breakdown.numbers === 10 ? 'text-green-400' : 'text-red-400'}`}>
                        {analysis.passwordScore.breakdown.numbers}/10
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">! Special</span>
                      <span className={`font-mono ${analysis.passwordScore.breakdown.specialChars === 15 ? 'text-green-400' : analysis.passwordScore.breakdown.specialChars > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {analysis.passwordScore.breakdown.specialChars}/15
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">🚫 No Dictionary</span>
                      <span className={`font-mono ${analysis.passwordScore.breakdown.noDictionary === 15 ? 'text-green-400' : 'text-red-400'}`}>
                        {analysis.passwordScore.breakdown.noDictionary}/15
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">🔄 No Repetition</span>
                      <span className={`font-mono ${analysis.passwordScore.breakdown.noRepetition === 10 ? 'text-green-400' : 'text-red-400'}`}>
                        {analysis.passwordScore.breakdown.noRepetition}/10
                      </span>
                    </div>
                  </div>
                  
                  {/* Suggestions */}
                  {analysis.passwordScore.suggestions.length > 0 && (
                    <div className="border-t border-gray-700 pt-2">
                      <div className="text-xs text-gray-400 mb-1">Suggestions for improvement:</div>
                      <ul className="text-xs text-gray-300 space-y-1">
                        {analysis.passwordScore.suggestions.slice(0, 3).map((suggestion: string, index: number) => (
                          <li key={index} className="flex items-start gap-1">
                            <span className="text-blue-400 mt-0.5">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Breach Status Card */}
              <div className="glass-option p-4 rounded-lg border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  {getBreachStatusIcon()}
                  <div className="text-sm text-gray-300">Breach Status</div>
                  {breachLoading && (
                    <span className="text-xs text-blue-400">Checking...</span>
                  )}
                </div>
                
                <div className={`text-lg font-semibold ${getBreachStatusColor()}`}>
                  {breachLoading 
                    ? 'Checking breach databases...' 
                    : breachResult?.isBreached 
                      ? 'Compromised' 
                      : 'Not Found in Breaches'
                  }
                </div>
                
                <div className="text-xs text-gray-400 mt-1">
                  {breachLoading 
                    ? 'Searching through breach databases...'
                    : breachResult?.message
                  }
                </div>
                
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                  {breachResult?.source === 'azure' && (
                    <>
                      <Database className="w-3 h-3" />
                      <span>Checked against {breachResult.passwordsChecked?.toLocaleString()} breached passwords</span>
                    </>
                  )}
                  {breachResult?.source === 'local' && (
                    <span>Checked against {breachResult.passwordsChecked?.toLocaleString()} common passwords (offline)</span>
                  )}
                  {breachLoading && (
                    <span>Checking 14M+ passwords from rockyou database...</span>
                  )}
                </div>
              </div>

              {analysis && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="glass-option p-4 rounded-lg border border-white/10">
                      <div className="text-sm text-gray-300 mb-1">Entropy</div>
                      <div className="text-xl font-semibold text-white">
                        {analysis.entropy.toFixed(1)} bits
                      </div>
                    </div>

                    <div className="glass-option p-4 rounded-lg border border-white/10">
                      <div className="text-sm text-gray-300 mb-1">Security Level</div>
                      <div className={`text-xl font-semibold ${getSecurityLevel(analysis.entropy).color}`}>
                        {getSecurityLevel(analysis.entropy).level}
                      </div>
                    </div>
                  </div>

                  <div className="glass-option p-4 rounded-lg border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-green-400" />
                      <div className="text-sm text-gray-300">Time to crack (average)</div>
                    </div>
                    <div className="text-2xl font-bold text-green-400">
                      {analysis.crackTime.humanReadable}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Assuming 1 billion guesses per second
                    </div>
                  </div>
                </>
              )}

              <div className="text-xs text-gray-400 text-center">
                Note: Actual crack time varies based on attack method, hardware, and password complexity
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default PasswordAnalyzer;
