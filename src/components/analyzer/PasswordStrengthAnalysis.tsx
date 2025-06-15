
import React from 'react';
import { BarChart3 } from 'lucide-react';

interface PasswordStrengthAnalysisProps {
  passwordScore: any;
}

const PasswordStrengthAnalysis: React.FC<PasswordStrengthAnalysisProps> = ({ passwordScore }) => {
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
    <div className="glass-option p-4 rounded-lg border border-white/10">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-blue-400" />
        <div className="text-sm text-gray-300">Password Strength Analysis</div>
      </div>
      
      <div className="flex items-center justify-between mb-2">
        <div className={`text-xl font-bold capitalize ${passwordScore.strengthColor}`}>
          {passwordScore.strengthLevel}
        </div>
        <div className="text-lg font-mono text-white">
          {passwordScore.totalScore}/100
        </div>
      </div>
      
      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden mb-3">
        <div 
          className={`h-full transition-all duration-300 ${getProgressBarColor(passwordScore.totalScore)}`}
          style={{ width: getProgressBarWidth(passwordScore.totalScore) }}
        />
      </div>
      
      <div className="text-sm text-gray-300 mb-3">
        {passwordScore.feedback}
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">📏 Length</span>
          <span className={`font-mono ${passwordScore.breakdown.length === 30 ? 'text-green-400' : passwordScore.breakdown.length > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
            {passwordScore.breakdown.length}/30
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">A Uppercase</span>
          <span className={`font-mono ${passwordScore.breakdown.uppercase === 10 ? 'text-green-400' : 'text-red-400'}`}>
            {passwordScore.breakdown.uppercase}/10
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">a Lowercase</span>
          <span className={`font-mono ${passwordScore.breakdown.lowercase === 10 ? 'text-green-400' : 'text-red-400'}`}>
            {passwordScore.breakdown.lowercase}/10
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">1 Numbers</span>
          <span className={`font-mono ${passwordScore.breakdown.numbers === 10 ? 'text-green-400' : 'text-red-400'}`}>
            {passwordScore.breakdown.numbers}/10
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">! Special</span>
          <span className={`font-mono ${passwordScore.breakdown.specialChars === 15 ? 'text-green-400' : passwordScore.breakdown.specialChars > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
            {passwordScore.breakdown.specialChars}/15
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">🚫 No Dictionary</span>
          <span className={`font-mono ${passwordScore.breakdown.noDictionary === 15 ? 'text-green-400' : 'text-red-400'}`}>
            {passwordScore.breakdown.noDictionary}/15
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">🔄 No Repetition</span>
          <span className={`font-mono ${passwordScore.breakdown.noRepetition === 10 ? 'text-green-400' : 'text-red-400'}`}>
            {passwordScore.breakdown.noRepetition}/10
          </span>
        </div>
      </div>
      
      {passwordScore.suggestions.length > 0 && (
        <div className="border-t border-gray-700 pt-2">
          <div className="text-xs text-gray-400 mb-1">Suggestions for improvement:</div>
          <ul className="text-xs text-gray-300 space-y-1">
            {passwordScore.suggestions.slice(0, 3).map((suggestion: string, index: number) => (
              <li key={index} className="flex items-start gap-1">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthAnalysis;
