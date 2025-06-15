
export interface PasswordGroup {
  id: string;
  name: string;
  description: string;
}

// Alias for backward compatibility
export type Group = PasswordGroup;

export interface PasswordEntry {
  id: string;
  title: string;
  username: string;
  password_encrypted: string;
  website: string;
  notes: string;
  group_id: string | null;
  expires_at: string | null;
  is_expired: boolean;
  created_at: string;
  updated_at: string;
  expiration_days?: string;
}

export interface FormData {
  title: string;
  username: string;
  password: string;
  website: string;
  notes: string;
  group_id: string;
  expiration_days: string;
}
