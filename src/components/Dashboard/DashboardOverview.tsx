import React, { useEffect, useState } from 'react';
import { MetricsCard } from './MetricsCard';
import { DashboardMetrics } from '../../types';
import { apiService } from '../../services/api';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  Globe,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export const DashboardOverview: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      // Using mock data for demonstration
      const mockMetrics: DashboardMetrics = {
        totalRecommendations: 100,
        pendingApprovals: 25,
        approvedToday: 8,
        rejectedToday: 2,
        totalCostSavings: 320000,
        supplierDiversification: 92,
        averageProcessingTime: 1.8
      };
      
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Dashboard Overview</h2>
        <p className="text-gray-600 dark:text-gray-400">Monitor your product recommendation and approval workflow performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricsCard
          title="Total Recommendations"
          value={metrics.totalRecommendations}
          icon={Package}
          change="+18% from last month"
          changeType="positive"
          color="blue"
        />
        
        <MetricsCard
          title="Pending Approvals"
          value={metrics.pendingApprovals}
          icon={Clock}
          change="High priority items"
          changeType="neutral"
          color="yellow"
        />
        
        <MetricsCard
          title="Approved Today"
          value={metrics.approvedToday}
          icon={CheckCircle}
          change="+3 from yesterday"
          changeType="positive"
          color="green"
        />
        
        <MetricsCard
          title="Rejected Today"
          value={metrics.rejectedToday}
          icon={XCircle}
          change="-1 from yesterday"
          changeType="positive"
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { action: 'Approved 4 Babycare alternatives', time: '5 minutes ago', type: 'approved' },
              { action: 'Requested more options for Kitchenware', time: '20 minutes ago', type: 'request' },
              { action: 'Rejected Personal Care recommendation', time: '45 minutes ago', type: 'rejected' },
              { action: 'Bulk approved 6 Cleaning Supplies items', time: '1 hour ago', type: 'approved' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'approved' ? 'bg-green-400' : 
                  activity.type === 'rejected' ? 'bg-red-400' : 'bg-yellow-400'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.action}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category Breakdown</h3>
          <div className="space-y-3">
            {[
              { category: 'Babycare', pending: 8, approved: 15, color: 'bg-blue-500' },
              { category: 'Kitchenware', pending: 6, approved: 12, color: 'bg-green-500' },
              { category: 'Personal Care', pending: 4, approved: 18, color: 'bg-purple-500' },
              { category: 'Cleaning Supplies', pending: 3, approved: 10, color: 'bg-yellow-500' },
              { category: 'Women\'s Clothing', pending: 2, approved: 7, color: 'bg-pink-500' },
              { category: 'Pet Supplies', pending: 2, approved: 9, color: 'bg-orange-500' },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{item.category}</span>
                </div>
                <div className="flex space-x-4 text-sm">
                  <span className="text-yellow-600">{item.pending} pending</span>
                  <span className="text-green-600">{item.approved} approved</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};