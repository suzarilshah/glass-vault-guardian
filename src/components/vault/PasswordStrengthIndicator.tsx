
import React from 'react';
import { AlertTriangle, Loader2, Database } from 'lucide-react';
import { calculatePasswordScore } from '@/utils/passwordScoring';
import { useDebouncedBreachCheck } from '@/hooks/useDebouncedBreachCheck';

interface PasswordStrengthIndicatorProps {
  password: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  const { result: breachResult, isLoading: breachLoading } = useDebouncedBreachCheck(password, 500);

  if (!password) return null;

  const scoreData = calculatePasswordScore(password);
  const { totalScore, strengthLevel, strengthColor, feedback, suggestions } = scoreData;

  const isWeak = totalScore <= 60;
  const isBreached = breachResult?.isBreached;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-300">Password Strength:</span>
        <span className={`text-sm font-medium capitalize ${strengthColor}`}>
          {strengthLevel} ({totalScore}/100)
        </span>
      </div>
      
      {/* Breach Status */}
      <div className="flex items-center gap-2 text-xs">
        {breachLoading && (
          <>
            <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
            <span className="text-blue-400">Checking breach databases...</span>
          </>
        )}
        {!breachLoading && breachResult && (
          <>
            {breachResult.source === 'azure' && (
              <Database className="w-3 h-3 text-green-400" />
            )}
            <span className={`${isBreached ? 'text-red-400' : 'text-green-400'}`}>
              {isBreached ? 'Found in breach databases' : 'Not found in breaches'}
              {breachResult.source === 'azure' && ` (${breachResult.passwordsChecked?.toLocaleString()} checked)`}
            </span>
          </>
        )}
      </div>
      
      {(isWeak || isBreached) && (
        <div className={`${isBreached ? 'bg-red-900/20 border-red-500/50' : 'bg-orange-900/20 border-orange-500/50'} border rounded p-2`}>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className={`w-4 h-4 ${isBreached ? 'text-red-400' : 'text-orange-400'}`} />
            <span className={`text-sm font-medium ${isBreached ? 'text-red-400' : 'text-orange-400'}`}>
              {isBreached ? 'Compromised Password' : 'Weak Password Detected'}
            </span>
          </div>
          <p className={`text-xs ${isBreached ? 'text-red-300' : 'text-orange-300'} mb-2`}>
            {isBreached ? breachResult?.message : feedback}
          </p>
          {suggestions.length > 0 && !isBreached && (
            <ul className="text-xs text-orange-300 space-y-1">
              {suggestions.slice(0, 3).map((suggestion, index) => (
                <li key={index}>• {suggestion}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
