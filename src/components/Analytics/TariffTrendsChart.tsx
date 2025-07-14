import React from 'react';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';

interface TariffTrendData {
  date: string;
  country: string;
  hs_code: string;
  category: string;
  tariff_rate: number;
  affected_products: number;
}

interface TariffTrendsChartProps {
  data: TariffTrendData[];
}

export const TariffTrendsChart: React.FC<TariffTrendsChartProps> = ({ data }) => {
  // Group data by month for trend analysis
  const monthlyData = data.reduce((acc, item) => {
    const month = new Date(item.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (!acc[month]) {
      acc[month] = {
        totalRate: 0,
        count: 0,
        affectedProducts: 0
      };
    }
    acc[month].totalRate += item.tariff_rate;
    acc[month].count += 1;
    acc[month].affectedProducts += item.affected_products;
    return acc;
  }, {} as Record<string, any>);

  const trendData = Object.entries(monthlyData).map(([month, data]) => ({
    month,
    avgRate: data.totalRate / data.count,
    affectedProducts: data.affectedProducts
  })).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  const maxRate = Math.max(...trendData.map(d => d.avgRate));
  const maxProducts = Math.max(...trendData.map(d => d.affectedProducts));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Tariff Rate Trends Over Time
        </h3>
        <Calendar className="h-5 w-5 text-gray-400" />
      </div>

      <div className="space-y-4">
        {trendData.map((item, index) => {
          const rateHeight = (item.avgRate / maxRate) * 100;
          const productHeight = (item.affectedProducts / maxProducts) * 100;
          const prevItem = trendData[index - 1];
          const rateChange = prevItem ? item.avgRate - prevItem.avgRate : 0;
          const isIncrease = rateChange > 0;

          return (
            <div key={item.month} className="flex items-end space-x-4">
              <div className="w-16 text-sm font-medium text-gray-700 dark:text-gray-300">
                {item.month}
              </div>
              
              <div className="flex-1 flex items-end space-x-2 h-16">
                {/* Average Rate Bar */}
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-t relative">
                  <div
                    className="bg-blue-500 rounded-t transition-all duration-500"
                    style={{ height: `${rateHeight}%` }}
                  ></div>
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 dark:text-gray-400">
                    {item.avgRate.toFixed(1)}%
                  </div>
                </div>

                {/* Affected Products Bar */}
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-t relative">
                  <div
                    className="bg-red-500 rounded-t transition-all duration-500"
                    style={{ height: `${productHeight}%` }}
                  ></div>
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 dark:text-gray-400">
                    {item.affectedProducts}
                  </div>
                </div>
              </div>

              <div className="w-16 text-right">
                {index > 0 && (
                  <div className={`flex items-center justify-end space-x-1 text-xs font-medium ${
                    isIncrease ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {isIncrease ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span>{Math.abs(rateChange).toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Avg Tariff Rate</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Affected Products</span>
            </div>
          </div>
        </div>
      </div>

      {trendData.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Trend Data</h3>
          <p className="text-gray-600 dark:text-gray-400">No historical tariff data available for trend analysis.</p>
        </div>
      )}
    </div>
  );
};