
export interface ApiEntry {
  id: string;
  user_id: string;
  title: string;
  api_name?: string;
  api_key_encrypted: string;
  api_secret_encrypted?: string;
  endpoint_url?: string;
  description?: string;
  environment: 'development' | 'staging' | 'production';
  group_id?: string;
  expires_at?: string;
  is_expired?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiGroup {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiFormData {
  title: string;
  api_name: string;
  api_key: string;
  api_secret: string;
  endpoint_url: string;
  description: string;
  environment: 'development' | 'staging' | 'production';
  group_id: string;
  expiration_days: string;
}
