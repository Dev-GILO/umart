'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown } from 'lucide-react';

interface ProductFiltersProps {
  minPrice?: number;
  maxPrice?: number;
  onMinPriceChange?: (value: number) => void;
  onMaxPriceChange?: (value: number) => void;
}

export function ProductFilters({
  minPrice = 0,
  maxPrice = 5000,
  onMinPriceChange,
  onMaxPriceChange,
}: ProductFiltersProps) {
  const [priceRange, setPriceRange] = useState([minPrice, maxPrice]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const handleConditionToggle = (condition: string) => {
    setConditions((prev) =>
      prev.includes(condition)
        ? prev.filter((c) => c !== condition)
        : [...prev, condition]
    );
  };

  const handlePriceChange = (values: number[]) => {
    setPriceRange(values);
    if (onMinPriceChange) onMinPriceChange(values[0]);
    if (onMaxPriceChange) onMaxPriceChange(values[1]);
  };

  const handleMinPriceInput = (value: number) => {
    const newRange = [value, priceRange[1]];
    setPriceRange(newRange);
    if (onMinPriceChange) onMinPriceChange(value);
  };

  const handleMaxPriceInput = (value: number) => {
    const newRange = [priceRange[0], value];
    setPriceRange(newRange);
    if (onMaxPriceChange) onMaxPriceChange(value);
  };

  return (
    <Card className="p-6 h-fit">
      <h2 className="font-bold text-lg text-foreground mb-4">Filters</h2>

      <div className="space-y-6">
        {/* Price Range */}
        <div>
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            Price Range
            <ChevronDown className="h-4 w-4" />
          </h3>
          <Slider
            defaultValue={[minPrice, maxPrice]}
            max={10000}
            step={50}
            value={priceRange}
            onValueChange={handlePriceChange}
            className="w-full"
          />
          <div className="flex gap-2 mt-3">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Min</label>
              <Input 
                type="number" 
                value={priceRange[0]} 
                onChange={(e) => handleMinPriceInput(Number(e.target.value))}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Max</label>
              <Input 
                type="number" 
                value={priceRange[1]} 
                onChange={(e) => handleMaxPriceInput(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Condition */}
        <div>
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            Condition
            <ChevronDown className="h-4 w-4" />
          </h3>
          <div className="space-y-2">
            {['New', 'Like New', 'Good', 'Fair'].map((condition) => (
              <div key={condition} className="flex items-center gap-2">
                <Checkbox
                  id={condition}
                  checked={conditions.includes(condition)}
                  onCheckedChange={() => handleConditionToggle(condition)}
                />
                <label
                  htmlFor={condition}
                  className="text-sm text-foreground cursor-pointer"
                >
                  {condition}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Seller Verification */}
        <div>
          <h3 className="font-semibold text-foreground mb-3">Seller</h3>
          <div className="flex items-center gap-2">
            <Checkbox
              id="verified"
              checked={verifiedOnly}
              onCheckedChange={(checked: boolean) =>
                setVerifiedOnly(checked === true)
              }
            />
            <label
              htmlFor="verified"
              className="text-sm text-foreground cursor-pointer"
            >
              Verified Sellers Only
            </label>
          </div>
        </div>

        {/* Apply Filters */}
        <Button className="w-full" size="lg">
          Apply Filters
        </Button>
      </div>
    </Card>
  );
}