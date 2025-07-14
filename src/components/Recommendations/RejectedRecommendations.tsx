import React, { useState, useEffect } from 'react';
import { XCircle, Calendar, Package, AlertTriangle } from 'lucide-react';

interface RejectedProduct {
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

interface RejectedRecommendation {
  id: string;
  originalProduct: RejectedProduct;
  alternatives: RejectedProduct[];
  status: string;
  createdAt: string;
  category: string;
  priority: string;
  rejectedAt: string;
  rejectionReason?: string;
}

export const RejectedRecommendations: React.FC = () => {
  const [rejectedRecommendations, setRejectedRecommendations] = useState<RejectedRecommendation[]>([]);

  useEffect(() => {
    // Load rejected recommendations from localStorage
    const stored = localStorage.getItem('rejectedRecommendations');
    if (stored) {
      setRejectedRecommendations(JSON.parse(stored));
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

  if (rejectedRecommendations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <XCircle className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Rejected Recommendations
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Rejected product recommendations will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {rejectedRecommendations.map((recommendation) => {
        // All products have 0% allocation in rejected recommendations
        const allProducts = [recommendation.originalProduct, ...recommendation.alternatives];
        const potentialSavings = recommendation.alternatives.reduce(
          (sum, alt) => sum + alt.costSavings, 0
        );

        return (
          <div key={recommendation.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <XCircle className="h-6 w-6 text-red-500" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {recommendation.originalProduct.name}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(recommendation.priority)}`}>
                    {recommendation.priority} priority
                  </span>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Rejected on</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(recommendation.rejectedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Category: {recommendation.category}</span>
                <span className="text-red-600 dark:text-red-400">
                  Potential Savings Lost: ${potentialSavings.toFixed(2)}
                </span>
              </div>
              
              {recommendation.rejectionReason && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-700 dark:text-red-300">
                  <strong>Rejection Reason:</strong> {recommendation.rejectionReason}
                </div>
              )}
            </div>

            {/* Products Grid - All with 0% allocation */}
            <div className="p-6">
              <div className="mb-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <span>All Products Rejected (0% Allocation)</span>
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {allProducts.map((product, index) => {
                  const isOriginal = product.id === recommendation.originalProduct.id;
                  
                  return (
                    <div
                      key={product.id}
                      className="p-4 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 opacity-75"
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
                        isOriginal 
                          ? 'bg-red-200 text-red-800 dark:bg-red-800/50 dark:text-red-300' 
                          : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                      }`}>
                        {isOriginal ? 'Original (Rejected)' : 'Alternative (Rejected)'}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Price:</span>
                          <span className="text-xs font-medium text-gray-900 dark:text-white">${(product.price || product.base_price).toFixed(2)}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Allocation:</span>
                          <span className="text-xs font-bold text-red-600 dark:text-red-400">
                            0%
                          </span>
                        </div>

                        {!isOriginal && (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600 dark:text-gray-400">Lost Savings:</span>
                              <span className="text-xs font-medium text-red-500 dark:text-red-400">
                                ${product.costSavings.toFixed(2)}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600 dark:text-gray-400">Diversification:</span>
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                {product.diversificationScore}%
                              </span>
                            </div>
                            
                            {/* Show what the predicted price would have been for original */}
                            {isOriginal && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-600 dark:text-gray-400">Would be Price:</span>
                                <span className="text-xs font-medium text-red-500 dark:text-red-400">
                                  ${((product.base_price || product.price) * (1 + (product.tariff_rate || 0) / 100) * (1 + (product.delta_cat || 0.05))).toFixed(2)}
                                </span>
                              </div>
                            )}
                          </>
                        )}

                        {/* Empty allocation bar */}
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div className="h-2 rounded-full bg-red-400" style={{ width: '0%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Impact Summary */}
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-red-600">
                      {allProducts.length}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Products Rejected</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-red-600">
                      ${potentialSavings.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Savings Lost</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-red-600">
                      {recommendation.alternatives.length > 0 ? Math.round(recommendation.alternatives.reduce(
                        (sum, alt) => sum + alt.diversificationScore, 0
                      ) / recommendation.alternatives.length) : 0}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Avg Diversification Lost</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-red-600">
                      0%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Current Allocation</div>
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