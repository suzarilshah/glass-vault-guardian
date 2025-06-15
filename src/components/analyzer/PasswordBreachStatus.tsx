
import React from 'react';
import { AlertTriangle, CheckCircle, Loader2, Database } from 'lucide-react';

interface PasswordBreachStatusProps {
  breachResult: any;
  breachLoading: boolean;
}

const PasswordBreachStatus: React.FC<PasswordBreachStatusProps> = ({
  breachResult,
  breachLoading
}) => {
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

  return (
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
  );
};

export default PasswordBreachStatus;
