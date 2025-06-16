
import React, { useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Upload, X } from 'lucide-react';
import { CertificateGroup, CertificateEntry, CertificateFormData } from '@/types/certificateVault';

interface CertificateFormProps {
  formData: CertificateFormData;
  groups: CertificateGroup[];
  editingEntry: CertificateEntry | null;
  onFormDataChange: (data: Partial<CertificateFormData>) => void;
  onSave: () => void;
  onCancel: () => void;
}

const CertificateForm: React.FC<CertificateFormProps> = ({
  formData,
  groups,
  editingEntry,
  onFormDataChange,
  onSave,
  onCancel
}) => {
  const certificateFileRef = useRef<HTMLInputElement>(null);
  const privateKeyFileRef = useRef<HTMLInputElement>(null);

  const handleCertificateFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFormDataChange({ certificate_file: file });
    }
  };

  const handlePrivateKeyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFormDataChange({ private_key_file: file });
    }
  };

  return (
    <Card className="glass-card p-6 bg-white/5 backdrop-blur-xl border-white/20">
      <h3 className="text-lg font-semibold text-white mb-4">
        {editingEntry ? 'Edit Certificate' : 'Add New Certificate'}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          placeholder="Certificate Title"
          value={formData.title}
          onChange={(e) => onFormDataChange({ title: e.target.value })}
          className="glass-input bg-white/5 border-white/20 text-white"
        />
        
        <Select
          value={formData.certificate_type}
          onValueChange={(value) => onFormDataChange({ certificate_type: value })}
        >
          <SelectTrigger className="glass-input bg-white/5 border-white/20 text-white">
            <SelectValue placeholder="Certificate Type" />
          </SelectTrigger>
          <SelectContent className="glass-card bg-gray-800 backdrop-blur-xl border-white/20">
            <SelectItem value="ssl" className="text-white hover:bg-white/10">SSL/TLS Certificate</SelectItem>
            <SelectItem value="code_signing" className="text-white hover:bg-white/10">Code Signing</SelectItem>
            <SelectItem value="client" className="text-white hover:bg-white/10">Client Certificate</SelectItem>
            <SelectItem value="ca" className="text-white hover:bg-white/10">Certificate Authority</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={formData.environment}
          onValueChange={(value) => onFormDataChange({ environment: value })}
        >
          <SelectTrigger className="glass-input bg-white/5 border-white/20 text-white">
            <SelectValue placeholder="Environment" />
          </SelectTrigger>
          <SelectContent className="glass-card bg-gray-800 backdrop-blur-xl border-white/20">
            <SelectItem value="production" className="text-white hover:bg-white/10">Production</SelectItem>
            <SelectItem value="staging" className="text-white hover:bg-white/10">Staging</SelectItem>
            <SelectItem value="development" className="text-white hover:bg-white/10">Development</SelectItem>
            <SelectItem value="testing" className="text-white hover:bg-white/10">Testing</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={formData.group_id || '--NONE--'}
          onValueChange={(value) => onFormDataChange({ group_id: value === '--NONE--' ? '' : value })}
        >
          <SelectTrigger className="glass-input bg-white/5 border-white/20 text-white">
            <SelectValue placeholder="Select group (optional)" />
          </SelectTrigger>
          <SelectContent className="glass-card bg-gray-800 backdrop-blur-xl border-white/20">
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

        <Input
          placeholder="Passphrase (optional)"
          type="password"
          value={formData.passphrase}
          onChange={(e) => onFormDataChange({ passphrase: e.target.value })}
          className="glass-input bg-white/5 border-white/20 text-white"
        />
      </div>

      {/* File Upload Section */}
      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Certificate File *
          </label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => certificateFileRef.current?.click()}
              variant="outline"
              className="border-white/20 text-gray-300 hover:bg-gray-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              {formData.certificate_file ? 'Change File' : 'Upload Certificate'}
            </Button>
            {formData.certificate_file && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-green-400">{formData.certificate_file.name}</span>
                <Button
                  type="button"
                  onClick={() => onFormDataChange({ certificate_file: undefined })}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
          <input
            ref={certificateFileRef}
            type="file"
            accept=".pem,.crt,.cer,.cert,.p7b,.p7c,.pfx,.p12"
            onChange={handleCertificateFileChange}
            className="hidden"
          />
          <p className="text-xs text-gray-500 mt-1">
            Supported formats: .pem, .crt, .cer, .cert, .p7b, .p7c, .pfx, .p12
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Private Key File (optional)
          </label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => privateKeyFileRef.current?.click()}
              variant="outline"
              className="border-white/20 text-gray-300 hover:bg-gray-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              {formData.private_key_file ? 'Change Key' : 'Upload Private Key'}
            </Button>
            {formData.private_key_file && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-green-400">{formData.private_key_file.name}</span>
                <Button
                  type="button"
                  onClick={() => onFormDataChange({ private_key_file: undefined })}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
          <input
            ref={privateKeyFileRef}
            type="file"
            accept=".key,.pem"
            onChange={handlePrivateKeyFileChange}
            className="hidden"
          />
          <p className="text-xs text-gray-500 mt-1">
            Supported formats: .key, .pem
          </p>
        </div>
      </div>

      <div className="flex gap-2 mt-6">
        <Button
          onClick={onCancel}
          variant="outline"
          className="border-white/20 text-gray-300 hover:bg-gray-700 hover:text-white"
        >
          Cancel
        </Button>
        <Button
          onClick={onSave}
          disabled={!formData.title || !formData.certificate_file}
          className="glass-button bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2" />
          {editingEntry ? 'Update' : 'Save'}
        </Button>
      </div>
    </Card>
  );
};

export default CertificateForm;
