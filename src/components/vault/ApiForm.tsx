
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ApiFormData, ApiGroup } from '@/types/apiVault';
import ApiFormFields from './ApiFormFields';

interface ApiFormProps {
  isOpen: boolean;
  onClose: () => void;
  formData: ApiFormData;
  setFormData: (data: ApiFormData) => void;
  onSave: () => void;
  groups: ApiGroup[];
  isEditing: boolean;
}

const ApiForm: React.FC<ApiFormProps> = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSave,
  groups,
  isEditing,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card bg-white/5 backdrop-blur-xl border-white/20 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isEditing ? 'Edit API Entry' : 'Add New API Entry'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ApiFormFields
            formData={formData}
            setFormData={setFormData}
            groups={groups}
          />

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="border-green-500/30 text-green-400 hover:bg-green-500/10 hover:border-green-400"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={!formData.title || !formData.api_key}
            >
              {isEditing ? 'Update' : 'Save'} API Entry
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ApiForm;
