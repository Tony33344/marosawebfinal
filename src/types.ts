export interface PackageOption {
  uniq_id: string; // Use string based on SQL
  price: number;
  weight: string; // Changed back to string to match database format like "0,5l", "1kg"
  unit?: string; // Optional unit property for backwards compatibility
  description?: string; // Optional description field
  stock?: number; // Optional stock field as seen in database
  isActive?: boolean; // Optional isActive field
}

export interface Product {
  id: number;
  created_at: string;
  name: string;
  name_en?: string;
  name_de?: string;
  name_hr?: string;
  description?: string;
  description_en?: string;
  description_de?: string;
  description_hr?: string;
  // price column removed as it's null in SQL and prices are in package_options
  package_options: PackageOption[] | string; // Can be string initially, parsed to array
  image_url?: string;
  additional_images?: string[]; // Array of additional image URLs
  stock_quantity?: number;
  category?: string;
}

// Updated CartItem to use string for packageOptionId
export interface CartItem {
  productId: number;
  packageOptionId: string; // Changed to string to match uniq_id
  quantity: number;
}

export interface GiftProductItem {
  product_id: string;
  package_option_id: string;
  quantity: number;
  price: number;
  name: string;
}

export interface GiftItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  is_gift: boolean;
  gift_package_id: number;
  gift_products: GiftProductItem[];
  recipient_name?: string;
  recipient_message?: string;
  has_message_fee?: boolean;
}

export interface Recipe {
  id: number;
  title: string;
  title_en?: string;
  title_de?: string;
  title_hr?: string;
  title_sl?: string;
  image_url: string;
  ingredients: string[];
  ingredients_en?: string[];
  ingredients_de?: string[];
  ingredients_hr?: string[];
  ingredients_sl?: string[];
  instructions: string[];
  instructions_en?: string[];
  instructions_de?: string[];
  instructions_hr?: string[];
  instructions_sl?: string[];
  prepTime?: string;
  cookTime?: string;
  difficulty?: string;
  relatedProductIds: number[];
  created_at?: string;
}

export interface UserMetadata {
  full_name?: string;
  is_admin?: boolean;
  // Any other custom fields you want to store
}
