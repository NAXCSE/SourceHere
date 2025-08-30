import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Filter, TrendingUp, Package, CheckCircle, XCircle, DollarSign, Globe } from 'lucide-react';
import { CSVDataService } from '../../services/csvDataService';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportData {
  totalProducts: number;
  tariffedProducts: number;
  totalRecommendations: number;
  approvedRecommendations: number;
  rejectedRecommendations: number;
  pendingRecommendations: number;
  totalCostSavings: number;
  averageDiversificationScore: number;
  topCategories: Array<{
    category: string;
    count: number;
    avgCostIncrease: number;
    totalSavings: number;
  }>;
  topSupplierCountries: Array<{
    country: string;
    productCount: number;
    avgTariffRate: number;
    totalImpact: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    approved: number;
    rejected: number;
    savings: number;
  }>;
  criticalProducts: Array<{
    name: string;
    category: string;
    tariffRate: number;
    costIncrease: number;
    stockLevel: number;
  }>;
}

export const ReportsPage: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30days');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    generateReport();
  }, [dateRange, selectedCategory]);

  const generateReport = async () => {
    setLoading(true);
    try {
      const products = await CSVDataService.loadProducts();
      const replacements = await CSVDataService.loadReplacements();
      
      // Get approved and rejected recommendations from localStorage
      const approvedRecommendations = JSON.parse(localStorage.getItem('approvedRecommendations') || '[]');
      const rejectedRecommendations = JSON.parse(localStorage.getItem('rejectedRecommendations') || '[]');
      
      // Filter by category if selected
      const filteredProducts = selectedCategory === 'all' 
        ? products 
        : products.filter(p => p.category === selectedCategory);

      const tariffedProducts = filteredProducts.filter(p => p.is_tariffed);
      
      // Calculate metrics
      const totalCostSavings = approvedRecommendations.reduce((sum: number, rec: any) => 
        sum + rec.alternatives.reduce((altSum: number, alt: any) => 
          altSum + (alt.costSavings * alt.allocationPercentage / 100), 0), 0);

      const avgDiversificationScore = approvedRecommendations.length > 0
        ? approvedRecommendations.reduce((sum: number, rec: any) => 
            sum + rec.alternatives.reduce((altSum: number, alt: any) => 
              altSum + (alt.diversificationScore * alt.allocationPercentage / 100), 0), 0) / approvedRecommendations.length
        : 0;

      // Category breakdown
      const categoryStats = filteredProducts.reduce((acc, product) => {
        const category = product.category;
        if (!acc[category]) {
          acc[category] = {
            count: 0,
            totalCostIncrease: 0,
            totalSavings: 0
          };
        }
        acc[category].count += 1;
        if (product.is_tariffed) {
          acc[category].totalCostIncrease += (product.pred_price_after || product.base_price) - product.base_price;
        }
        return acc;
      }, {} as Record<string, any>);

      // Add savings from approved recommendations
      approvedRecommendations.forEach((rec: any) => {
        if (categoryStats[rec.category]) {
          categoryStats[rec.category].totalSavings += rec.alternatives.reduce((sum: number, alt: any) => 
            sum + (alt.costSavings * alt.allocationPercentage / 100), 0);
        }
      });

      const topCategories = Object.entries(categoryStats)
        .map(([category, stats]: [string, any]) => ({
          category,
          count: stats.count,
          avgCostIncrease: stats.count > 0 ? stats.totalCostIncrease / stats.count : 0,
          totalSavings: stats.totalSavings
        }))
        .sort((a, b) => b.totalSavings - a.totalSavings)
        .slice(0, 5);

      // Supplier country analysis
      const countryStats = filteredProducts.reduce((acc, product) => {
        const country = product.supplier_country;
        if (!acc[country]) {
          acc[country] = {
            productCount: 0,
            totalTariffRate: 0,
            totalImpact: 0,
            tariffedCount: 0
          };
        }
        acc[country].productCount += 1;
        if (product.is_tariffed) {
          acc[country].totalTariffRate += product.tariff_rate || 0;
          acc[country].totalImpact += (product.pred_price_after || product.base_price) - product.base_price;
          acc[country].tariffedCount += 1;
        }
        return acc;
      }, {} as Record<string, any>);

      const topSupplierCountries = Object.entries(countryStats)
        .map(([country, stats]: [string, any]) => ({
          country,
          productCount: stats.productCount,
          avgTariffRate: stats.tariffedCount > 0 ? stats.totalTariffRate / stats.tariffedCount : 0,
          totalImpact: stats.totalImpact
        }))
        .sort((a, b) => b.totalImpact - a.totalImpact)
        .slice(0, 5);

      // Generate monthly trends (mock data for demonstration)
      const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
        const date = subDays(new Date(), i * 30);
        return {
          month: format(date, 'MMM yyyy'),
          approved: Math.floor(Math.random() * 20) + 5,
          rejected: Math.floor(Math.random() * 10) + 2,
          savings: Math.floor(Math.random() * 50000) + 10000
        };
      }).reverse();

      // Critical products (high tariff impact + low stock)
      const criticalProducts = tariffedProducts
        .filter(p => (p.tariff_rate || 0) > 25 && p.stock_level < 1000)
        .map(p => ({
          name: p.name,
          category: p.category,
          tariffRate: p.tariff_rate || 0,
          costIncrease: (p.pred_price_after || p.base_price) - p.base_price,
          stockLevel: p.stock_level
        }))
        .sort((a, b) => b.costIncrease - a.costIncrease)
        .slice(0, 10);

      const reportData: ReportData = {
        totalProducts: filteredProducts.length,
        tariffedProducts: tariffedProducts.length,
        totalRecommendations: approvedRecommendations.length + rejectedRecommendations.length,
        approvedRecommendations: approvedRecommendations.length,
        rejectedRecommendations: rejectedRecommendations.length,
        pendingRecommendations: Math.max(0, 25 - approvedRecommendations.length - rejectedRecommendations.length),
        totalCostSavings,
        averageDiversificationScore: Math.round(avgDiversificationScore),
        topCategories,
        topSupplierCountries,
        monthlyTrends,
        criticalProducts
      };

      setReportData(reportData);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    if (!reportData) return;
    
    setIsGeneratingPDF(true);
    try {
      const reportElement = document.getElementById('report-content');
      if (!reportElement) return;

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Add header
      pdf.setFontSize(20);
      pdf.setTextColor(59, 130, 246); // Blue color
      pdf.text('SourceHere - Supply Chain Report', 20, 25);
      
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated on: ${format(new Date(), 'MMMM dd, yyyy')}`, 20, 35);
      pdf.text(`Report Period: ${dateRange === '30days' ? 'Last 30 Days' : dateRange === '90days' ? 'Last 90 Days' : 'Last 12 Months'}`, 20, 42);
      pdf.text(`Category Filter: ${selectedCategory === 'all' ? 'All Categories' : selectedCategory}`, 20, 49);

      let yPosition = 65;

      // Executive Summary
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Executive Summary', 20, yPosition);
      yPosition += 15;

      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      
      const summaryData = [
        `Total Products Analyzed: ${reportData.totalProducts}`,
        `Products Under Tariff: ${reportData.tariffedProducts} (${((reportData.tariffedProducts / reportData.totalProducts) * 100).toFixed(1)}%)`,
        `Total Recommendations: ${reportData.totalRecommendations}`,
        `Approved Recommendations: ${reportData.approvedRecommendations}`,
        `Rejected Recommendations: ${reportData.rejectedRecommendations}`,
        `Pending Recommendations: ${reportData.pendingRecommendations}`,
        `Total Cost Savings: $${reportData.totalCostSavings.toLocaleString()}`,
        `Average Diversification Score: ${reportData.averageDiversificationScore}%`
      ];

      summaryData.forEach(line => {
        pdf.text(line, 25, yPosition);
        yPosition += 6;
      });

      yPosition += 10;

      // Top Categories
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = 25;
      }

      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Top Categories by Impact', 20, yPosition);
      yPosition += 15;

      pdf.setFontSize(9);
      pdf.setTextColor(60, 60, 60);
      
      reportData.topCategories.forEach((category, index) => {
        pdf.text(`${index + 1}. ${category.category}`, 25, yPosition);
        pdf.text(`Products: ${category.count}`, 80, yPosition);
        pdf.text(`Avg Cost Increase: $${category.avgCostIncrease.toFixed(2)}`, 120, yPosition);
        pdf.text(`Total Savings: $${category.totalSavings.toFixed(2)}`, 160, yPosition);
        yPosition += 8;
      });

      yPosition += 10;

      // Top Supplier Countries
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = 25;
      }

      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Top Supplier Countries by Impact', 20, yPosition);
      yPosition += 15;

      pdf.setFontSize(9);
      pdf.setTextColor(60, 60, 60);
      
      reportData.topSupplierCountries.forEach((country, index) => {
        pdf.text(`${index + 1}. ${country.country}`, 25, yPosition);
        pdf.text(`Products: ${country.productCount}`, 60, yPosition);
        pdf.text(`Avg Tariff: ${country.avgTariffRate.toFixed(1)}%`, 100, yPosition);
        pdf.text(`Total Impact: $${country.totalImpact.toFixed(2)}`, 140, yPosition);
        yPosition += 8;
      });

      yPosition += 10;

      // Critical Products
      if (reportData.criticalProducts.length > 0) {
        if (yPosition > pageHeight - 80) {
          pdf.addPage();
          yPosition = 25;
        }

        pdf.setFontSize(14);
        pdf.setTextColor(220, 38, 38); // Red color for critical
        pdf.text('Critical Products (High Tariff + Low Stock)', 20, yPosition);
        yPosition += 15;

        pdf.setFontSize(8);
        pdf.setTextColor(60, 60, 60);
        
        reportData.criticalProducts.slice(0, 10).forEach((product, index) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 25;
          }
          
          pdf.text(`${index + 1}. ${product.name.substring(0, 40)}`, 25, yPosition);
          pdf.text(`${product.category}`, 25, yPosition + 4);
          pdf.text(`Tariff: ${product.tariffRate.toFixed(1)}%`, 120, yPosition);
          pdf.text(`Stock: ${product.stockLevel}`, 120, yPosition + 4);
          pdf.text(`Impact: $${product.costIncrease.toFixed(2)}`, 160, yPosition);
          yPosition += 12;
        });
      }

      // Add footer
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
        pdf.text('SourceHere - Confidential Report', 20, pageHeight - 10);
      }

      // Save the PDF
      const fileName = `SourceHere_Report_${format(new Date(), 'yyyy-MM-dd')}_${selectedCategory !== 'all' ? selectedCategory : 'All'}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-1/2"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Failed to Load Report</h3>
        <p className="text-gray-600 dark:text-gray-400">Unable to generate report data. Please try again.</p>
      </div>
    );
  }

  const categories = ['all', 'Babycare', 'Bedding and Linens', 'Cleaning Supplies', 'Fitness Accessories', 'Health Care', 'Kitchenware', 'Laundry Supplies', 'Personal Care', 'Pet Supplies', "Women's Clothing"];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Supply Chain Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive analysis and downloadable reports of your sourcing performance
          </p>
        </div>
        
        <div className="mt-4 lg:mt-0 flex flex-col sm:flex-row gap-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="12months">Last 12 Months</option>
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
          
          <button
            onClick={generatePDF}
            disabled={isGeneratingPDF}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>{isGeneratingPDF ? 'Generating...' : 'Download PDF'}</span>
          </button>
        </div>
      </div>

      {/* Report Content */}
      <div id="report-content" className="space-y-8">
        {/* Executive Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>Executive Summary</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {reportData.totalProducts}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Products</div>
            </div>
            
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                {reportData.tariffedProducts}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Under Tariff</div>
              <div className="text-xs text-red-500 mt-1">
                {((reportData.tariffedProducts / reportData.totalProducts) * 100).toFixed(1)}% of total
              </div>
            </div>
            
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                ${(reportData.totalCostSavings / 1000).toFixed(0)}K
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Cost Savings</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {reportData.averageDiversificationScore}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Avg Diversification</div>
            </div>
          </div>
        </div>

        {/* Recommendation Status Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Recommendation Status Overview
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{reportData.approvedRecommendations}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Approved</div>
                <div className="text-xs text-green-600 mt-1">
                  {reportData.totalRecommendations > 0 ? ((reportData.approvedRecommendations / reportData.totalRecommendations) * 100).toFixed(1) : 0}% approval rate
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <XCircle className="h-8 w-8 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">{reportData.rejectedRecommendations}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Rejected</div>
                <div className="text-xs text-red-600 mt-1">
                  {reportData.totalRecommendations > 0 ? ((reportData.rejectedRecommendations / reportData.totalRecommendations) * 100).toFixed(1) : 0}% rejection rate
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <Package className="h-8 w-8 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">{reportData.pendingRecommendations}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
                <div className="text-xs text-yellow-600 mt-1">
                  Awaiting review
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Top Categories by Impact
          </h2>
          
          <div className="space-y-4">
            {reportData.topCategories.map((category, index) => (
              <div key={category.category} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">#{index + 1}</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{category.category}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{category.count} products</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">${category.totalSavings.toFixed(2)}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total Savings</div>
                  <div className="text-xs text-red-500">
                    Avg Impact: ${category.avgCostIncrease.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Supplier Country Analysis */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Supplier Country Analysis
          </h2>
          
          <div className="space-y-4">
            {reportData.topSupplierCountries.map((country, index) => (
              <div key={country.country} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                    <Globe className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{country.country}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{country.productCount} products</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-red-600">{country.avgTariffRate.toFixed(1)}%</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Avg Tariff Rate</div>
                  <div className="text-xs text-red-500">
                    Total Impact: ${country.totalImpact.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Monthly Performance Trends
          </h2>
          
          <div className="space-y-4">
            {reportData.monthlyTrends.map((month, index) => {
              const totalActions = month.approved + month.rejected;
              const approvalRate = totalActions > 0 ? (month.approved / totalActions) * 100 : 0;
              
              return (
                <div key={month.month} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{month.month}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {month.approved} approved, {month.rejected} rejected
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">${(month.savings / 1000).toFixed(0)}K</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Savings</div>
                    <div className="text-xs text-blue-600">
                      {approvalRate.toFixed(1)}% approval rate
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Critical Products Alert */}
        {reportData.criticalProducts.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-6 flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Critical Products Alert</span>
            </h2>
            
            <p className="text-red-700 dark:text-red-300 mb-4">
              The following products have high tariff rates (>25%) and low stock levels (<1000 units), requiring immediate attention:
            </p>
            
            <div className="space-y-3">
              {reportData.criticalProducts.slice(0, 5).map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded border border-red-200 dark:border-red-700">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white truncate">{product.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{product.category}</p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm font-bold text-red-600">
                      {product.tariffRate.toFixed(1)}% tariff
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Stock: {product.stockLevel} | Impact: ${product.costIncrease.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
              
              {reportData.criticalProducts.length > 5 && (
                <div className="text-center text-sm text-red-600 dark:text-red-400">
                  +{reportData.criticalProducts.length - 5} more critical products
                </div>
              )}
            </div>
          </div>
        )}

        {/* Key Performance Indicators */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Key Performance Indicators
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-white">Operational Metrics</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-gray-600 dark:text-gray-400">Recommendation Efficiency</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {reportData.totalRecommendations > 0 ? ((reportData.approvedRecommendations / reportData.totalRecommendations) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-gray-600 dark:text-gray-400">Products Requiring Action</span>
                  <span className="font-bold text-red-600">
                    {reportData.pendingRecommendations}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-gray-600 dark:text-gray-400">Tariff Exposure</span>
                  <span className="font-bold text-orange-600">
                    {((reportData.tariffedProducts / reportData.totalProducts) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 dark:text-white">Financial Impact</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-gray-600 dark:text-gray-400">Total Cost Savings</span>
                  <span className="font-bold text-green-600">
                    ${reportData.totalCostSavings.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-gray-600 dark:text-gray-400">Avg Savings per Approval</span>
                  <span className="font-bold text-green-600">
                    ${reportData.approvedRecommendations > 0 ? (reportData.totalCostSavings / reportData.approvedRecommendations).toFixed(2) : '0.00'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-gray-600 dark:text-gray-400">Risk Mitigation Score</span>
                  <span className="font-bold text-blue-600">
                    {reportData.averageDiversificationScore}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Report Footer */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Globe className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">SourceHere</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Report generated on {format(new Date(), 'MMMM dd, yyyy')} at {format(new Date(), 'HH:mm')}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            This report contains confidential business information. Distribution should be limited to authorized personnel.
          </p>
        </div>
      </div>
    </div>
  );
};