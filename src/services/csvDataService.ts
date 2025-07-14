import { Product, Replacement } from '../types';

// CSV data parsing utilities
export class CSVDataService {
  private static parseCSV(csvText: string): any[] {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const obj: any = {};
      
      headers.forEach((header, index) => {
        const value = values[index]?.trim();
        
        // Parse different data types
        if (value === 'true' || value === 'false') {
          obj[header] = value === 'true';
        } else if (!isNaN(Number(value)) && value !== '') {
          obj[header] = Number(value);
        } else {
          obj[header] = value || null;
        }
      });
      
      return obj;
    });
  }

  static async loadProducts(): Promise<Product[]> {
    try {
      const response = await fetch('/src/data/products.csv');
      const csvText = await response.text();
      const rawData = this.parseCSV(csvText);
      
      return rawData.map(item => ({
        id: item.product_id,
        product_id: item.product_id,
        name: item.name,
        description: `${item.brand} ${item.name} - ${item.sub_category}`,
        base_price: item.base_price,
        price: item.base_price,
        category: item.category,
        sub_category: item.sub_category,
        brand: item.brand,
        supplier: item.brand,
        supplier_country: item.supplier_country,
        supplierCountry: item.supplier_country,
        image: undefined,
        hs_code: item.hs_code,
        is_tariffed: item.is_tariffed,
        stock_level: item.stock_level,
        rating: item.rating,
        tariff_start_date: item.tariff_start_date,
        tariff_end_date: item.tariff_end_date,
        tariff_rate: item.tariff_rate,
        delta_cat: item.delta_cat,
        current_price: item.pred_price_after,
        pred_price_after: item.pred_price_after,
        allocationPercentage: 20,
        diversificationScore: Math.floor(Math.random() * 40) + 60, // 60-100%
        costSavings: item.is_tariffed ? Math.max(0, item.pred_price_after - item.base_price) : 0,
        qualityRating: item.rating,
        tariffImpact: item.is_tariffed ? (item.pred_price_after - item.base_price) : 0
      }));
    } catch (error) {
      console.error('Error loading products CSV:', error);
      return [];
    }
  }

  static async loadReplacements(): Promise<any[]> {
    try {
      const response = await fetch('/src/data/replacements.csv');
      const csvText = await response.text();
      return this.parseCSV(csvText);
    } catch (error) {
      console.error('Error loading replacements CSV:', error);
      return [];
    }
  }

  static async loadTariffs(): Promise<any[]> {
    try {
      const response = await fetch('/src/data/tariff.csv');
      const csvText = await response.text();
      return this.parseCSV(csvText);
    } catch (error) {
      console.error('Error loading tariffs CSV:', error);
      return [];
    }
  }

  static async generateRecommendations(): Promise<any[]> {
    const products = await this.loadProducts();
    const replacements = await this.loadReplacements();
    
    // Group replacements by original product
    const replacementsByOriginal = replacements.reduce((acc, replacement) => {
      const originalId = replacement.original_product_id;
      if (!acc[originalId]) {
        acc[originalId] = [];
      }
      acc[originalId].push(replacement);
      return acc;
    }, {} as Record<string, any[]>);

    // Generate recommendations for tariffed products
    const tariffedProducts = products.filter(p => p.is_tariffed);
    
    return tariffedProducts.map(originalProduct => {
      const productReplacements = replacementsByOriginal[originalProduct.product_id] || [];
      
      // Find alternative products based on replacement data
      const alternatives = productReplacements.map(replacement => {
        // Create alternative product from replacement data
        const altProduct = {
          id: replacement.replacement_id,
          product_id: replacement.replacement_id,
          name: replacement.name,
          description: `${replacement.brand} ${replacement.name} - ${replacement.category}`,
          base_price: replacement.price,
          price: replacement.price,
          category: replacement.category,
          sub_category: replacement.category,
          brand: replacement.brand,
          supplier: replacement.brand,
          supplier_country: 'US', // Default for alternatives
          supplierCountry: 'US',
          image: undefined,
          hs_code: originalProduct.hs_code,
          is_tariffed: false,
          stock_level: replacement.stock_level,
          rating: replacement.brand_popularity / 2, // Convert to 5-star scale
          tariff_start_date: null,
          tariff_end_date: null,
          tariff_rate: 0,
          delta_cat: 0,
          current_price: replacement.price,
          pred_price_after: replacement.price,
          allocationPercentage: 20, // Equal distribution
          diversificationScore: this.calculateDiversificationScore(originalProduct, replacement),
          costSavings: this.calculateCostSavings(originalProduct, replacement),
          qualityRating: replacement.brand_popularity / 2,
          tariffImpact: 0,
          reason_code: replacement.reason_code,
          brand_popularity: replacement.brand_popularity
        };

        return altProduct;
      }).filter(Boolean);

      // Calculate equal allocation
      const totalProducts = 1 + alternatives.length;
      const equalPercentage = Math.floor(100 / totalProducts);
      const remainder = 100 - (equalPercentage * totalProducts);

      return {
        id: `rec-${originalProduct.product_id}`,
        originalProduct: {
          ...originalProduct,
          allocationPercentage: equalPercentage + remainder
        },
        alternatives: alternatives.map(alt => ({
          ...alt,
          allocationPercentage: equalPercentage
        })),
        status: 'pending',
        createdAt: new Date().toISOString(),
        category: originalProduct.category,
        priority: this.calculatePriority(originalProduct)
      };
    });
  }

  private static calculateDiversificationScore(original: Product, replacement: any): number {
    let score = 60; // Base score
    
    // Different country adds points (alternatives are from US)
    if (original.supplier_country !== 'US') {
      score += 20;
    }
    
    // Different brand adds points
    if (original.brand !== replacement.brand) {
      score += 10;
    }
    
    // No tariff adds points
    score += 10;
    
    return Math.min(100, score);
  }

  private static calculateCostSavings(original: Product, replacement: any): number {
    const originalFinalPrice = original.pred_price_after || original.base_price;
    const alternativeFinalPrice = replacement.price;
    return Math.max(0, originalFinalPrice - alternativeFinalPrice);
  }

  private static calculatePriority(product: Product): 'high' | 'medium' | 'low' {
    const tariffImpact = product.tariffImpact || 0;
    const stockLevel = product.stock_level || 0;
    
    if (tariffImpact > 50 || stockLevel < 1000) return 'high';
    if (tariffImpact > 20 || stockLevel < 3000) return 'medium';
    return 'low';
  }
}