import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import AnimatedCartButton from "@/components/ui/AnimatedCartButton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface ReviewFormProps {
  productId: string;
  onClose: () => void;
  className?: string;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ productId, onClose }) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const reviewMutation = useMutation({
    mutationFn: async (reviewData: { productId: string; rating: number; comment: string }) => {
      const response = await apiRequest(
        "POST", 
        `/api/products/${reviewData.productId}/reviews`, 
        reviewData
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit review");
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch product reviews
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/reviews`] });
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}`] });
      
      toast({
        title: "Review Submitted",
        description: "Thank you for your valuable feedback!",
        variant: "default",
        duration: 5000,
        action: (
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
        )
      });
      
      onClose();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message || "Failed to submit review. Please try again.",
        duration: 5000,
        action: (
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            <button 
              onClick={(e) => {
                e.preventDefault();
                handleRetry();
              }}
              className="text-sm font-medium hover:underline"
            >
              Retry
            </button>
          </div>
        )
      });
      setIsSubmitting(false);
    }
  });

  const handleRetry = () => {
    if (comment.trim().length >= 5) {
      setIsSubmitting(true);
      reviewMutation.mutate({
        productId,
        rating,
        comment: comment.trim()
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim().length < 5) {
      toast({
        variant: "default",
        title: "Review Too Short",
        description: "Please write a detailed review with at least 5 characters.",
        duration: 3000,
        action: (
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
          </div>
        )
      });
      return;
    }
    
    setIsSubmitting(true);
    reviewMutation.mutate({
      productId,
      rating,
      comment: comment.trim()
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-neutral-sand shadow-md relative">
      <button 
        onClick={onClose} 
        className="absolute right-4 top-4 text-neutral-gray hover:text-primary"
        aria-label="Close review form"
      >
        <X size={20} />
      </button>
      
      <h3 className="font-heading text-xl text-primary mb-4">Write Your Review</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <Label htmlFor="rating" className="block text-sm font-medium text-neutral-gray mb-1">
            Your Rating*
          </Label>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="focus:outline-none"
                aria-label={`Rate ${star} stars`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-8 w-8 ${
                    star <= rating ? "text-yellow-400" : "text-neutral-sand"
                  }`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <Label htmlFor="comment" className="block text-sm font-medium text-neutral-gray mb-1">
            Your Review*
          </Label>
          <Textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product..."
            rows={5}
            required
            className="w-full border border-neutral-sand rounded-md focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex justify-end">
          <AnimatedCartButton
            type="button"
            variant="secondary"
            onClick={onClose}
            className="mr-2 border border-neutral-sand text-neutral-gray hover:bg-neutral-cream"
            disabled={isSubmitting}
          >
            Cancel
          </AnimatedCartButton>
          <AnimatedCartButton
            type="submit"
            className="bg-amber-500 hover:bg-amber-600 text-white"
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </AnimatedCartButton>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;
