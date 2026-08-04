export interface Category {
  id: number;
  name: string;
  color: string;
  icon: string | null;
  active: boolean;
}

export interface CategoryRequest {
  name: string;
  color: string;
  icon: string | null;
}
