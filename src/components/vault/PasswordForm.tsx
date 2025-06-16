
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Eye, EyeOff, Shuffle } from 'lucide-react';
import { FormData, PasswordEntry } from '@/types/vault';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import { useState } from 'react';

interface PasswordFormProps {
  formData: FormData;
  groups: any[];
  editingEntry: PasswordEntry | null;
  onFormDataChange: (data: Partial<FormData>) => void;
  onSave: () => void;
  onCancel: () => void;
  onGeneratePassword: () => void;
  showForm: boolean;
}

const PasswordForm: React.FC<PasswordFormProps> = ({
  formData,
  groups,
  editingEntry,
  onFormDataChange,
  onSave,
  onCancel,
  onGeneratePassword,
  showForm,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  // Helper function to ensure group ID is never empty for SelectItem
  const getSafeGroupId = (group: any) => {
    if (!group.id || typeof group.id !== 'string' || group.id.trim() === '') {
      console.warn(`Invalid group ID detected for group: ${group.name}`, group);
      return `fallback-${Date.now()}-${Math.random()}`;
    }
    return group.id;
  };

  // Filter out groups with invalid IDs
  const validGroups = groups.filter(group => {
    const hasValidId = group.id && 
                      typeof group.id === 'string' && 
                      group.id.trim().length > 0 && 
                      group.id !== 'null' && 
                      group.id !== 'undefined' &&
                      group.id !== 'NaN';
    return hasValidId && group.name && group.name.trim() !== '';
  });

  // Ensure we always have a valid, non-empty value for the Select
  const getSelectValue = () => {
    const groupId = formData.group_id;
    // Return 'NO_GROUP' if group_id is empty, null, undefined, or just whitespace
    if (!groupId || typeof groupId !== 'string' || groupId.trim() === '') {
      return 'NO_GROUP';
    }
    // Return 'NO_GROUP' if the group_id doesn't exist in our valid groups list
    const groupExists = validGroups.some(group => group.id === groupId);
    return groupExists ? groupId : 'NO_GROUP';
  };

  if (!showForm) return null;

  return (
    <Card className="glass-card p-6 bg-white/5 backdrop-blur-xl border-white/20">
      <h3 className="text-xl font-semibold text-white mb-6">
        {editingEntry ? 'Edit Password Entry' : 'Add New Password'}
      </h3>

      <div className="space-y-6">
        {/* Title/Site Name */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-gray-300 font-medium">Title / Site Name</Label>
          <p className="text-xs text-gray-400">A descriptive name to identify this password entry (e.g., "Gmail Account", "Company Portal", "Banking App")</p>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => onFormDataChange({ title: e.target.value })}
            className="glass-input bg-white/5 border-white/20 text-white"
            placeholder="Enter a descriptive title"
            required
          />
        </div>

        {/* Username/Email */}
        <div className="space-y-2">
          <Label htmlFor="username" className="text-gray-300 font-medium">Username / Email</Label>
          <p className="text-xs text-gray-400">The username, email address, or login identifier for this account</p>
          <Input
            id="username"
            value={formData.username}
            onChange={(e) => onFormDataChange({ username: e.target.value })}
            className="glass-input bg-white/5 border-white/20 text-white"
            placeholder="Enter username or email"
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-300 font-medium">Password</Label>
          <p className="text-xs text-gray-400">The password for this account. Use the generator button for a strong, random password</p>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => onFormDataChange({ password: e.target.value })}
              className="glass-input bg-white/5 border-white/20 text-white pr-20"
              placeholder="Enter password"
              required
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-white p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onGeneratePassword}
                className="text-gray-400 hover:text-white p-1"
                title="Generate strong password"
              >
                <Shuffle className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {formData.password && (
            <PasswordStrengthIndicator password={formData.password} />
          )}
        </div>

        {/* Website URL */}
        <div className="space-y-2">
          <Label htmlFor="website" className="text-gray-300 font-medium">Website URL (Optional)</Label>
          <p className="text-xs text-gray-400">The website or application URL where this password is used (helps with identification and auto-fill)</p>
          <Input
            id="website"
            type="url"
            value={formData.website}
            onChange={(e) => onFormDataChange({ website: e.target.value })}
            className="glass-input bg-white/5 border-white/20 text-white"
            placeholder="https://example.com"
          />
        </div>

        {/* Group Selection */}
        <div className="space-y-2">
          <Label htmlFor="group" className="text-gray-300 font-medium">Group (Optional)</Label>
          <p className="text-xs text-gray-400">Organize passwords by grouping them into categories (e.g., "Work", "Personal", "Banking")</p>
          <Select 
            value={getSelectValue()} 
            onValueChange={(value) => onFormDataChange({ 
              group_id: value === 'NO_GROUP' ? '' : value 
            })}
          >
            <SelectTrigger className="glass-input bg-white/5 border-white/20 text-white">
              <SelectValue placeholder="Select a group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NO_GROUP">No Group</SelectItem>
              {validGroups.map((group) => {
                const safeId = getSafeGroupId(group);
                return (
                  <SelectItem key={safeId} value={safeId}>
                    {group.name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Expiration Days */}
        <div className="space-y-2">
          <Label htmlFor="expiration-days" className="text-gray-300 font-medium">Password Expiration (Optional)</Label>
          <p className="text-xs text-gray-400">Set when this password should be changed (days from now). Leave empty for no expiration reminder</p>
          <Input
            id="expiration-days"
            type="number"
            min="1"
            max="3650"
            value={formData.expiration_days}
            onChange={(e) => onFormDataChange({ expiration_days: e.target.value })}
            className="glass-input bg-white/5 border-white/20 text-white"
            placeholder="e.g., 90 for quarterly change"
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-gray-300 font-medium">Notes (Optional)</Label>
          <p className="text-xs text-gray-400">Additional information about this password or account (security questions, special instructions, etc.)</p>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => onFormDataChange({ notes: e.target.value })}
            className="glass-input bg-white/5 border-white/20 text-white min-h-20"
            placeholder="Enter any additional notes or information"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            onClick={onSave}
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={!formData.title || !formData.password}
          >
            {editingEntry ? 'Update Password' : 'Save Password'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="bg-transparent border-gray-400 text-gray-300 hover:bg-gray-700"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default PasswordForm;
