import React, { useState, useEffect } from 'react';
import { CheckCircle, Calendar, Package, DollarSign, TrendingUp } from 'lucide-react';

interface ApprovedProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  supplier: string;
  supplierCountry: string;
  qualityRating: number;
  allocationPercentage: number;
  diversificationScore: number;
  costSavings: number;
  tariffImpact: number;
}

interface ApprovedRecommendation {
  id: string;
  originalProduct: ApprovedProduct;
  alternatives: ApprovedProduct[];
  status: string;
  createdAt: string;
  category: string;
  priority: string;
  approvedAt: string;
}

export const ApprovedRecommendations: React.FC = () => {
  const [approvedRecommendations, setApprovedRecommendations] = useState<ApprovedRecommendation[]>([]);

  useEffect(() => {
    // Load approved recommendations from localStorage
    const stored = localStorage.getItem('approvedRecommendations');
    if (stored) {
      setApprovedRecommendations(JSON.parse(stored));
    }
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (approvedRecommendations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <CheckCircle className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Approved Recommendations
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Approved product recommendations will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {approvedRecommendations.map((recommendation) => {
        // Show all products (original + alternatives) that have >0% allocation
        const allProducts = [recommendation.originalProduct, ...recommendation.alternatives];
        const visibleProducts = allProducts.filter(product => product.allocationPercentage > 0);

        const totalCostSavings = recommendation.alternatives.reduce(
          (sum, alt) => sum + (alt.costSavings * alt.allocationPercentage / 100), 0
        );

        return (
          <div key={recommendation.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {recommendation.originalProduct.name}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(recommendation.priority)}`}>
                    {recommendation.priority} priority
                  </span>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Approved on</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(recommendation.approvedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Category: {recommendation.category}</span>
                <span>Total Cost Savings: ${totalCostSavings.toFixed(2)}</span>
              </div>
            </div>

            {/* Products Grid */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {visibleProducts.map((product, index) => {
                  const isOriginal = product.id === recommendation.originalProduct.id;
                  
                  return (
                    <div
                      key={product.id}
                      className={`p-4 rounded-lg border-2 ${
                        isOriginal 
                          ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' 
                          : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1 text-sm truncate">
                            {product.name}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                            {product.description}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>{product.supplierCountry}</span>
                            <span>•</span>
                            <span>★ {product.qualityRating}</span>
                          </div>
                        </div>
                      </div>

                      <div className={`px-2 py-1 text-xs font-medium rounded mb-3 ${
                        isOriginal ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200' : 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200'
                      }`}>
                        {isOriginal ? 'Original' : 'Alternative'}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Price:</span>
                          <span className="text-xs font-medium text-gray-900 dark:text-white">${(product.price || product.base_price).toFixed(2)}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Allocation:</span>
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                            {product.allocationPercentage}%
                          </span>
                        </div>

                        {!isOriginal && (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600 dark:text-gray-400">Savings:</span>
                              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                ${product.costSavings.toFixed(2)}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600 dark:text-gray-400">Diversification:</span>
                              <span className="text-xs font-medium text-gray-900 dark:text-white">
                                {product.diversificationScore}%
                              </span>
                            </div>
                            
                            {/* Show billing calculation for original products */}
                            {isOriginal && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-600 dark:text-gray-400">Predicted Price:</span>
                                <span className="text-xs font-medium text-red-600 dark:text-red-400">
                                  ${((product.base_price || product.price) * (1 + (product.tariff_rate || 0) / 100) * (1 + (product.delta_cat || 0.05))).toFixed(2)}
                                </span>
                              </div>
                            )}
                          </>
                        )}

                        {/* Allocation Bar */}
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                isOriginal ? 'bg-red-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${product.allocationPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary Stats */}
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {visibleProducts.length}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Active Products</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">
                      ${totalCostSavings.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Total Savings</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">
                      {Math.round(recommendation.alternatives.reduce(
                        (sum, alt) => sum + (alt.diversificationScore * alt.allocationPercentage / 100), 0
                      ))}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Avg Diversification</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-600">
                      {recommendation.alternatives.length}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Alternatives</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};