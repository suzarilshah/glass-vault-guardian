
export interface CertificateEntry {
  id: string;
  user_id: string;
  title: string;
  certificate_file_encrypted: string;
  private_key_encrypted?: string;
  passphrase_encrypted?: string;
  common_name?: string;
  issuer?: string;
  expires_at?: string;
  certificate_type: string;
  environment: string;
  group_id?: string;
  is_expired?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CertificateGroup {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CertificateFormData {
  title: string;
  certificate_file?: File;
  private_key_file?: File;
  passphrase: string;
  certificate_type: string;
  environment: string;
  group_id: string;
  expiration_days: string;
}

export interface CertificateHistory {
  id: string;
  entry_id: string;
  user_id: string;
  certificate_file_encrypted: string;
  private_key_encrypted?: string;
  changed_at: string;
}
