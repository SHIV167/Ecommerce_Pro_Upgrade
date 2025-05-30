import React, { useState, FormEvent } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
// Import from local types instead of @shared/schema
import { MongoProduct, MongoCategory } from "@/types/mongo";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  AppDialog as Dialog,
  AppDialogContent as DialogContent,
  AppDialogHeader as DialogHeader,
  AppDialogTitle as DialogTitle,
  AppDialogDescription as DialogDescription,
  AppDialogFooter as DialogFooter 
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import ProductForm from "../components/products/ProductForm";
import ProductTable from "../components/products/ProductTable";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ProductsManagement() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<MongoProduct | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<MongoProduct | null>(null);
  const { toast } = useToast();
  
  const limit = 10;
  
  // Get products with pagination and filters
  const {
    data: productsData,
    isLoading: isProductsLoading,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ['/api/products', { page, limit, search, categoryFilter }],
    queryFn: async () => {
      let url = `/api/products?page=${page}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (categoryFilter && categoryFilter !== "all") url += `&categoryId=${categoryFilter}`;
      
      const response = await apiRequest("GET", url);
      return response.json();
    }
  });
  
  // Get categories for filter
  const { data: categoriesData } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/categories");
      return response.json();
    }
  });
  
  // Ensure data is always an array
  const categories = Array.isArray(categoriesData) ? categoriesData as MongoCategory[] : [];
  
  // Delete product mutation
  const { mutate: deleteProduct, status } = useMutation<void, Error, string | number>({
    mutationFn: async (productId: string | number) => {
      await apiRequest("DELETE", `/api/products/${productId}`);
    },
    onSuccess: () => {
      toast({
        title: "Product deleted",
        description: "The product has been deleted successfully.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting product",
        description: error.message,
        variant: "destructive",
      });
      console.error("Error deleting product:", error);
    },
  });
  
  const handleEditProduct = (product: MongoProduct) => {
    // Make sure we're handling both id and _id scenarios
    if (product._id && !product.id) {
      product.id = typeof product._id === 'string' ? parseInt(product._id) : product._id;
    }
    setEditProduct(product);
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteProduct = (product: MongoProduct) => {
    // Make sure we're handling both id and _id scenarios
    if (product._id && !product.id) {
      product.id = typeof product._id === 'string' ? parseInt(product._id) : product._id;
    }
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDeleteProduct = () => {
    if (!productToDelete) return;
    // Use either _id or id; ensure defined
    const productId = productToDelete._id ?? productToDelete.id;
    if (productId === undefined) return;
    deleteProduct(productId);
  };
  
  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset page when searching
    refetchProducts();
  };
  
  const handleAddProductSuccess = () => {
    setIsAddProductDialogOpen(false);
    refetchProducts();
  };
  
  const handleEditProductSuccess = () => {
    setIsEditDialogOpen(false);
    setEditProduct(null);
    refetchProducts();
  };
  
  // Extract product list and pagination
  const products = Array.isArray(productsData?.products) ? productsData.products : [];
  const totalProducts = productsData?.total || 0;
  // Use server-provided totalPages if available
  const totalPages = typeof productsData?.totalPages === 'number'
    ? productsData.totalPages
    : Math.max(1, Math.ceil(totalProducts / limit));
  // Debug pagination values
  console.log('Pagination Debug', { page, limit, totalProducts, totalPages, productsData });
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-heading text-primary mb-1">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Bulk Products+</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={async () => {
                try {
                  // Export CSV via API
                  const response = await apiRequest('GET', '/api/products/export');
                  const blob = await response.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `products_export_${Date.now()}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                } catch (error) {
                  console.error('Export error:', error);
                  toast({ title: 'Export failed', variant: 'destructive' });
                }
              }}>
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={async () => {
                try {
                  // Download sample CSV via API
                  const response = await apiRequest('GET', '/api/products/sample-csv');
                  const blob = await response.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'sample-products.csv';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                } catch (error) {
                  console.error('Download sample error:', error);
                  toast({ title: 'Download sample failed', variant: 'destructive' });
                }
              }}>
                Download Sample
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.csv';
                input.onchange = async (event: Event) => {
                  const file = (event.target as HTMLInputElement).files?.[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append('file', file);
                  
                  // Upload file
                  const response = await apiRequest('POST', '/api/products/import-csv', {
                    body: formData,
                    headers: {},
                  });
                  
                  if (response.ok) {
                    toast({
                      title: 'Import successful',
                      description: 'Products were successfully imported.',
                    });
                    queryClient.invalidateQueries({ queryKey: ['/api/products'] });
                  } else {
                    toast({
                      title: 'Import failed',
                      description: 'There was an error importing products.',
                      variant: 'destructive',
                    });
                  }
                };input.click();
              }}>
                Import CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            onClick={() => setIsAddProductDialogOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Product
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 md:items-end">
        <div className="flex-1">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="secondary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              Search
            </Button>
          </form>
        </div>
        
        <div className="flex gap-2">
          <Select
            value={categoryFilter}
            onValueChange={(value: string) => setCategoryFilter(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => {
                const value = category._id?.toString() || category.id?.toString();
                return (
                  <SelectItem 
                    key={value || `category-${category.name}`}
                    value={value || `category-${category.name}`}
                  >
                    {category.name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <Button 
            onClick={() => refetchProducts()}
            variant="outline"
            size="sm"
            className="mr-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
              <path d="M16 21h5v-5"/>
            </svg>
            Refresh
          </Button>
        </div>
      </div>
      
      <ProductTable
        products={products}
        isLoading={isProductsLoading}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
      />
      
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                href="#" 
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault();
                  if (page > 1) setPage(page - 1);
                }}
                aria-disabled={page === 1}
                className={page === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  href="#"
                  onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault();
                    setPage(pageNum);
                  }}
                  isActive={pageNum === page}
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault();
                  if (page < totalPages) setPage(page + 1);
                }}
                aria-disabled={page === totalPages}
                className={page === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      
      {/* Add Product Dialog */}
      <Dialog open={isAddProductDialogOpen} onOpenChange={setIsAddProductDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new product.
            </DialogDescription>
          </DialogHeader>
          <ProductForm onSuccess={handleAddProductSuccess} />
        </DialogContent>
      </Dialog>
      
      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update the product details.
            </DialogDescription>
          </DialogHeader>
          {editProduct && <ProductForm product={editProduct as MongoProduct} onSuccess={handleEditProductSuccess} />}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteProduct}
              disabled={status === 'pending'}
            >
              {status === 'pending' ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
