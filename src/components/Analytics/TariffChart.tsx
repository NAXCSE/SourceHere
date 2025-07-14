import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TariffData {
  category: string;
  hs_code: string;
  country: string;
  countryCode: string;
  tariff_rate: number;
  previous_rate: number;
  effective_date: string;
  affected_products: number;
  change: number;
}

interface TariffChartProps {
  data: TariffData[];
}

export const TariffChart: React.FC<TariffChartProps> = ({ data }) => {
  const maxRate = Math.max(...data.map(item => Math.max(item.tariff_rate, item.previous_rate)));
  const chartHeight = 300;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Tariff Rates by Country
        </h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Previous Rate</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Current Rate</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {data.map((item, index) => {
          const previousHeight = (item.previous_rate / maxRate) * chartHeight;
          const currentHeight = (item.tariff_rate / maxRate) * chartHeight;
          const isIncrease = item.change > 0;

          return (
            <div key={item.countryCode} className="flex items-end space-x-3">
              <div className="w-16 text-sm font-medium text-gray-700 dark:text-gray-300">
                {item.countryCode}
              </div>
              
              <div className="flex-1 flex items-end space-x-2 h-16">
                {/* Previous Rate Bar */}
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-t relative">
                  <div
                    className="bg-blue-500 rounded-t transition-all duration-500"
                    style={{ height: `${(previousHeight / chartHeight) * 100}%` }}
                  ></div>
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 dark:text-gray-400">
                    {item.previous_rate}%
                  </div>
                </div>

                {/* Current Rate Bar */}
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-t relative">
                  <div
                    className="bg-red-500 rounded-t transition-all duration-500"
                    style={{ height: `${(currentHeight / chartHeight) * 100}%` }}
                  ></div>
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 dark:text-gray-400">
                    {item.tariff_rate}%
                  </div>
                </div>
              </div>

              <div className="w-20 text-right">
                <div className={`flex items-center justify-end space-x-1 text-sm font-medium ${
                  isIncrease ? 'text-red-600' : 'text-green-600'
                }`}>
                  {isIncrease ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{isIncrease ? '+' : ''}{item.change}%</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {item.country}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {item.affected_products} products
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {data.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <TrendingUp className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Data Available</h3>
          <p className="text-gray-600 dark:text-gray-400">Select countries to view tariff rate comparisons.</p>
        </div>
      )}
    </div>
  );
};