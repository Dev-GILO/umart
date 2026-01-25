'use client';

import { useState, useEffect } from 'react';
import { get, post, patch, del } from '@/lib/utils/fetcher';

export interface Review {
  id: string;
  reviewerId: string;
  targetId: string;
  targetType: 'product' | 'seller';
  rating: number;
  title: string;
  content: string;
  helpfulCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface UseReviewsResult {
  reviews: Review[];
  loading: boolean;
  error: string | null;
}

export function useSellerReviews(sellerId: string): UseReviewsResult {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await get<Review[]>(`/api/reviews/seller/${sellerId}`);
        setReviews(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [sellerId]);

  return { reviews, loading, error };
}

export function useBuyerReviews(buyerId: string): UseReviewsResult {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await get<Review[]>(`/api/reviews/by-buyer/${buyerId}`);
        setReviews(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [buyerId]);

  return { reviews, loading, error };
}

export function useReview(reviewId: string) {
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await get<Review>(`/api/reviews/${reviewId}`);
        setReview(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch review');
      } finally {
        setLoading(false);
      }
    };

    fetchReview();
  }, [reviewId]);

  const updateReview = async (updates: Partial<Review>) => {
    try {
      const data = await patch<Review>(`/api/reviews/${reviewId}`, updates);
      setReview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update review');
      throw err;
    }
  };

  const deleteReview = async () => {
    try {
      await del(`/api/reviews/${reviewId}`);
      setReview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete review');
      throw err;
    }
  };

  return { review, loading, error, updateReview, deleteReview };
}

export function useCreateReview() {
  const createReview = async (data: {
    targetId: string;
    targetType: 'product' | 'seller';
    rating: number;
    title: string;
    content: string;
  }) => {
    try {
      const review = await post<Review>('/api/reviews', data);
      return review;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create review');
    }
  };

  return { createReview };
}
