// Tree interface definition
export interface Tree {
  id: number;
  name: string;
  scientific_name: string;
  family_name?: string;
  location: string;
  gen_info?: string;
  distribution?: string;
  image_url?: string;
  pin_icon?: string;
  pin_location_img?: string;
  tree_status?: string;
  created_at?: string;
  lat?: number;
  lng?: number;
  latitude?: number; // For compatibility with component usage
  longitude?: number; // For compatibility with component usage
} 