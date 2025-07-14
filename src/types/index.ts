export interface Product {
  id: string;
  product_id: string;
  name: string;
  description: string;
  base_price: number;
  category: string;
  sub_category: string;
  brand: string;
  supplier: string;
  supplier_country: string;
  image?: string;
  hs_code: string;
  is_tariffed: boolean;
  stock_level: number;
  rating: number;
  tariff_start_date?: string;
  tariff_end_date?: string;
  // Calculated fields
  tariff_rate?: number;
  tariff_impact?: number;
  current_price?: number;
  pred_price_after?: number;
  delta_cat?: number;
  allocationPercentage: number;
  diversificationScore: number;
  costSavings: number;
  qualityRating: number;
  tariffImpact: number;
}

export interface Replacement {
  original_product_id: string;
  replacement_id: string;
  name: string;
  brand: string;
  category: string;
  stock_level: number;
  reason_code: string;
  price: number;
  brand_popularity: number;
}

export interface TariffData {
  category: string;
  hs_code: string;
  country: string;
  tariff_rate: number;
  effective_date: string;
  affected_products: number;
}

export interface Recommendation {
  id: string;
  originalProduct: Product;
  alternatives: (Replacement & {
    allocationPercentage: number;
    diversificationScore: number;
    costSavings: number;
    qualityRating: number;
    tariffImpact: number;
  })[];
  status: 'pending' | 'approved' | 'rejected' | 'more-options-requested';
  createdAt: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  rejectionReason?: string;
  approvedAt?: string;
  rejectedAt?: string;
}

export interface DashboardMetrics {
  totalRecommendations: number;
  pendingApprovals: number;
  approvedToday: number;
  rejectedToday: number;
  totalCostSavings: number;
  supplierDiversification: number;
  averageProcessingTime: number;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface SearchFilters {
  category?: string;
  priceRange?: [number, number];
  supplierCountry?: string;
  minQuality?: number;
}

export type ExtendedReplacement = Replacement & {
  allocationPercentage: number;
  diversificationScore: number;
  costSavings: number;
  qualityRating: number;
  tariffImpact: number;
}

export interface RecommendationAlternative {
  replacement_id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  reason_code: string;
  brand_popularity: number;
  country?: string;
}
