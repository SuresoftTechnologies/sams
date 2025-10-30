/**
 * useSearch Hook
 *
 * Custom hook for managing search state with debouncing and URL sync
 * Implements Priority 1 requirements from UX Design Specification
 *
 * Features:
 * - Debounced search (300ms default)
 * - URL query parameter sync (?search=laptop)
 * - Search history (optional)
 * - Clear search functionality
 *
 * @example
 * ```tsx
 * const {
 *   searchQuery,
 *   debouncedSearchQuery,
 *   setSearchQuery,
 *   clearSearch,
 *   isSearching
 * } = useSearch({ debounceMs: 300 });
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router';

interface UseSearchOptions {
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Sync with URL query parameters */
  syncWithUrl?: boolean;
  /** URL parameter name */
  paramName?: string;
  /** Minimum search length before triggering */
  minLength?: number;
  /** Callback when search changes */
  onSearchChange?: (query: string) => void;
}

interface SearchState {
  /** Current search query (immediate) */
  searchQuery: string;
  /** Debounced search query (delayed) */
  debouncedSearchQuery: string;
  /** Set search query */
  setSearchQuery: (query: string) => void;
  /** Clear search */
  clearSearch: () => void;
  /** Is currently debouncing */
  isDebouncing: boolean;
}

export function useSearch({
  debounceMs = 300,
  syncWithUrl = true,
  paramName = 'search',
  minLength = 0,
  onSearchChange,
}: UseSearchOptions = {}): SearchState {
  const [searchParams, setSearchParams] = useSearchParams();
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Initialize from URL if syncing
  const getInitialQuery = (): string => {
    if (syncWithUrl) {
      return searchParams.get(paramName) || '';
    }
    return '';
  };

  const [searchQuery, setSearchQueryState] = useState(getInitialQuery);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(getInitialQuery);
  const [isDebouncing, setIsDebouncing] = useState(false);

  // Debounce search query
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Only debounce if query meets minimum length or is empty (for clearing)
    if (searchQuery.length >= minLength || searchQuery.length === 0) {
      setIsDebouncing(true);

      debounceTimerRef.current = setTimeout(() => {
        setDebouncedSearchQuery(searchQuery);
        setIsDebouncing(false);
      }, debounceMs);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, debounceMs, minLength]);

  // Update URL when debounced query changes
  useEffect(() => {
    if (syncWithUrl) {
      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);
          if (debouncedSearchQuery) {
            newParams.set(paramName, debouncedSearchQuery);
          } else {
            newParams.delete(paramName);
          }
          return newParams;
        },
        { replace: true }
      );
    }

    // Call change callback
    if (onSearchChange) {
      onSearchChange(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, syncWithUrl, paramName, setSearchParams, onSearchChange]);

  // Set search query
  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQueryState('');
    setDebouncedSearchQuery('');
    setIsDebouncing(false);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  return {
    searchQuery,
    debouncedSearchQuery,
    setSearchQuery,
    clearSearch,
    isDebouncing,
  };
}
