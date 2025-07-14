import React, { useState, useEffect } from 'react';
import { TariffChart } from './TariffChart';
import { CostComparisonChart } from './CostComparisonChart';
import { MostAffectedProducts } from './MostAffectedProducts';
import { CountrySelector } from './CountrySelector';
import { CategoryBreakdown } from './CategoryBreakdown';
import { TariffTrendsChart } from './TariffTrendsChart';
import { StockImpactAnalysis } from './StockImpactAnalysis';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, Globe, Package, Calendar, BarChart3 } from 'lucide-react';
import { CSVDataService } from '../../services/csvDataService';

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

interface AnalyticsMetrics {
  totalProductsAffected: number;
  averageCostIncrease: number;
  totalAdditionalCosts: number;
  mostAffectedCountry: string;
  averageStockLevel: number;
  criticalStockProducts: number;
  totalHSCodes: number;
  activeTariffs: number;
}

export const AnalyticsPage: React.FC = () => {
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['CN', 'VN', 'IN']);
  const [timeRange, setTimeRange] = useState('6months');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [tariffData, setTariffData] = useState<TariffData[]>([]);
  const [productCostData, setProductCostData] = useState<ProductCostData[]>([]);
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const countries = [
    { code: 'CN', name: 'China' },
    { code: 'VN', name: 'Vietnam' },
    { code: 'BD', name: 'Bangladesh' },
    { code: 'IN', name: 'India' },
    { code: 'MX', name: 'Mexico' },
    { code: 'TH', name: 'Thailand' },
    { code: 'ID', name: 'Indonesia' },
    { code: 'TW', name: 'Taiwan' },
    { code: 'PK', name: 'Pakistan' },
    { code: 'KR', name: 'South Korea' },
    { code: 'MY', name: 'Malaysia' }
  ];

  const categories = [
    'all', 'Electronics', 'Baby Care', 'Apparel', 'Home & Garden', 
    'Food & Beverage', 'Sports & Recreation', 'Automotive', 'Health & Beauty'
  ];

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedCountries, timeRange, selectedCategory]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Load data from CSV files
      const products = await CSVDataService.loadProducts();
      const tariffs = await CSVDataService.loadTariffs();
      
      // Transform tariff data for analytics
      const mockTariffData: TariffData[] = tariffs.map(tariff => {
        const product = products.find(p => p.product_id === tariff.product_id);
        const countryMap: Record<string, string> = {
          'China': 'CN', 'Vietnam': 'VN', 'Bangladesh': 'BD', 'India': 'IN',
          'Mexico': 'MX', 'Thailand': 'TH', 'Indonesia': 'ID', 'Taiwan': 'TW',
          'Pakistan': 'PK', 'South Korea': 'KR', 'Malaysia': 'MY'
        };
        
        return {
          category: tariff.category,
          hs_code: tariff.hs_code,
          country: tariff.supplier_country,
          countryCode: countryMap[tariff.supplier_country] || 'XX',
          tariff_rate: tariff.tariff_rate,
          previous_rate: Math.max(0, tariff.tariff_rate - Math.random() * 10),
          effective_date: tariff.effective_date,
          affected_products: Math.floor(Math.random() * 100) + 20,
          change: tariff.tariff_rate - Math.max(0, tariff.tariff_rate - Math.random() * 10)
        };
      });

      // Transform product data for analytics
      const mockProductData: ProductCostData[] = products
        .filter(p => p.is_tariffed)
        .map(product => ({
          product_id: product.product_id,
          name: product.name,
          brand: product.brand,
          category: product.category,
          sub_category: product.sub_category,
          supplier_country: product.supplier_country,
          hs_code: product.hs_code,
          base_price: product.base_price,
          current_price: product.pred_price_after || product.base_price,
          cost_increase: (product.pred_price_after || product.base_price) - product.base_price,
          percentage_increase: ((product.pred_price_after || product.base_price) - product.base_price) / product.base_price * 100,
          tariff_impact: (product.pred_price_after || product.base_price) - product.base_price,
          stock_level: product.stock_level,
          rating: product.rating,
          is_tariffed: product.is_tariffed,
          tariff_start_date: product.tariff_start_date || '',
          tariff_end_date: product.tariff_end_date
        }));

      const mockMetrics: AnalyticsMetrics = {
        totalProductsAffected: mockProductData.length,
        averageCostIncrease: mockProductData.length > 0 
          ? mockProductData.reduce((sum, p) => sum + p.percentage_increase, 0) / mockProductData.length 
          : 0,
        totalAdditionalCosts: mockProductData.reduce((sum, p) => sum + p.cost_increase, 0),
        mostAffectedCountry: 'China',
        averageStockLevel: mockProductData.length > 0 
          ? mockProductData.reduce((sum, p) => sum + p.stock_level, 0) / mockProductData.length 
          : 0,
        criticalStockProducts: mockProductData.filter(p => p.stock_level < 100).length,
        totalHSCodes: new Set(mockProductData.map(p => p.hs_code)).size,
        activeTariffs: mockTariffData.length
      };

      // Filter data based on selections
      let filteredTariffData = mockTariffData.filter(item => 
        selectedCountries.includes(item.countryCode)
      );

      let filteredProductData = mockProductData;

      if (selectedCategory !== 'all') {
        filteredTariffData = filteredTariffData.filter(item => 
          item.category === selectedCategory
        );
        filteredProductData = filteredProductData.filter(item => 
          item.category === selectedCategory
        );
      }

      setTariffData(filteredTariffData);
      setProductCostData(filteredProductData);
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCountryChange = (countryCodes: string[]) => {
    setSelectedCountries(countryCodes);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Tariff Impact Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive analysis of tariff changes and their impact on product costs, inventory, and sourcing
          </p>
        </div>
        
        <div className="mt-4 lg:mt-0 flex flex-col sm:flex-row gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
            <option value="2years">Last 2 Years</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
          
          <CountrySelector
            countries={countries}
            selectedCountries={selectedCountries}
            onChange={handleCountryChange}
          />
        </div>
      </div>

      {/* Enhanced Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Products Affected
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {metrics.totalProductsAffected}
                </p>
                <p className="text-sm text-red-600 mt-2">
                  +15% from last period
                </p>
              </div>
              <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900">
                <Package className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Avg Cost Increase
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {metrics.averageCostIncrease}%
                </p>
                <p className="text-sm text-red-600 mt-2">
                  +3.2% from last period
                </p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                <TrendingUp className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Additional Costs
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  ${(metrics.totalAdditionalCosts / 1000).toFixed(0)}K
                </p>
                <p className="text-sm text-red-600 mt-2">
                  +${(metrics.totalAdditionalCosts * 0.12 / 1000).toFixed(0)}K this month
                </p>
              </div>
              <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900">
                <DollarSign className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Active Tariffs
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {metrics.activeTariffs}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {metrics.totalHSCodes} HS Codes affected
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900">
                <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TariffChart data={tariffData} />
        <CostComparisonChart data={productCostData} />
      </div>

      {/* Additional Analytics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryBreakdown data={productCostData} />
        <StockImpactAnalysis data={productCostData} />
      </div>

      {/* Most Affected Products */}
      <MostAffectedProducts data={productCostData} />
    </div>
  );
};