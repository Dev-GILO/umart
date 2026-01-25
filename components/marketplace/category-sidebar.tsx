'use client';

import React from "react"
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Smartphone,
  Laptop,
  Watch,
  Gamepad2,
  Headphones,
  Camera,
  ShoppingBag,
  Package,
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  count: number;
}

interface CategorySidebarProps {
  activeCategory?: string;
  onCategoryChange?: (categoryId: string) => void;
}

const categories: Category[] = [
  {
    id: 'all',
    name: 'All Products',
    icon: <Package className="h-4 w-4" />,
    count: 1250,
  },
  {
    id: 'electronics',
    name: 'Electronics',
    icon: <Smartphone className="h-4 w-4" />,
    count: 350,
  },
  {
    id: 'computers',
    name: 'Computers & Laptops',
    icon: <Laptop className="h-4 w-4" />,
    count: 180,
  },
  {
    id: 'wearables',
    name: 'Wearables',
    icon: <Watch className="h-4 w-4" />,
    count: 95,
  },
  {
    id: 'gaming',
    name: 'Gaming',
    icon: <Gamepad2 className="h-4 w-4" />,
    count: 120,
  },
  {
    id: 'audio',
    name: 'Audio & Headphones',
    icon: <Headphones className="h-4 w-4" />,
    count: 210,
  },
  {
    id: 'cameras',
    name: 'Cameras & Photography',
    icon: <Camera className="h-4 w-4" />,
    count: 85,
  },
  {
    id: 'accessories',
    name: 'Accessories',
    icon: <ShoppingBag className="h-4 w-4" />,
    count: 210,
  },
];

export function CategorySidebar({ 
  activeCategory = 'all',
  onCategoryChange 
}: CategorySidebarProps) {
  const handleCategoryClick = (categoryId: string) => {
    if (onCategoryChange) {
      onCategoryChange(categoryId);
    }
  };

  return (
    <Card className="p-6 h-fit">
      <h2 className="font-bold text-lg text-foreground mb-4">Categories</h2>
      <div className="space-y-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
              activeCategory === category.id
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-secondary'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={activeCategory === category.id ? 'text-primary-foreground' : 'text-muted-foreground'}>
                {category.icon}
              </span>
              <span className="font-medium text-sm">{category.name}</span>
            </div>
            <Badge
              variant={activeCategory === category.id ? 'default' : 'secondary'}
              className="ml-auto"
            >
              {category.count}
            </Badge>
          </button>
        ))}
      </div>
    </Card>
  );
}