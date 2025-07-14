import React from 'react';
import { Package, TrendingUp, DollarSign } from 'lucide-react';

interface ProductCostData {
  product_id: string;
  name: string;
  brand: string;
  category: string;
  sub_category: string;
  supplier_country: string;
  hs_code: string;
  base_price: number;
  current_price: number;
  cost_increase: number;
  percentage_increase: number;
  tariff_impact: number;
  stock_level: number;
  rating: number;
  is_tariffed: boolean;
  tariff_start_date: string;
  tariff_end_date?: string;
}

interface CategoryBreakdownProps {
  data: ProductCostData[];
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ data }) => {
  const categoryStats = data.reduce((acc, product) => {
    const category = product.category;
    if (!acc[category]) {
      acc[category] = {
        count: 0,
        totalCostIncrease: 0,
        avgPercentageIncrease: 0,
        totalStockLevel: 0,
        avgRating: 0,
        subCategories: new Set()
      };
    }
    
    acc[category].count += 1;
    acc[category].totalCostIncrease += product.cost_increase;
    acc[category].avgPercentageIncrease += product.percentage_increase;
    acc[category].totalStockLevel += product.stock_level;
    acc[category].avgRating += product.rating;
    acc[category].subCategories.add(product.sub_category);
    
    return acc;
  }, {} as Record<string, any>);

  // Calculate averages
  Object.keys(categoryStats).forEach(category => {
    const stats = categoryStats[category];
    stats.avgPercentageIncrease = stats.avgPercentageIncrease / stats.count;
    stats.avgRating = stats.avgRating / stats.count;
    stats.subCategoryCount = stats.subCategories.size;
  });

  const sortedCategories = Object.entries(categoryStats)
    .sort(([,a], [,b]) => b.totalCostIncrease - a.totalCostIncrease);

  const getCategoryColor = (index: number) => {
    const colors = [
      'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500',
      'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Category Impact Analysis
        </h3>
        <Package className="h-5 w-5 text-gray-400" />
      </div>

      <div className="space-y-4">
        {sortedCategories.map(([category, stats], index) => (
          <div key={category} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${getCategoryColor(index)}`}></div>
                <h4 className="font-medium text-gray-900 dark:text-white">{category}</h4>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({stats.subCategoryCount} sub-categories)
                </span>
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {stats.count} products
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-500 dark:text-gray-400">Total Cost Impact</div>
                <div className="font-semibold text-red-600">
                  +${stats.totalCostIncrease.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Avg % Increase</div>
                <div className="font-semibold text-orange-600">
                  {stats.avgPercentageIncrease.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Total Stock</div>
                <div className="font-semibold text-blue-600">
                  {stats.totalStockLevel.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Avg Rating</div>
                <div className="font-semibold text-green-600">
                  {stats.avgRating.toFixed(1)}★
                </div>
              </div>
            </div>

            {/* Progress bar for cost impact */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Cost Impact Severity</span>
                <span>{stats.avgPercentageIncrease.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getCategoryColor(index)}`}
                  style={{ width: `${Math.min(stats.avgPercentageIncrease * 4, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sortedCategories.length === 0 && (
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Data Available</h3>
          <p className="text-gray-600 dark:text-gray-400">No category data found for the selected filters.</p>
        </div>
      )}
    </div>
  );
};