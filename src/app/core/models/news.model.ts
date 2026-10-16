export interface NewsItem {
  id: string;
  message: string;
  is_active: boolean;
  created_at: string; // ISO timestamp
}