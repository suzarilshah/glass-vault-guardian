
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, RefreshCw, BarChart3 } from 'lucide-react';
import { PasswordGroup, PasswordEntry, FormData } from '@/types/vault';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import AdvancedPasswordStrengthIndicator from './AdvancedPasswordStrengthIndicator';

interface PasswordFormProps {
  formData: FormData;
  groups: PasswordGroup[];
  editingEntry: PasswordEntry | null;
  onFormDataChange: (data: Partial<FormData>) => void;
  onGeneratePassword: () => void;
  onSave: () => void;
  onCancel: () => void;
}

const PasswordForm: React.FC<PasswordFormProps> = ({
  formData,
  groups,
  editingEntry,
  onFormDataChange,
  onGeneratePassword,
  onSave,
  onCancel
}) => {
  const [showAdvancedScoring, setShowAdvancedScoring] = useState(false);

  // Filter out any groups with empty or invalid IDs
  const validGroups = groups.filter(group => group.id && group.id.trim() !== '');

  // Get the current select value, ensuring it's never an empty string
  const getSelectValue = () => {
    const groupId = formData.group_id;
    if (!groupId || groupId.trim() === '') {
      return 'UNGROUPED';
    }
    return groupId;
  };

  // Handle select value changes
  const handleGroupChange = (value: string) => {
    const newGroupId = value === 'UNGROUPED' ? '' : value;
    onFormDataChange({ group_id: newGroupId });
  };

  return (
    <Card className="glass-card p-6 bg-white/5 backdrop-blur-xl border-white/20">
      <h3 className="text-lg font-semibold text-white mb-4">
        {editingEntry ? 'Edit Password' : 'Add New Password'}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Title *
          </label>
          <p className="text-xs text-gray-400 mb-2">A descriptive name for this password entry (e.g., "Gmail Account", "Work Email")</p>
          <Input
            placeholder="Enter a title for this password"
            value={formData.title}
            onChange={(e) => onFormDataChange({ title: e.target.value })}
            className="glass-input bg-white/5 border-white/20 text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Username/Email
          </label>
          <p className="text-xs text-gray-400 mb-2">The username or email address associated with this account</p>
          <Input
            placeholder="Enter username or email address"
            value={formData.username}
            onChange={(e) => onFormDataChange({ username: e.target.value })}
            className="glass-input bg-white/5 border-white/20 text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Password *
          </label>
          <p className="text-xs text-gray-400 mb-2">The password for this account. Use the generate button for a strong password</p>
          <div className="relative flex">
            <Input
              placeholder="Enter or generate a password"
              type="text"
              value={formData.password}
              onChange={(e) => onFormDataChange({ password: e.target.value })}
              className="glass-input bg-white/5 border-white/20 text-white pr-10"
              autoComplete="off"
            />
            <Button
              type="button"
              onClick={onGeneratePassword}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6 text-blue-400 hover:text-blue-300 bg-blue-100 border border-blue-300"
              variant="ghost"
              size="sm"
              tabIndex={-1}
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Website
          </label>
          <p className="text-xs text-gray-400 mb-2">The website URL where this password is used (e.g., https://gmail.com)</p>
          <Input
            placeholder="Enter website URL"
            value={formData.website}
            onChange={(e) => onFormDataChange({ website: e.target.value })}
            className="glass-input bg-white/5 border-white/20 text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Group
          </label>
          <p className="text-xs text-gray-400 mb-2">Organize this password into a group for better management</p>
          <Select
            value={getSelectValue()}
            onValueChange={handleGroupChange}
          >
            <SelectTrigger className="glass-input bg-white/5 border-white/20 text-white">
              <SelectValue placeholder="Select group (optional)" />
            </SelectTrigger>
            <SelectContent className="glass-card bg-gray-800 backdrop-blur-xl border-white/20 z-50">
              <SelectItem value="UNGROUPED" className="text-white hover:bg-white/10">
                Ungrouped
              </SelectItem>
              {validGroups.map((group) => (
                <SelectItem key={group.id} value={group.id} className="text-white hover:bg-white/10">
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Expiration (days)
          </label>
          <p className="text-xs text-gray-400 mb-2">Number of days until this password expires (leave empty for no expiration)</p>
          <Input
            placeholder="e.g., 90"
            type="number"
            value={formData.expiration_days}
            onChange={(e) => onFormDataChange({ expiration_days: e.target.value })}
            className="glass-input bg-white/5 border-white/20 text-white"
            min="1"
          />
        </div>
      </div>
      
      {/* Password strength indicators */}
      {formData.password && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvancedScoring(!showAdvancedScoring)}
              className="text-blue-400 hover:text-blue-300 p-1 h-auto"
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              {showAdvancedScoring ? 'Hide' : 'Show'} Detailed Analysis
            </Button>
          </div>
          
          {showAdvancedScoring ? (
            <AdvancedPasswordStrengthIndicator password={formData.password} showDetailed={true} />
          ) : (
            <PasswordStrengthIndicator password={formData.password} />
          )}
        </div>
      )}
      
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Notes
        </label>
        <p className="text-xs text-gray-400 mb-2">Additional information about this password or account</p>
        <Textarea
          placeholder="Add any additional notes or information"
          value={formData.notes}
          onChange={(e) => onFormDataChange({ notes: e.target.value })}
          className="glass-input bg-white/5 border-white/20 text-white"
        />
      </div>
      
      <div className="flex gap-2 mt-4">
        <Button
          onClick={onCancel}
          variant="outline"
          className="border-white/20 text-gray-300 hover:bg-gray-700 hover:text-white"
        >
          Cancel
        </Button>
        <Button
          onClick={onSave}
          className="glass-button bg-green-600 hover:bg-green-700 text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          {editingEntry ? 'Update' : 'Save'}
        </Button>
      </div>
    </Card>
  );
};

export default PasswordForm;
