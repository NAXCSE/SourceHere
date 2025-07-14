import { Product, Recommendation, DashboardMetrics, ApiResponse, SearchFilters } from '../types';
import { RecommendationAlternative } from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          ...options?.headers,
        },
        ...options,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Dashboard and Metrics
  async getDashboardMetrics(): Promise<ApiResponse<DashboardMetrics>> {
    return this.request<DashboardMetrics>('/dashboard/metrics');
  }

  // Recommendations
  async getRecommendations(status?: string): Promise<ApiResponse<Recommendation[]>> {
    const query = status ? `?status=${status}` : '';
    return this.request<Recommendation[]>(`/recommendations${query}`);
  }

  async getRecommendationById(id: string): Promise<ApiResponse<Recommendation>> {
    return this.request<Recommendation>(`/recommendations/${id}`);
  }

  // Approval Actions
  async approveRecommendation(id: string, selectedAlternatives: string[]): Promise<ApiResponse<any>> {
    return this.request(`/recommendations/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ selectedAlternatives }),
    });
  }

  async rejectRecommendation(id: string, reason?: string): Promise<ApiResponse<any>> {
    return this.request(`/recommendations/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async requestMoreOptions(id: string, filters?: SearchFilters): Promise<ApiResponse<Product[]>> {
    return this.request(`/recommendations/${id}/more-options`, {
      method: 'POST',
      body: JSON.stringify({ filters }),
    });
  }

  // External Product Search
  async searchProducts(query: string, filters?: SearchFilters): Promise<ApiResponse<Product[]>> {
    return this.request('/products/search', {
      method: 'POST',
      body: JSON.stringify({ query, filters }),
    });
  }

  // Bulk Operations
  async bulkApproval(recommendationIds: string[]): Promise<ApiResponse<any>> {
    return this.request('/recommendations/bulk-approve', {
      method: 'POST',
      body: JSON.stringify({ recommendationIds }),
    });
  }

  // Tariff Analysis
  async getTariffAnalysis(productId: string, country: string): Promise<ApiResponse<any>> {
    return this.request(`/tariffs/analysis?productId=${productId}&country=${country}`);
  }

    // FastAPI ML backend for generating 1 new alternative
  async getNewAlternative(originalId: string, rejectedId: string): Promise<RecommendationAlternative> {
    const response = await fetch(`http://localhost:8000/recommend?original_id=${originalId}&rejected_id=${rejectedId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch new recommendation');
    }
    return await response.json();
  }
}

export const apiService = new ApiService();