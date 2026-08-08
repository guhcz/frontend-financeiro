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

export interface CategoryFilters {
  page?: number;
  size?: number;
  sort?: string;
}
