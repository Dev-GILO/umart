'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Header } from '@/components/header';
import { ProductCard } from '@/components/marketplace/product-card';
import { CategorySidebar } from '@/components/marketplace/category-sidebar';
import { ProductFilters } from '@/components/marketplace/product-filters';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import Loading from './loading';

function BrowseContent() {
  const [sortBy, setSortBy] = useState('featured');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  const searchParams = useSearchParams();
  
  const { products, loading, error } = useProducts();

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  // Filter and sort products on the client side
  const filteredProducts = products
    ? products
        .filter((product: any) => {
          // Category filter
          if (selectedCategory !== 'all' && product.categoryId !== selectedCategory) {
            return false;
          }
          
          // Search filter
          if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
          }
          
          // Price filter
          if (product.price < minPrice || product.price > maxPrice) {
            return false;
          }
          
          return true;
        })
        .sort((a: any, b: any) => {
          switch (sortBy) {
            case 'newest':
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            case 'price-low':
              return a.price - b.price;
            case 'price-high':
              return b.price - a.price;
            case 'rating':
              return (b.rating || 0) - (a.rating || 0);
            default: // featured
              return 0;
          }
        })
    : [];

  return (
    <>
      <Header />
      <main className="bg-background min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Search and Sort Bar */}
          <div className="mb-8 space-y-4">
            <h1 className="text-3xl font-bold text-foreground">Browse Products</h1>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="md:col-span-1 space-y-6">
              <CategorySidebar 
                activeCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
              />
              <ProductFilters 
                minPrice={minPrice}
                maxPrice={maxPrice}
                onMinPriceChange={setMinPrice}
                onMaxPriceChange={setMaxPrice}
              />
            </div>

            {/* Products Grid */}
            <div className="md:col-span-3">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <p className="text-muted-foreground">Loading products...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <p className="text-red-600">{error}</p>
                  </div>
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product: any) => (
                    <ProductCard key={product.id} {...product} />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <p className="text-muted-foreground text-lg mb-4">
                      No products found matching your search
                    </p>
                    <Button asChild variant="outline">
                      <a href="/browse">Clear Filters</a>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<Loading />}>
      <BrowseContent />
    </Suspense>
  );
}