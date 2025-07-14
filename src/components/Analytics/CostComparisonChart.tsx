import React, { useState } from 'react';
import { DollarSign, Package, TrendingUp } from 'lucide-react';

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

interface CostComparisonChartProps {
  data: ProductCostData[];
}

export const CostComparisonChart: React.FC<CostComparisonChartProps> = ({ data }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const categories = ['all', ...new Set(data.map(item => item.category))];
  const filteredData = selectedCategory === 'all' 
    ? data 
    : data.filter(item => item.category === selectedCategory);

  const maxCost = Math.max(...filteredData.map(item => Math.max(item.base_price, item.current_price)));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Product Cost Comparison
        </h3>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category === 'all' ? 'All Categories' : category}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4 max-h-80 overflow-y-auto">
        {filteredData.slice(0, 8).map((item, index) => {
          const previousWidth = (item.base_price / maxCost) * 100;
          const currentWidth = (item.current_price / maxCost) * 100;

          return (
            <div key={item.product_id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {item.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.brand} • {item.supplier_country} • {item.sub_category}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <div className="text-sm font-medium text-red-600">
                    +${item.cost_increase.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    +{item.percentage_increase.toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                {/* Previous Cost Bar */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-12">Before</span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-3 relative">
                    <div
                      className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${previousWidth}%` }}
                    ></div>
                    <span className="absolute right-2 top-0 text-xs text-white font-medium leading-3">
                      ${item.base_price.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Current Cost Bar */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-12">After</span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-3 relative">
                    <div
                      className="bg-red-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${currentWidth}%` }}
                    ></div>
                    <span className="absolute right-2 top-0 text-xs text-white font-medium leading-3">
                      ${item.current_price.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Package className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Products Found</h3>
          <p className="text-gray-600 dark:text-gray-400">No products match the selected category.</p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Previous Cost</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Current Cost</span>
            </div>
          </div>
          <div className="text-gray-500 dark:text-gray-400">
            Showing {Math.min(filteredData.length, 8)} of {filteredData.length} products
          </div>
        </div>
      </div>
    </div>
  );
};