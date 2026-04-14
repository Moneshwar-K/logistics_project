'use client';

import { useState, useCallback } from 'react';
import { apiService } from '@/lib/api';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

/**
 * Custom hook for API calls with automatic loading and error states
 * Handles all common logistics operations with consistent error handling
 */
export function useApi<T>(options: UseApiOptions = {}) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (apiCall: () => Promise<T>) => {
      setState({ data: null, loading: true, error: null });
      try {
        const result = await apiCall();
        setState({ data: result, loading: false, error: null });
        options.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setState({ data: null, loading: false, error: error.message });
        options.onError?.(error);
        throw error;
      }
    },
    [options]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}

/**
 * Hook for list operations with pagination and filtering
 */
export function useApiList<T>(
  fetchFunction: (filters: any) => Promise<any>,
  initialFilters: any = {}
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters);
  const [total, setTotal] = useState(0);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFunction(filters);
      setItems(result.data || result);
      setTotal(result.total || result.length || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [filters, fetchFunction]);

  const updateFilters = useCallback((newFilters: any) => {
    setFilters({ ...filters, ...newFilters });
  }, [filters]);

  const reset = useCallback(() => {
    setItems([]);
    setLoading(false);
    setError(null);
    setFilters(initialFilters);
  }, [initialFilters]);

  return { items, loading, error, filters, total, fetch, updateFilters, reset };
}
