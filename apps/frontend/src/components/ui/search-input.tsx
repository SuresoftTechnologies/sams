/**
 * SearchInput Component
 *
 * Enhanced search input with debouncing and keyboard shortcuts
 * Implements Priority 1 requirements from UX Design Specification
 *
 * Features:
 * - Debounced input (300ms delay)
 * - Clear button
 * - Search icon and loading indicator
 * - Keyboard shortcut: `/` to focus
 * - Multi-field search support
 * - Accessible with proper ARIA labels
 *
 * @example
 * ```tsx
 * <SearchInput
 *   placeholder="Search assets..."
 *   value={searchQuery}
 *   onChange={(value) => setSearchQuery(value)}
 *   onSearch={(value) => performSearch(value)}
 *   isLoading={isSearching}
 * />
 * ```
 */

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Loader2 } from 'lucide-react';

interface SearchInputProps {
  /** Current search value */
  value: string;
  /** Callback when value changes (immediate) */
  onChange: (value: string) => void;
  /** Callback when search is triggered (debounced) */
  onSearch?: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Show loading indicator */
  isLoading?: boolean;
  /** Additional className */
  className?: string;
  /** Enable keyboard shortcut (/) to focus */
  enableShortcut?: boolean;
  /** Minimum characters before triggering search */
  minSearchLength?: number;
  /** ARIA label */
  'aria-label'?: string;
}

export function SearchInput({
  value,
  onChange,
  onSearch,
  placeholder = 'Search...',
  debounceMs = 300,
  isLoading = false,
  className = '',
  enableShortcut = true,
  minSearchLength = 0,
  'aria-label': ariaLabel = 'Search input',
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Sync external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Handle keyboard shortcut (/) to focus search
  useEffect(() => {
    if (!enableShortcut) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search on `/` key (unless in input/textarea)
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }

      // Clear search on Escape key when focused
      if (e.key === 'Escape' && inputRef.current === document.activeElement) {
        e.preventDefault();
        handleClear();
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableShortcut]);

  // Handle input change with debouncing
  const handleInputChange = (newValue: string) => {
    setLocalValue(newValue);
    onChange(newValue);

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Only trigger search if value meets minimum length
    if (newValue.length >= minSearchLength || newValue.length === 0) {
      // Set new debounce timer
      debounceTimerRef.current = setTimeout(() => {
        onSearch?.(newValue);
      }, debounceMs);
    }
  };

  // Clear search
  const handleClear = () => {
    setLocalValue('');
    onChange('');
    onSearch?.('');

    // Clear debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Return focus to input
    inputRef.current?.focus();
  };

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Search Icon */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        {isLoading ? (
          <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" aria-hidden="true" />
        ) : (
          <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        )}
      </div>

      {/* Input Field */}
      <Input
        ref={inputRef}
        type="search"
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => handleInputChange(e.target.value)}
        className="pl-10 pr-10"
        aria-label={ariaLabel}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
      />

      {/* Clear Button */}
      {localValue && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-transparent"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      {/* Keyboard Shortcut Hint (only on desktop) */}
      {enableShortcut && !localValue && (
        <div className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <kbd className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted border border-border rounded">
            /
          </kbd>
        </div>
      )}

      {/* Screen reader live region for search results */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {isLoading ? 'Searching...' : localValue ? `Search results for ${localValue}` : ''}
      </div>
    </div>
  );
}

/**
 * Compact search input for mobile/toolbar use
 */
interface CompactSearchInputProps extends Omit<SearchInputProps, 'className'> {
  /** Show search button instead of icon */
  showButton?: boolean;
}

export function CompactSearchInput({
  showButton = false,
  ...props
}: CompactSearchInputProps) {
  if (showButton) {
    return (
      <div className="flex gap-2">
        <SearchInput {...props} className="flex-1" enableShortcut={false} />
        <Button type="submit" size="sm">
          <Search className="h-4 w-4" />
          <span className="sr-only">Search</span>
        </Button>
      </div>
    );
  }

  return <SearchInput {...props} enableShortcut={false} />;
}
