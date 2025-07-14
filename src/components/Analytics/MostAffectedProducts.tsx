import React, { useState } from 'react';
import { AlertTriangle, TrendingUp, DollarSign, MapPin, Package, Filter } from 'lucide-react';

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

interface MostAffectedProductsProps {
  data: ProductCostData[];
}

export const MostAffectedProducts: React.FC<MostAffectedProductsProps> = ({ data }) => {
  const [sortBy, setSortBy] = useState<'cost_increase' | 'percentage_increase'>('cost_increase');
  const [filterCategory, setFilterCategory] = useState('all');

  const categories = ['all', ...new Set(data.map(item => item.category))];
  
  const filteredData = filterCategory === 'all' 
    ? data 
    : data.filter(item => item.category === filterCategory);

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortBy === 'cost_increase') {
      return b.cost_increase - a.cost_increase;
    }
    return b.percentage_increase - a.percentage_increase;
  });

  const getImpactLevel = (percentage_increase: number) => {
    if (percentage_increase >= 20) return { level: 'Critical', color: 'text-red-600 bg-red-100', icon: AlertTriangle };
    if (percentage_increase >= 15) return { level: 'High', color: 'text-orange-600 bg-orange-100', icon: TrendingUp };
    if (percentage_increase >= 10) return { level: 'Medium', color: 'text-yellow-600 bg-yellow-100', icon: TrendingUp };
    return { level: 'Low', color: 'text-green-600 bg-green-100', icon: TrendingUp };
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Most Affected Products
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Products with the highest cost increases due to tariff changes
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'cost_increase' | 'percentage_increase')}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="cost_increase">Sort by Cost Increase</option>
            <option value="percentage_increase">Sort by Percentage Increase</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {sortedData.slice(0, 10).map((product, index) => {
          const impact = getImpactLevel(product.percentage_increase);
          const Icon = impact.icon;

          return (
            <div
              key={product.product_id}
              className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex-shrink-0 w-8 text-center">
                <span className="text-lg font-bold text-gray-500 dark:text-gray-400">
                  #{index + 1}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {product.name}
                    </h4>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Package className="h-3 w-3" />
                        <span>{product.sub_category}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>{product.supplier_country}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>Stock: {product.stock_level}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>HS: {product.hs_code}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 ml-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        ${product.base_price.toFixed(2)} → ${product.current_price.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Base → Current
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold text-red-600">
                        +${product.cost_increase.toFixed(2)}
                      </div>
                      <div className="text-xs text-red-500">
                        +{product.percentage_increase.toFixed(1)}%
                      </div>
                    </div>

                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${impact.color} flex items-center space-x-1`}>
                      <Icon className="h-3 w-3" />
                      <span>{impact.level}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sortedData.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <AlertTriangle className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Products Found</h3>
          <p className="text-gray-600 dark:text-gray-400">No products match the selected category filter.</p>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-red-600">
              {sortedData.length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Products Affected</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              ${sortedData.reduce((sum, p) => sum + p.cost_increase, 0).toFixed(0)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total Cost Increase</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">
              {sortedData.length > 0 ? (sortedData.reduce((sum, p) => sum + p.percentage_increase, 0) / sortedData.length).toFixed(1) : 0}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Avg % Increase</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {sortedData.filter(p => p.percentage_increase >= 20).length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Critical Impact</div>
          </div>
        </div>
      </div>
    </div>
  );
};