import React, { useState, useEffect } from 'react';
import { RecommendationCard } from './RecommendationCard';
import { Recommendation } from '../../types';
import { CSVDataService } from '../../services/csvDataService';
import { Filter, Package, ChevronDown } from 'lucide-react';

interface RecommendationsListProps {
  status?: string;
}

export const RecommendationsList: React.FC<RecommendationsListProps> = ({ status }) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');

  useEffect(() => {
    fetchRecommendations();
  }, [status]);

  useEffect(() => {
    // Reset product selection when category changes
    setSelectedProduct('');
  }, [selectedCategory]);

  const fetchRecommendations = async () => {
    try {
      // Load recommendations from CSV data
      const csvRecommendations = await CSVDataService.generateRecommendations();
      
      // Filter by status if provided
      const filteredRecommendations = status 
        ? csvRecommendations.filter(rec => rec.status === status)
        : csvRecommendations;

      setRecommendations(filteredRecommendations);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, selectedAlternatives: string[]) => {
    try {
      // Remove from current recommendations
      setRecommendations(prev => prev.filter(rec => rec.id !== id));
    } catch (error) {
      console.error('Failed to approve recommendation:', error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      // Remove from current recommendations
      setRecommendations(prev => prev.filter(rec => rec.id !== id));
    } catch (error) {
      console.error('Failed to reject recommendation:', error);
    }
  };

  const handleRejectAlternative = async (recommendationId: string, alternativeId: string) => {
    try {
      setRecommendations(prev => 
        prev.map(rec => 
          rec.id === recommendationId ? {
            ...rec,
            alternatives: rec.alternatives.filter(alt => alt.id !== alternativeId)
          } : rec
        )
      );
    } catch (error) {
      console.error('Failed to reject alternative:', error);
    }
  };

  const handleRequestMore = async (id: string) => {
    try {
      setRecommendations(prev => 
        prev.map(rec => 
          rec.id === id ? { ...rec, status: 'more-options-requested' as const } : rec
        )
      );
    } catch (error) {
      console.error('Failed to request more options:', error);
    }
  };

  // Get unique categories
  const categories = [...new Set(recommendations.map(rec => rec.category))];
  
  // Filter products by selected category
  const availableProducts = recommendations.filter(rec => 
    !selectedCategory || rec.category === selectedCategory
  );

  // Filter final recommendations
  const filteredRecommendations = recommendations.filter(rec => {
    const matchesCategory = !selectedCategory || rec.category === selectedCategory;
    const matchesProduct = !selectedProduct || rec.originalProduct.id === selectedProduct;
    return matchesCategory && matchesProduct;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 space-y-4">
        {/* Category Selection */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Category:</span>
          </div>
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-48 text-gray-900 dark:text-white"
            >
              <option value="">Select a category...</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Product Selection - Only show if category is selected */}
        {selectedCategory && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Product:</span>
            </div>
            <div className="relative">
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-64 text-gray-900 dark:text-white"
              >
                <option value="">Select a product...</option>
                {availableProducts.map(rec => (
                  <option key={rec.originalProduct.id} value={rec.originalProduct.id}>
                    {rec.originalProduct.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {!selectedCategory ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Filter className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Select a Category
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Choose a category from the dropdown above to view available products.
            </p>
          </div>
        ) : !selectedProduct ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Package className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Select a Product
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Choose a product from the dropdown above to see its alternative recommendations.
            </p>
          </div>
        ) : filteredRecommendations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Package className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Recommendations Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No recommendations available for the selected product.
            </p>
          </div>
        ) : (
          filteredRecommendations.map(recommendation => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              onApprove={handleApprove}
              onReject={handleReject}
              onRejectAlternative={handleRejectAlternative}
              onRequestMore={handleRequestMore}
            />
          ))
        )}
      </div>
    </div>
  );
};