import React from 'react';
import { Product } from '../../types';
import { MapPin, Star, TrendingUp, DollarSign, Percent, X } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  isSelected?: boolean;
  onSelect?: (product: Product) => void;
  onReject?: (product: Product) => void;
  onAllocationChange?: (productId: string, percentage: number) => void;
  variant?: 'primary' | 'alternative';
  showComparison?: boolean;
  isOriginal?: boolean;
  showAllocationInput?: boolean;
  showBilling?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isSelected = false,
  onSelect,
  onReject,
  onAllocationChange,
  variant = 'alternative',
  showComparison = false,
  isOriginal = false,
  showAllocationInput = false,
  showBilling = false
}) => {
  const handleClick = () => {
    if (onSelect && !isOriginal) {
      onSelect(product);
    }
  };

  const handleReject = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onReject) {
      onReject(product);
    }
  };

  const handleAllocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPercentage = parseInt(e.target.value) || 0;
    if (onAllocationChange) {
      onAllocationChange(product.id, newPercentage);
    }
  };

  // Calculate predicted price after tariff using the formula:
  // pred_price_after = base_price * (1 + tariff_rate/100) * (1 + delta_cat)
  const calculatePredictedPrice = () => {
    const tariffRate = product.tariff_rate || 0;
    const deltaCat = product.delta_cat || 0.05; // Default 5% category adjustment
    return product.base_price * (1 + tariffRate / 100) * (1 + deltaCat);
  };

  const predictedPrice = calculatePredictedPrice();

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border transition-all duration-200 ${
        !isOriginal ? 'cursor-pointer' : ''
      } ${
        isSelected 
          ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800 shadow-lg' 
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
      } ${variant === 'primary' ? 'md:col-span-2 lg:col-span-1' : ''}`}
      onClick={handleClick}
    >
      <div className="p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">
                {product.name}
              </h3>
              {!isOriginal && onReject && (
                <button
                  onClick={handleReject}
                  className="ml-2 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  title="Reject this alternative"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {product.description}
            </p>
            
            <div className="flex items-center space-x-4 mb-3">
              <div className="flex items-center space-x-1">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  ${(product.price || product.base_price).toFixed(2)}
                </span>
              </div>
              
              {showBilling && isOriginal && (
                <div className="flex items-center space-x-1">
                  <span className="text-sm text-red-600 dark:text-red-400">
                    Predicted: ${predictedPrice.toFixed(2)}
                  </span>
                </div>
              )}
              
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {product.qualityRating.toFixed(1)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                <MapPin className="h-4 w-4" />
                <span>{product.supplierCountry}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Percent className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {product.allocationPercentage}%
                </span>
              </div>
            </div>
            
            {/* Allocation Section */}
            <div className="mb-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Allocation Percentage
                  </span>
                  <div className="flex items-center space-x-2">
                    {showAllocationInput ? (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={product.allocationPercentage}
                        onChange={handleAllocationChange}
                        onClick={(e) => e.stopPropagation()}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {product.allocationPercentage}%
                      </span>
                    )}
                    {!isOriginal && onSelect && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(product);
                        }}
                        className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-600 dark:hover:text-blue-400'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      isOriginal ? 'bg-red-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${product.allocationPercentage}%` }}
                  ></div>
                </div>
                
                {isOriginal && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                    Original product under tariff
                  </p>
                )}
              </div>
            </div>
            
            {showComparison && (
              <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Tariff Impact:</span>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className={`h-3 w-3 ${
                        product.tariffImpact > 0 ? 'text-red-500' : 'text-green-500'
                      }`} />
                      <span className={`font-medium ${
                        product.tariffImpact > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {product.tariffImpact > 0 ? '+' : ''}${product.tariffImpact.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Cost Savings:</span>
                    <div className="font-medium text-green-600">
                      ${product.costSavings.toFixed(2)}
                    </div>
                  </div>
                </div>
                
                <div className="mt-2">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">Diversification Score:</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${product.diversificationScore}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {product.diversificationScore}%
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {showBilling && (
              <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-3">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Billing Details</h5>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Base Price:</span>
                    <span className="text-gray-900 dark:text-white">${product.base_price.toFixed(2)}</span>
                  </div>
                  {isOriginal && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Tariff Rate:</span>
                        <span className="text-red-600">{(product.tariff_rate || 0).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Category Adjustment:</span>
                        <span className="text-orange-600">{((product.delta_cat || 0.05) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between border-t pt-1">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Predicted Final:</span>
                        <span className="text-red-600 font-bold">${predictedPrice.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};