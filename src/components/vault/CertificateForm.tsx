
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Upload, X, Eye, EyeOff, FileText } from 'lucide-react';
import { CertificateFormData, CertificateEntry, CertificateGroup } from '@/types/certificateVault';

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
  onCancel,
}) => {
  const [certificatePreview, setCertificatePreview] = useState<string>('');
  const [privateKeyPreview, setPrivateKeyPreview] = useState<string>('');
  const [showCertificateContent, setShowCertificateContent] = useState(false);
  const [showPrivateKeyContent, setShowPrivateKeyContent] = useState(false);

  const handleCertificateFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFormDataChange({ certificate_file: file });
      
      // Preview certificate content
      try {
        const content = await file.text();
        setCertificatePreview(content);
      } catch (error) {
        console.error('Error reading certificate file:', error);
      }
    }
  };

  const handlePrivateKeyFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFormDataChange({ private_key_file: file });
      
      // Preview private key content
      try {
        const content = await file.text();
        setPrivateKeyPreview(content);
      } catch (error) {
        console.error('Error reading private key file:', error);
      }
    }
  };

  const clearCertificateFile = () => {
    onFormDataChange({ certificate_file: undefined });
    setCertificatePreview('');
    const input = document.getElementById('certificate-file') as HTMLInputElement;
    if (input) input.value = '';
  };

  const clearPrivateKeyFile = () => {
    onFormDataChange({ private_key_file: undefined });
    setPrivateKeyPreview('');
    const input = document.getElementById('private-key-file') as HTMLInputElement;
    if (input) input.value = '';
  };

  return (
    <Card className="glass-card p-6 bg-white/5 backdrop-blur-xl border-white/20">
      <h3 className="text-xl font-semibold text-white mb-6">
        {editingEntry ? 'Edit Certificate' : 'Add New Certificate'}
      </h3>

      <div className="space-y-6">
        {/* Certificate Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-gray-300 font-medium">Certificate Title</Label>
          <p className="text-xs text-gray-400">A descriptive name to identify this certificate (e.g., "Main Website SSL", "API Gateway Cert")</p>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => onFormDataChange({ title: e.target.value })}
            className="glass-input bg-white/5 border-white/20 text-white"
            placeholder="Enter certificate title"
            required
          />
        </div>

        {/* Certificate File Upload */}
        <div className="space-y-2">
          <Label htmlFor="certificate-file" className="text-gray-300 font-medium">Certificate File (Required)</Label>
          <p className="text-xs text-gray-400">Upload your SSL/TLS certificate file (.crt, .pem, .cer formats supported)</p>
          <div className="flex items-center gap-2">
            <Input
              id="certificate-file"
              type="file"
              accept=".crt,.pem,.cer,.cert"
              onChange={handleCertificateFileChange}
              className="glass-input bg-white/5 border-white/20 text-white file:bg-blue-600 file:text-white file:border-none file:rounded"
              required={!editingEntry}
            />
            {formData.certificate_file && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearCertificateFile}
                className="text-red-400 hover:text-red-300"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Certificate Content Preview */}
        {certificatePreview && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-gray-300 font-medium">Certificate Content Preview</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCertificateContent(!showCertificateContent)}
                className="text-gray-400 hover:text-white"
              >
                {showCertificateContent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showCertificateContent ? ' Hide' : ' Show'}
              </Button>
            </div>
            {showCertificateContent && (
              <div className="bg-black/40 p-4 rounded-lg border border-white/10">
                <pre className="text-xs text-green-400 whitespace-pre-wrap overflow-x-auto max-h-40">
                  {certificatePreview}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Private Key File Upload */}
        <div className="space-y-2">
          <Label htmlFor="private-key-file" className="text-gray-300 font-medium">Private Key File (Optional)</Label>
          <p className="text-xs text-gray-400">Upload the corresponding private key file if available (.key, .pem formats supported)</p>
          <div className="flex items-center gap-2">
            <Input
              id="private-key-file"
              type="file"
              accept=".key,.pem"
              onChange={handlePrivateKeyFileChange}
              className="glass-input bg-white/5 border-white/20 text-white file:bg-purple-600 file:text-white file:border-none file:rounded"
            />
            {formData.private_key_file && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearPrivateKeyFile}
                className="text-red-400 hover:text-red-300"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Private Key Content Preview */}
        {privateKeyPreview && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-gray-300 font-medium">Private Key Content Preview</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPrivateKeyContent(!showPrivateKeyContent)}
                className="text-gray-400 hover:text-white"
              >
                {showPrivateKeyContent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showPrivateKeyContent ? ' Hide' : ' Show'}
              </Button>
            </div>
            {showPrivateKeyContent && (
              <div className="bg-black/40 p-4 rounded-lg border border-white/10">
                <pre className="text-xs text-purple-400 whitespace-pre-wrap overflow-x-auto max-h-40">
                  {privateKeyPreview}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Passphrase */}
        <div className="space-y-2">
          <Label htmlFor="passphrase" className="text-gray-300 font-medium">Passphrase (Optional)</Label>
          <p className="text-xs text-gray-400">Enter the passphrase if your private key is encrypted</p>
          <Input
            id="passphrase"
            type="password"
            value={formData.passphrase}
            onChange={(e) => onFormDataChange({ passphrase: e.target.value })}
            className="glass-input bg-white/5 border-white/20 text-white"
            placeholder="Enter passphrase (if required)"
          />
        </div>

        {/* Certificate Type */}
        <div className="space-y-2">
          <Label htmlFor="certificate-type" className="text-gray-300 font-medium">Certificate Type</Label>
          <p className="text-xs text-gray-400">Specify the type of certificate for better organization</p>
          <Select value={formData.certificate_type} onValueChange={(value) => onFormDataChange({ certificate_type: value })}>
            <SelectTrigger className="glass-input bg-white/5 border-white/20 text-white">
              <SelectValue placeholder="Select certificate type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ssl">SSL/TLS Certificate</SelectItem>
              <SelectItem value="code-signing">Code Signing Certificate</SelectItem>
              <SelectItem value="client">Client Certificate</SelectItem>
              <SelectItem value="ca">Certificate Authority (CA)</SelectItem>
              <SelectItem value="wildcard">Wildcard Certificate</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Environment */}
        <div className="space-y-2">
          <Label htmlFor="environment" className="text-gray-300 font-medium">Environment</Label>
          <p className="text-xs text-gray-400">Specify which environment this certificate is used in</p>
          <Select value={formData.environment} onValueChange={(value) => onFormDataChange({ environment: value })}>
            <SelectTrigger className="glass-input bg-white/5 border-white/20 text-white">
              <SelectValue placeholder="Select environment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="production">Production</SelectItem>
              <SelectItem value="staging">Staging</SelectItem>
              <SelectItem value="development">Development</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Group Selection */}
        <div className="space-y-2">
          <Label htmlFor="group" className="text-gray-300 font-medium">Group (Optional)</Label>
          <p className="text-xs text-gray-400">Organize certificates by grouping them into categories</p>
          <Select value={formData.group_id} onValueChange={(value) => onFormDataChange({ group_id: value })}>
            <SelectTrigger className="glass-input bg-white/5 border-white/20 text-white">
              <SelectValue placeholder="Select a group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No Group</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Expiration Days */}
        <div className="space-y-2">
          <Label htmlFor="expiration-days" className="text-gray-300 font-medium">Expiration Reminder (Optional)</Label>
          <p className="text-xs text-gray-400">Set when to be reminded about certificate expiration (days from now)</p>
          <Input
            id="expiration-days"
            type="number"
            min="1"
            max="3650"
            value={formData.expiration_days}
            onChange={(e) => onFormDataChange({ expiration_days: e.target.value })}
            className="glass-input bg-white/5 border-white/20 text-white"
            placeholder="e.g., 365 for one year"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            onClick={onSave}
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={!formData.title || (!formData.certificate_file && !editingEntry)}
          >
            {editingEntry ? 'Update Certificate' : 'Save Certificate'}
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

export default CertificateForm;
