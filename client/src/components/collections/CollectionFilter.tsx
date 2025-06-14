import { useState, useEffect } from "react";
import { useCategories, Category } from "@/hooks/useCategories";
import { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";

interface CollectionFilterProps {
  products: Product[];
  onFilter: (filteredProducts: Product[]) => void;
}

export default function CollectionFilter({ products, onFilter }: CollectionFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const maxPrice = Math.max(...products.map((p) => p.price), 1000);
  
  const defaultPriceRange = { min: 0, max: maxPrice };

  // Final applied filters
  const [appliedPriceRange, setAppliedPriceRange] = useState(defaultPriceRange);

  // Temporary filters within the sheet
  const [tempPriceRange, setTempPriceRange] = useState(appliedPriceRange);

  // Category filter state
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const [appliedCategory, setAppliedCategory] = useState<string | null>(null);
  const [tempCategory, setTempCategory] = useState<string | null>(null);

  const handleApplyFilters = () => {
    setAppliedPriceRange(tempPriceRange);
    setAppliedCategory(tempCategory);
    setIsOpen(false); // Close sheet on apply
  };
  
  const handleClearFilters = () => {
    setTempPriceRange(defaultPriceRange);
    setAppliedPriceRange(defaultPriceRange);
    setTempCategory(null);
    setAppliedCategory(null);
  };

  const filteredProducts = products.filter((product) => {
    const priceMatch = product.price >= appliedPriceRange.min && product.price <= appliedPriceRange.max;
    const categoryMatch = !appliedCategory || product.categoryId === appliedCategory;
    return priceMatch && categoryMatch;
  });

  useEffect(() => {
    onFilter(filteredProducts);
  }, [appliedPriceRange, appliedCategory, products, onFilter]);

  // When the sheet opens, sync temp filters with applied filters
  useEffect(() => {
    if (isOpen) {
      setTempPriceRange(appliedPriceRange);
      setTempCategory(appliedCategory);
    }
  }, [isOpen, appliedPriceRange, appliedCategory]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          Filter
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col w-[300px] sm:w-[400px]">
        <SheetHeader className="px-4 py-2 border-b">
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">
          {/* Price Range Filter */}
          <div className="space-y-6">
            {/* Price Range Filter */}
            <div className="space-y-4">
              <h3 className="font-semibold">Price Range</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>₹{tempPriceRange.min}</span>
                <span>₹{tempPriceRange.max}</span>
              </div>
              <Slider
                min={0}
                max={maxPrice}
                step={10}
                value={[tempPriceRange.min, tempPriceRange.max]}
                onValueChange={([min, max]) => setTempPriceRange({ min, max })}
                className="w-full"
              />
            </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-4">
              <h3 className="font-semibold">Category</h3>
              {categoriesLoading ? (
                <p>Loading categories...</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={!tempCategory ? "default" : "outline"}
                    onClick={() => setTempCategory(null)}
                    size="sm"
                  >
                    All
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category._id}
                      variant={tempCategory === category._id ? "default" : "outline"}
                      onClick={() => setTempCategory(category._id)}
                      size="sm"
                    >
                      {category.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <SheetFooter className="px-4 py-3 border-t flex-shrink-0">
          <Button variant="outline" onClick={handleClearFilters} className="w-full">
            Clear Filters
          </Button>
          <Button onClick={handleApplyFilters} className="w-full">
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
