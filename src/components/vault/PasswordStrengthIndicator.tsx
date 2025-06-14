
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { calculatePasswordScore } from '@/utils/passwordScoring';

interface PasswordStrengthIndicatorProps {
  password: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  if (!password) return null;

  const scoreData = calculatePasswordScore(password);
  const { totalScore, strengthLevel, strengthColor, feedback, suggestions } = scoreData;

  const isWeak = totalScore <= 60;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-300">Password Strength:</span>
        <span className={`text-sm font-medium capitalize ${strengthColor}`}>
          {strengthLevel} ({totalScore}/100)
        </span>
      </div>
      
      {isWeak && (
        <div className="bg-red-900/20 border border-red-500/50 rounded p-2">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">Weak Password Detected</span>
          </div>
          <p className="text-xs text-red-300 mb-2">{feedback}</p>
          {suggestions.length > 0 && (
            <ul className="text-xs text-red-300 space-y-1">
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
