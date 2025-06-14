
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ApiFormData, ApiGroup } from '@/types/apiVault';
import ApiKeyValidationDisplay from './ApiKeyValidationDisplay';

interface ApiFormFieldsProps {
  formData: ApiFormData;
  setFormData: (data: ApiFormData) => void;
  groups: ApiGroup[];
}

const ApiFormFields: React.FC<ApiFormFieldsProps> = ({
  formData,
  setFormData,
  groups,
}) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-gray-300">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="bg-white/10 border-white/20 text-white"
            placeholder="My API Key"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="api_name" className="text-gray-300">Service Name</Label>
          <Input
            id="api_name"
            value={formData.api_name}
            onChange={(e) => setFormData({ ...formData, api_name: e.target.value })}
            className="bg-white/10 border-white/20 text-white"
            placeholder="OpenAI, Stripe, AWS..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="api_key" className="text-gray-300">API Key *</Label>
        <div className="relative">
          <Input
            id="api_key"
            type={showApiKey ? 'text' : 'password'}
            value={formData.api_key}
            onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
            className="bg-white/10 border-white/20 text-white pr-10"
            placeholder="sk-..."
            required
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            onClick={() => setShowApiKey(!showApiKey)}
          >
            {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>
        
        <ApiKeyValidationDisplay apiKey={formData.api_key} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="api_secret" className="text-gray-300">API Secret (Optional)</Label>
        <div className="relative">
          <Input
            id="api_secret"
            type={showApiSecret ? 'text' : 'password'}
            value={formData.api_secret}
            onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
            className="bg-white/10 border-white/20 text-white pr-10"
            placeholder="Secret key or token..."
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            onClick={() => setShowApiSecret(!showApiSecret)}
          >
            {showApiSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="environment" className="text-gray-300">Environment</Label>
          <Select value={formData.environment} onValueChange={(value: 'development' | 'staging' | 'production') => setFormData({ ...formData, environment: value })}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-card bg-white/10 backdrop-blur-xl border-white/20">
              <SelectItem value="development">Development</SelectItem>
              <SelectItem value="staging">Staging</SelectItem>
              <SelectItem value="production">Production</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="group" className="text-gray-300">Group</Label>
          <Select value={formData.group_id || "none"} onValueChange={(value) => setFormData({ ...formData, group_id: value === "none" ? "" : value })}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Select group" />
            </SelectTrigger>
            <SelectContent className="glass-card bg-white/10 backdrop-blur-xl border-white/20">
              <SelectItem value="none">No Group</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="endpoint_url" className="text-gray-300">Endpoint URL (Optional)</Label>
        <Input
          id="endpoint_url"
          value={formData.endpoint_url}
          onChange={(e) => setFormData({ ...formData, endpoint_url: e.target.value })}
          className="bg-white/10 border-white/20 text-white"
          placeholder="https://api.example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-gray-300">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="bg-white/10 border-white/20 text-white"
          placeholder="Additional notes about this API key..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="expiration_days" className="text-gray-300">Expires in (days)</Label>
        <Input
          id="expiration_days"
          type="number"
          value={formData.expiration_days}
          onChange={(e) => setFormData({ ...formData, expiration_days: e.target.value })}
          className="bg-white/10 border-white/20 text-white"
          placeholder="90"
          min="1"
        />
      </div>
    </>
  );
};

export default ApiFormFields;
