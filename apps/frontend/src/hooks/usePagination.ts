/**
 * usePagination Hook
 *
 * Custom hook for managing pagination state with URL sync
 * Implements Priority 1 requirements from UX Design Specification
 *
 * Features:
 * - Page and pageSize state management
 * - URL query parameter sync (?page=1&limit=50)
 * - Pagination metadata calculations
 * - Type-safe implementation
 *
 * @example
 * ```tsx
 * const {
 *   currentPage,
 *   pageSize,
 *   setCurrentPage,
 *   setPageSize,
 *   getPaginationParams
 * } = usePagination({ defaultPageSize: 50 });
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router';

interface UsePaginationOptions {
  /** Default page size */
  defaultPageSize?: number;
  /** Default page number */
  defaultPage?: number;
  /** Sync with URL query parameters */
  syncWithUrl?: boolean;
  /** Callback when pagination changes */
  onPaginationChange?: (page: number, pageSize: number) => void;
}

interface PaginationState {
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Current page size */
  pageSize: number;
  /** Set current page */
  setCurrentPage: (page: number) => void;
  /** Set page size */
  setPageSize: (size: number) => void;
  /** Get pagination parameters for API calls */
  getPaginationParams: () => { skip: number; limit: number };
  /** Reset to first page */
  resetPage: () => void;
  /** Calculate pagination metadata */
  getPaginationMeta: (totalItems: number) => {
    totalPages: number;
    startItem: number;
    endItem: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export function usePagination({
  defaultPageSize = 50,
  defaultPage = 1,
  syncWithUrl = true,
  onPaginationChange,
}: UsePaginationOptions = {}): PaginationState {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize from URL params if syncing
  const getInitialPage = (): number => {
    if (syncWithUrl) {
      const pageParam = searchParams.get('page');
      if (pageParam) {
        const parsed = parseInt(pageParam, 10);
        if (!isNaN(parsed) && parsed > 0) {
          return parsed;
        }
      }
    }
    return defaultPage;
  };

  const getInitialPageSize = (): number => {
    if (syncWithUrl) {
      const limitParam = searchParams.get('limit');
      if (limitParam) {
        const parsed = parseInt(limitParam, 10);
        if (!isNaN(parsed) && parsed > 0) {
          return parsed;
        }
      }
    }
    return defaultPageSize;
  };

  const [currentPage, setCurrentPageState] = useState(getInitialPage);
  const [pageSize, setPageSizeState] = useState(getInitialPageSize);

  // Update URL when pagination changes
  useEffect(() => {
    if (syncWithUrl) {
      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);
          newParams.set('page', currentPage.toString());
          newParams.set('limit', pageSize.toString());
          return newParams;
        },
        { replace: true } // Use replace to avoid cluttering history
      );
    }

    // Call change callback
    onPaginationChange?.(currentPage, pageSize);
  }, [currentPage, pageSize, syncWithUrl, setSearchParams, onPaginationChange]);

  // Set current page with validation
  const setCurrentPage = useCallback((page: number) => {
    if (page > 0) {
      setCurrentPageState(page);
    }
  }, []);

  // Set page size and reset to first page
  const setPageSize = useCallback((size: number) => {
    if (size > 0) {
      setPageSizeState(size);
      setCurrentPageState(1); // Reset to first page when changing page size
    }
  }, []);

  // Reset to first page
  const resetPage = useCallback(() => {
    setCurrentPageState(1);
  }, []);

  // Get pagination parameters for API calls
  const getPaginationParams = useCallback((): { skip: number; limit: number } => {
    return {
      skip: (currentPage - 1) * pageSize,
      limit: pageSize,
    };
  }, [currentPage, pageSize]);

  // Calculate pagination metadata
  const getPaginationMeta = useCallback(
    (totalItems: number) => {
      const totalPages = Math.ceil(totalItems / pageSize);
      const startItem = (currentPage - 1) * pageSize + 1;
      const endItem = Math.min(currentPage * pageSize, totalItems);

      return {
        totalPages,
        startItem,
        endItem,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
      };
    },
    [currentPage, pageSize]
  );

  return {
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    getPaginationParams,
    resetPage,
    getPaginationMeta,
  };
}
