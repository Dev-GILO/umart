'use client';

import { useState, useEffect } from 'react';
import { get, post } from '@/lib/utils/fetcher';

export interface Transaction {
  id: string;
  referenceId: string;
  buyerId: string;
  sellerId: string;
  productId: string;
  amount: number;
  status: 'pending' | 'successful' | 'failed' | 'cancelled';
  valueConfirmed: boolean;
  withdrawn: boolean;
  createdAt: string;
  product?: {
    title: string;
    image?: string;
  };
  seller?: {
    username: string;
    fullName: string;
  };
}

interface UseTransactionsResult {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
}

export function useTransactions(): UseTransactionsResult {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await get<Transaction[]>('/api/transactions');
        setTransactions(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  return { transactions, loading, error };
}

export function useTransaction(referenceId: string) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await get<Transaction>(
          `/api/transactions/${referenceId}`
        );
        setTransaction(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch transaction');
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [referenceId]);

  const confirmValue = async () => {
    try {
      await post('/api/reference/confirm-value', { referenceId });
      const data = await get<Transaction>(
        `/api/transactions/${referenceId}`
      );
      setTransaction(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm value');
      throw err;
    }
  };

  return { transaction, loading, error, confirmValue };
}

export function useCreatePayment() {
  const createPayment = async (productId: string, amount: number) => {
    try {
      const data = await post('/api/payment', { productId, amount });
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create payment');
    }
  };

  return { createPayment };
}
