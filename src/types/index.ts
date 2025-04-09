export interface TrashReport {
  id: string;
  image_url: string;
  location: {
    neighborhood: string;
    latitude?: number;
    longitude?: number;
  };
  size: 'small' | 'medium' | 'large' | 'very_large';
  description: string;
  created_at: string;
  status: 'pending' | 'in_review' | 'resolved';
  user_id?: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'anonymous' | 'contributor' | 'admin';
  created_at: string;
}

export type ReportFormData = Omit<TrashReport, 'id' | 'created_at' | 'status' | 'user_id'> & {
  image_file: File | null;
}; 