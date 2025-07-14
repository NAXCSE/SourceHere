import React, { useState, useEffect } from 'react';
import { Recommendation, Product } from '../../types';
import { ProductCard } from '../Products/ProductCard';
import { Check, X, Clock, AlertCircle } from 'lucide-react';
import { ExtendedReplacement } from '../../types';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onApprove: (id: string, selectedAlternatives: string[]) => void;
  onReject: (id: string) => void;
  onRejectAlternative: (recommendationId: string, alternativeId: string) => void;
  onRequestMore: (id: string) => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onApprove,
  onReject,
  onRejectAlternative,
  onRequestMore
}) => {
  const [selectedAlternatives, setSelectedAlternatives] = useState<string[]>(
    recommendation.alternatives.map(alt => alt.id) // All alternatives selected by default
  );
  const [showComparison, setShowComparison] = useState(false);
  const [products, setProducts] = useState(() => {
    // Initialize with equal distribution
    const totalProducts = 1 + recommendation.alternatives.length; // 1 original + alternatives
    const equalPercentage = Math.floor(100 / totalProducts);
    const remainder = 100 - (equalPercentage * totalProducts);
    
    return {
      original: { 
        ...recommendation.originalProduct, 
        allocationPercentage: equalPercentage + remainder // Give remainder to original
      },
      alternatives: recommendation.alternatives.map(alt => ({
        ...alt,
        allocationPercentage: equalPercentage
      }))
    };
  });

  // Auto-sync original product percentage when alternatives change
  useEffect(() => {
    const selectedAlternativesTotal = products.alternatives
      .filter(alt => selectedAlternatives.includes(alt.id))
      .reduce((sum, alt) => sum + alt.allocationPercentage, 0);
    
    const newOriginalPercentage = Math.max(0, 100 - selectedAlternativesTotal);
    
    setProducts(prev => ({
      ...prev,
      original: { ...prev.original, allocationPercentage: newOriginalPercentage }
    }));
  }, [selectedAlternatives, products.alternatives]);

  const handleProductSelect = (product: Product) => {
    setSelectedAlternatives(prev => 
      prev.includes(product.id) 
        ? prev.filter(id => id !== product.id)
        : [...prev, product.id]
    );
  };

  const handleRemoveAlternative = (productId: string) => {
    // Remove from alternatives array
    setProducts(prev => ({
      ...prev,
      alternatives: prev.alternatives.filter(alt => alt.id !== productId)
    }));
    
    // Remove from selected alternatives
    setSelectedAlternatives(prev => prev.filter(id => id !== productId));
    
    // Call the parent handler
    onRejectAlternative(recommendation.id, productId);
  };

  const handleAlternativeAllocationChange = (productId: string, newPercentage: number) => {
    const clampedPercentage = Math.max(0, Math.min(100, newPercentage));
    
    // Update alternative product allocation
    setProducts(prev => {
      const updatedAlternatives = prev.alternatives.map(alt =>
        alt.id === productId ? { ...alt, allocationPercentage: clampedPercentage } : alt
      );
      
      // Calculate new original percentage automatically
      const selectedAlternativesTotal = updatedAlternatives
        .filter(alt => selectedAlternatives.includes(alt.id))
        .reduce((sum, alt) => sum + alt.allocationPercentage, 0);
      
      const newOriginalPercentage = Math.max(0, 100 - selectedAlternativesTotal);
      
      return {
        original: { ...prev.original, allocationPercentage: newOriginalPercentage },
        alternatives: updatedAlternatives
      };
    });
  };

  const handleShowRecommendedMore = async () => {
    const originalId = recommendation.originalProduct.id;
    const rejectedId = products.alternatives[0]?.id; // Use the first alternative as rejected

    try {
      const response = await fetch(`http://127.0.0.1:8000/recommend?original_id=${originalId}&rejected_id=${rejectedId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch new recommendation');
      }
      
      const newAlt = await response.json();

      const newProduct: ExtendedReplacement & { id: string } = {
        id: newAlt.replacement_id, // for UI component keys and tracking
        replacement_id: newAlt.replacement_id,
        original_product_id: recommendation.originalProduct.product_id,
        name: newAlt.name,
        brand: newAlt.brand,
        category: newAlt.category,
        stock_level: Math.floor(Math.random() * 5000) + 1000, // Generate realistic stock level
        reason_code: newAlt.reason_code || 'quality',
        price: newAlt.price,
        brand_popularity: newAlt.brand_popularity || 4.0,

        // Extended fields
        allocationPercentage: 0,
        diversificationScore: Math.floor(Math.random() * 40) + 60, // 60-100%
        costSavings: Math.max(0, (products.original.price || products.original.base_price) - newAlt.price),
        qualityRating: (newAlt.brand_popularity || 4.0) / 2, // Convert to 5-star scale if needed
        tariffImpact: 0
      };

      setProducts(prev => ({
        ...prev,
        alternatives: [...prev.alternatives, newProduct]
      }));

      setSelectedAlternatives(prev => [...prev, newProduct.id]);
    } catch (error) {
      console.error("Failed to fetch new alternative:", error);
      // Optionally show user-friendly error message
    }
  };

  const handleApprove = () => {
    if (selectedAlternatives.length > 0) {
      // Store the allocation data in localStorage for the approved page
      const approvedData = {
        id: recommendation.id,
        originalProduct: products.original,
        alternatives: products.alternatives.filter(alt => 
          selectedAlternatives.includes(alt.id)
        ),
        status: 'approved',
        createdAt: recommendation.createdAt,
        category: recommendation.category,
        priority: recommendation.priority,
        approvedAt: new Date().toISOString()
      };
      
      // Get existing approved recommendations
      const existingApproved = JSON.parse(localStorage.getItem('approvedRecommendations') || '[]');
      const updatedApproved = [...existingApproved, approvedData];
      localStorage.setItem('approvedRecommendations', JSON.stringify(updatedApproved));
      
      onApprove(recommendation.id, selectedAlternatives);
    }
  };

  const handleRejectRecommendation = () => {
    // Store rejected data with 0% allocation for all products
    const rejectedData = {
      id: recommendation.id,
      originalProduct: { ...products.original, allocationPercentage: 0 },
      alternatives: products.alternatives.map(alt => ({ ...alt, allocationPercentage: 0 })),
      status: 'rejected',
      createdAt: recommendation.createdAt,
      category: recommendation.category,
      priority: recommendation.priority,
      rejectedAt: new Date().toISOString(),
      rejectionReason: 'Manual rejection by user'
    };
    
    // Get existing rejected recommendations
    const existingRejected = JSON.parse(localStorage.getItem('rejectedRecommendations') || '[]');
    const updatedRejected = [...existingRejected, rejectedData];
    localStorage.setItem('rejectedRecommendations', JSON.stringify(updatedRejected));
    
    onReject(recommendation.id);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved': return <Check className="h-4 w-4 text-green-500" />;
      case 'rejected': return <X className="h-4 w-4 text-red-500" />;
      case 'more-options-requested': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const totalAllocation = products.original.allocationPercentage + 
    products.alternatives
      .filter(alt => selectedAlternatives.includes(alt.id))
      .reduce((sum, alt) => sum + alt.allocationPercentage, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {recommendation.originalProduct.name}
            </h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(recommendation.priority)}`}>
              {recommendation.priority} priority
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {getStatusIcon(recommendation.status)}
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
              {recommendation.status.replace('-', ' ')}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Category: {recommendation.category}</span>
          <span>Created: {new Date(recommendation.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
            Original Product (Under Tariff) - Auto-Synced: {products.original.allocationPercentage}%
          </h4>
          <ProductCard 
            product={products.original}
            variant="primary"
            showComparison={showComparison}
            isOriginal={true}
            showAllocationInput={false} // Disabled for original - auto-synced
            showBilling={true} // Show billing details for original product
          />
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">Alternative Recommendations</h4>
            <div className="flex items-center space-x-4">
              <span className={`text-sm font-medium ${
                totalAllocation === 100 ? 'text-green-600' : 'text-red-600'
              }`}>
                Total: {totalAllocation}%
              </span>
              <button
                onClick={() => setShowComparison(!showComparison)}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                {showComparison ? 'Hide Details' : 'Show Comparison'}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.alternatives.map((product) => (
              <div key={product.id} className="relative">
                <ProductCard
                  product={product}
                  isSelected={selectedAlternatives.includes(product.id)}
                  onSelect={handleProductSelect}
                  onAllocationChange={handleAlternativeAllocationChange}
                  showComparison={showComparison}
                  isOriginal={false}
                  showAllocationInput={true}
                  showBilling={showComparison} // Show billing when comparison is enabled
                  onShowRecommendedMore={handleShowRecommendedMore}
                  onRemove={() => handleRemoveAlternative(product.id)}
                />
              </div>
            ))}
          </div>
        </div>

        {recommendation.status === 'pending' && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedAlternatives.length > 0 
                ? `${selectedAlternatives.length} alternative(s) selected | Total allocation: ${totalAllocation}%`
                : 'Select alternatives to approve'
              }
              {totalAllocation !== 100 && (
                <div className="text-red-600 dark:text-red-400 text-xs mt-1">
                  Total allocation must equal 100% to approve
                </div>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleRejectRecommendation}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                <X className="h-4 w-4 inline mr-2" />
                Reject
              </button>
              
              <button
                onClick={handleApprove}
                disabled={selectedAlternatives.length === 0 || totalAllocation !== 100}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Check className="h-4 w-4 inline mr-2" />
                Approve Selected
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};