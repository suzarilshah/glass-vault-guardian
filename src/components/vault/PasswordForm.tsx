
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, RefreshCw } from 'lucide-react';
import { PasswordGroup, PasswordEntry, FormData } from '@/types/vault';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';

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
  return (
    <Card className="glass-card p-6 bg-white/5 backdrop-blur-xl border-white/20">
      <h3 className="text-lg font-semibold text-white mb-4">
        {editingEntry ? 'Edit Password' : 'Add New Password'}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          placeholder="Title"
          value={formData.title}
          onChange={(e) => onFormDataChange({ title: e.target.value })}
          className="glass-input bg-white/5 border-white/20 text-white"
        />
        <Input
          placeholder="Username/Email"
          value={formData.username}
          onChange={(e) => onFormDataChange({ username: e.target.value })}
          className="glass-input bg-white/5 border-white/20 text-white"
        />
        <div className="md:col-span-2">
          <div className="relative flex">
            <Input
              placeholder="Password"
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
          {formData.password && (
            <div className="mt-3">
              <PasswordStrengthIndicator 
                password={formData.password} 
                showWarning={true}
              />
            </div>
          )}
        </div>
        <Input
          placeholder="Website"
          value={formData.website}
          onChange={(e) => onFormDataChange({ website: e.target.value })}
          className="glass-input bg-white/5 border-white/20 text-white"
        />
        <Select
          value={formData.group_id || '--NONE--'}
          onValueChange={(value) => onFormDataChange({ group_id: value === '--NONE--' ? '' : value })}
        >
          <SelectTrigger className="glass-input bg-white/5 border-white/20 text-white">
            <SelectValue placeholder="Select group (optional)" />
          </SelectTrigger>
          <SelectContent className="glass-card bg-gray-800 backdrop-blur-xl border-white/20 z-50">
            <SelectItem value="--NONE--" className="text-white hover:bg-white/10">
              Ungrouped
            </SelectItem>
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id} className="text-white hover:bg-white/10">
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Expiration (days)"
          type="number"
          value={formData.expiration_days}
          onChange={(e) => onFormDataChange({ expiration_days: e.target.value })}
          className="glass-input bg-white/5 border-white/20 text-white"
          min="1"
        />
      </div>
      <Textarea
        placeholder="Notes"
        value={formData.notes}
        onChange={(e) => onFormDataChange({ notes: e.target.value })}
        className="glass-input bg-white/5 border-white/20 text-white mt-4"
      />
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
