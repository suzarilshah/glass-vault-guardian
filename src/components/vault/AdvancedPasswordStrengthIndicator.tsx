
import React from 'react';
import { AlertTriangle, CheckCircle2, Info, Shield } from 'lucide-react';
import { calculatePasswordScore } from '@/utils/passwordScoring';

interface AdvancedPasswordStrengthIndicatorProps {
  password: string;
  showDetailed?: boolean;
}

const AdvancedPasswordStrengthIndicator: React.FC<AdvancedPasswordStrengthIndicatorProps> = ({ 
  password, 
  showDetailed = false 
}) => {
  if (!password) return null;

  const scoreData = calculatePasswordScore(password);
  const { totalScore, breakdown, strengthLevel, strengthColor, feedback, suggestions } = scoreData;

  const getProgressBarWidth = (score: number) => {
    return `${Math.min(score, 100)}%`;
  };

  const getProgressBarColor = () => {
    if (totalScore <= 40) return 'bg-red-500';
    if (totalScore <= 60) return 'bg-orange-500';
    if (totalScore <= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const criteriaItems = [
    { label: 'Length', score: breakdown.length, maxScore: 30, icon: '📏' },
    { label: 'Uppercase', score: breakdown.uppercase, maxScore: 10, icon: 'A' },
    { label: 'Lowercase', score: breakdown.lowercase, maxScore: 10, icon: 'a' },
    { label: 'Numbers', score: breakdown.numbers, maxScore: 10, icon: '1' },
    { label: 'Special Chars', score: breakdown.specialChars, maxScore: 15, icon: '!' },
    { label: 'No Dictionary', score: breakdown.noDictionary, maxScore: 15, icon: '🚫' },
    { label: 'No Repetition', score: breakdown.noRepetition, maxScore: 10, icon: '🔄' }
  ];

  return (
    <div className="mt-3 space-y-3">
      {/* Main Strength Indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">Password Strength</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold capitalize ${strengthColor}`}>
              {strengthLevel}
            </span>
            <span className="text-xs text-gray-400">
              ({totalScore}/100)
            </span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${getProgressBarColor()}`}
            style={{ width: getProgressBarWidth(totalScore) }}
          />
        </div>
        
        {/* Feedback */}
        <div className="flex items-start gap-2">
          {totalScore <= 60 ? (
            <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
          )}
          <p className="text-xs text-gray-300">{feedback}</p>
        </div>
      </div>

      {/* Detailed Breakdown */}
      {showDetailed && (
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-white">Scoring Breakdown</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-3">
            {criteriaItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-xs">{item.icon}</span>
                  <span className="text-gray-300">{item.label}</span>
                </div>
                <span className={`font-mono ${item.score === item.maxScore ? 'text-green-400' : item.score > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {item.score}/{item.maxScore}
                </span>
              </div>
            ))}
          </div>
          
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="border-t border-gray-700 pt-2">
              <p className="text-xs text-gray-400 mb-1">Suggestions for improvement:</p>
              <ul className="text-xs text-gray-300 space-y-1">
                {suggestions.map((suggestion, index) => (
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
    </div>
  );
};

export default AdvancedPasswordStrengthIndicator;
