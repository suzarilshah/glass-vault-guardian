
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

interface PasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSpecialChars: boolean;
}

interface PasswordCustomizationProps {
  options: PasswordOptions;
  onOptionsChange: (options: PasswordOptions) => void;
}

const PasswordCustomization: React.FC<PasswordCustomizationProps> = ({
  options,
  onOptionsChange
}) => {
  const updateOption = (key: keyof PasswordOptions, value: any) => {
    onOptionsChange({ ...options, [key]: value });
  };

  return (
    <Card className="glass-card p-6 border-0 bg-white/5 backdrop-blur-xl">
      <h3 className="text-lg font-semibold text-white mb-4">Customization Options</h3>
      
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">Password Length</label>
            <span className="text-sm text-green-400 font-mono">{options.length} characters</span>
          </div>
          <Slider
            value={[options.length]}
            onValueChange={(value) => updateOption('length', value[0])}
            max={64}
            min={4}
            step={1}
            className="slider-custom"
          />
          {options.length < 10 && (
            <div className="flex items-center gap-2 mt-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400 font-medium">
                Warning: Secure passwords require 10 or more characters
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between glass-option p-3 rounded-lg border border-white/10">
            <label className="text-sm text-gray-300">Uppercase (A-Z)</label>
            <Switch
              checked={options.includeUppercase}
              onCheckedChange={(checked) => updateOption('includeUppercase', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between glass-option p-3 rounded-lg border border-white/10">
            <label className="text-sm text-gray-300">Lowercase (a-z)</label>
            <Switch
              checked={options.includeLowercase}
              onCheckedChange={(checked) => updateOption('includeLowercase', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between glass-option p-3 rounded-lg border border-white/10">
            <label className="text-sm text-gray-300">Numbers (0-9)</label>
            <Switch
              checked={options.includeNumbers}
              onCheckedChange={(checked) => updateOption('includeNumbers', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between glass-option p-3 rounded-lg border border-white/10">
            <label className="text-sm text-gray-300">Special Characters</label>
            <Switch
              checked={options.includeSpecialChars}
              onCheckedChange={(checked) => updateOption('includeSpecialChars', checked)}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PasswordCustomization;
