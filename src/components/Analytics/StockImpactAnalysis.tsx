import React from 'react';
import { AlertTriangle, Package, TrendingDown, CheckCircle } from 'lucide-react';

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

interface StockImpactAnalysisProps {
  data: ProductCostData[];
}

export const StockImpactAnalysis: React.FC<StockImpactAnalysisProps> = ({ data }) => {
  const getStockLevel = (stock: number) => {
    if (stock < 100) return { level: 'Critical', color: 'text-red-600 bg-red-100', icon: AlertTriangle };
    if (stock < 300) return { level: 'Low', color: 'text-orange-600 bg-orange-100', icon: TrendingDown };
    if (stock < 600) return { level: 'Medium', color: 'text-yellow-600 bg-yellow-100', icon: Package };
    return { level: 'Good', color: 'text-green-600 bg-green-100', icon: CheckCircle };
  };

  const stockAnalysis = {
    critical: data.filter(p => p.stock_level < 100),
    low: data.filter(p => p.stock_level >= 100 && p.stock_level < 300),
    medium: data.filter(p => p.stock_level >= 300 && p.stock_level < 600),
    good: data.filter(p => p.stock_level >= 600)
  };

  const totalStock = data.reduce((sum, p) => sum + p.stock_level, 0);
  const avgStock = data.length > 0 ? totalStock / data.length : 0;
  const criticalProducts = stockAnalysis.critical.length;
  const highImpactLowStock = data.filter(p => p.stock_level < 200 && p.percentage_increase > 15);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Stock Level Impact Analysis
        </h3>
        <Package className="h-5 w-5 text-gray-400" />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalStock.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Stock</div>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.round(avgStock)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Avg per Product</div>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {criticalProducts}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Critical Stock</div>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {highImpactLowStock.length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">High Risk</div>
        </div>
      </div>

      {/* Stock Level Distribution */}
      <div className="space-y-4 mb-6">
        <h4 className="font-medium text-gray-900 dark:text-white">Stock Level Distribution</h4>
        
        {Object.entries(stockAnalysis).map(([level, products]) => {
          const stockInfo = getStockLevel(level === 'critical' ? 50 : level === 'low' ? 200 : level === 'medium' ? 450 : 700);
          const Icon = stockInfo.icon;
          const percentage = data.length > 0 ? (products.length / data.length) * 100 : 0;

          return (
            <div key={level} className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${stockInfo.color} flex items-center space-x-1 min-w-24`}>
                <Icon className="h-3 w-3" />
                <span className="capitalize">{stockInfo.level}</span>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {products.length} products
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      level === 'critical' ? 'bg-red-500' :
                      level === 'low' ? 'bg-orange-500' :
                      level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* High Risk Products */}
      {highImpactLowStock.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span>High Risk Products (Low Stock + High Tariff Impact)</span>
          </h4>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {highImpactLowStock.slice(0, 5).map((product) => (
              <div key={product.product_id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {product.name}
                  </h5>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {product.brand} • {product.category}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <div className="text-sm font-medium text-red-600">
                    Stock: {product.stock_level}
                  </div>
                  <div className="text-xs text-red-500">
                    +{product.percentage_increase.toFixed(1)}% cost
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {highImpactLowStock.length > 5 && (
            <div className="text-center mt-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                +{highImpactLowStock.length - 5} more high risk products
              </span>
            </div>
          )}
        </div>
      )}

      {data.length === 0 && (
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Stock Data</h3>
          <p className="text-gray-600 dark:text-gray-400">No stock information available for analysis.</p>
        </div>
      )}
    </div>
  );
};