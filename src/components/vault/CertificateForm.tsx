
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save } from 'lucide-react';
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
  return (
    <Card className="glass-card p-6 bg-white/5 backdrop-blur-xl border-white/20">
      <h3 className="text-lg font-semibold text-white mb-4">
        {editingEntry ? 'Edit Certificate' : 'Add New Certificate'}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Title *
          </label>
          <p className="text-xs text-gray-400 mb-2">A descriptive name for this certificate (e.g., "Main Website SSL", "API Server Cert")</p>
          <Input
            placeholder="Enter certificate title"
            value={formData.title}
            onChange={(e) => onFormDataChange({ title: e.target.value })}
            className="glass-input bg-white/5 border-white/20 text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Certificate Type
          </label>
          <p className="text-xs text-gray-400 mb-2">The type of certificate (SSL/TLS, Code Signing, Client, etc.)</p>
          <Select
            value={formData.certificate_type}
            onValueChange={(value) => onFormDataChange({ certificate_type: value })}
          >
            <SelectTrigger className="glass-input bg-white/5 border-white/20 text-white">
              <SelectValue placeholder="Select certificate type" />
            </SelectTrigger>
            <SelectContent className="glass-card bg-gray-800 backdrop-blur-xl border-white/20 z-50">
              <SelectItem value="ssl" className="text-white hover:bg-white/10">SSL/TLS</SelectItem>
              <SelectItem value="code_signing" className="text-white hover:bg-white/10">Code Signing</SelectItem>
              <SelectItem value="client" className="text-white hover:bg-white/10">Client Certificate</SelectItem>
              <SelectItem value="root_ca" className="text-white hover:bg-white/10">Root CA</SelectItem>
              <SelectItem value="intermediate_ca" className="text-white hover:bg-white/10">Intermediate CA</SelectItem>
              <SelectItem value="other" className="text-white hover:bg-white/10">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Common Name (CN)
          </label>
          <p className="text-xs text-gray-400 mb-2">The domain name or entity name this certificate is issued for (e.g., "example.com", "*.example.com")</p>
          <Input
            placeholder="Enter common name"
            value={formData.common_name}
            onChange={(e) => onFormDataChange({ common_name: e.target.value })}
            className="glass-input bg-white/5 border-white/20 text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Issuer
          </label>
          <p className="text-xs text-gray-400 mb-2">The Certificate Authority that issued this certificate (e.g., "Let's Encrypt", "DigiCert")</p>
          <Input
            placeholder="Enter certificate issuer"
            value={formData.issuer}
            onChange={(e) => onFormDataChange({ issuer: e.target.value })}
            className="glass-input bg-white/5 border-white/20 text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Environment
          </label>
          <p className="text-xs text-gray-400 mb-2">The environment where this certificate is used</p>
          <Select
            value={formData.environment}
            onValueChange={(value) => onFormDataChange({ environment: value })}
          >
            <SelectTrigger className="glass-input bg-white/5 border-white/20 text-white">
              <SelectValue placeholder="Select environment" />
            </SelectTrigger>
            <SelectContent className="glass-card bg-gray-800 backdrop-blur-xl border-white/20 z-50">
              <SelectItem value="production" className="text-white hover:bg-white/10">Production</SelectItem>
              <SelectItem value="staging" className="text-white hover:bg-white/10">Staging</SelectItem>
              <SelectItem value="development" className="text-white hover:bg-white/10">Development</SelectItem>
              <SelectItem value="testing" className="text-white hover:bg-white/10">Testing</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Group
          </label>
          <p className="text-xs text-gray-400 mb-2">Organize this certificate into a group for better management</p>
          <Select
            value={formData.group_id || 'UNGROUPED'}
            onValueChange={(value) => onFormDataChange({ group_id: value === 'UNGROUPED' ? '' : value })}
          >
            <SelectTrigger className="glass-input bg-white/5 border-white/20 text-white">
              <SelectValue placeholder="Select group (optional)" />
            </SelectTrigger>
            <SelectContent className="glass-card bg-gray-800 backdrop-blur-xl border-white/20 z-50">
              <SelectItem value="UNGROUPED" className="text-white hover:bg-white/10">
                Ungrouped
              </SelectItem>
              {groups.map((group) => (
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
          <p className="text-xs text-gray-400 mb-2">Number of days until this certificate expires (leave empty for no tracking)</p>
          <Input
            placeholder="e.g., 365"
            type="number"
            value={formData.expiration_days}
            onChange={(e) => onFormDataChange({ expiration_days: e.target.value })}
            className="glass-input bg-white/5 border-white/20 text-white"
            min="1"
          />
        </div>
      </div>
      
      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Certificate File *
          </label>
          <p className="text-xs text-gray-400 mb-2">The public certificate in PEM format (begins with -----BEGIN CERTIFICATE-----)</p>
          <Textarea
            placeholder="Paste the certificate file content here"
            value={formData.certificate_file}
            onChange={(e) => onFormDataChange({ certificate_file: e.target.value })}
            className="glass-input bg-white/5 border-white/20 text-white font-mono text-sm"
            rows={8}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Private Key
          </label>
          <p className="text-xs text-gray-400 mb-2">The private key in PEM format (begins with -----BEGIN PRIVATE KEY-----). This field is optional but recommended for full certificate management.</p>
          <Textarea
            placeholder="Paste the private key content here (optional)"
            value={formData.private_key}
            onChange={(e) => onFormDataChange({ private_key: e.target.value })}
            className="glass-input bg-white/5 border-white/20 text-white font-mono text-sm"
            rows={8}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Passphrase
          </label>
          <p className="text-xs text-gray-400 mb-2">If the private key is encrypted, enter the passphrase to decrypt it</p>
          <Input
            placeholder="Enter passphrase (if required)"
            type="password"
            value={formData.passphrase}
            onChange={(e) => onFormDataChange({ passphrase: e.target.value })}
            className="glass-input bg-white/5 border-white/20 text-white"
          />
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
          className="glass-button bg-green-600 hover:bg-green-700 text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          {editingEntry ? 'Update' : 'Save'}
        </Button>
      </div>
    </Card>
  );
};

export default CertificateForm;
