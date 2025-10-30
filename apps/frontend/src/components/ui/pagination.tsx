/**
 * Pagination Component
 *
 * Server-side pagination control with page size selection
 * Implements Priority 1 requirements from UX Design Specification
 *
 * Features:
 * - Previous/Next navigation
 * - Page number display with intelligent truncation
 * - Page size selector (25, 50, 100, 200)
 * - Total count display
 * - Keyboard navigation support
 * - Mobile-responsive design
 *
 * Performance target: <300ms page changes
 *
 * @example
 * ```tsx
 * <Pagination
 *   currentPage={1}
 *   totalPages={45}
 *   totalItems={2213}
 *   pageSize={50}
 *   onPageChange={(page) => setPage(page)}
 *   onPageSizeChange={(size) => setPageSize(size)}
 * />
 * ```
 */

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of items */
  totalItems: number;
  /** Current page size */
  pageSize: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Callback when page size changes */
  onPageSizeChange: (pageSize: number) => void;
  /** Optional className for styling */
  className?: string;
  /** Show page size selector */
  showPageSize?: boolean;
  /** Page size options */
  pageSizeOptions?: number[];
}

const DEFAULT_PAGE_SIZES = [25, 50, 100, 200];

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  className = '',
  showPageSize = true,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
}: PaginationProps) {
  // Calculate display range
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers to display
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 7; // Maximum number of page buttons to show

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage <= 3) {
        // Near start: show 1, 2, 3, 4, ..., last
        for (let i = 2; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near end: show 1, ..., last-3, last-2, last-1, last
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Middle: show 1, ..., current-1, current, current+1, ..., last
        pages.push('ellipsis');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pages = getPageNumbers();

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}
      role="navigation"
      aria-label="Pagination"
    >
      {/* Results info */}
      <div className="text-sm text-muted-foreground">
        전체 <span className="font-medium">{totalItems}</span>개 중{' '}
        <span className="font-medium">{startItem}</span>~<span className="font-medium">{endItem}</span>개 표시
      </div>

      {/* Page controls */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Page navigation */}
        <div className="flex items-center gap-1">
          {/* First page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            aria-label="Go to first page"
            className="hidden sm:flex h-9 w-9 p-0"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* Previous page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="이전 페이지로 이동"
            className="h-9 w-9 p-0 sm:w-auto sm:px-4"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">이전</span>
          </Button>

          {/* Page numbers */}
          <div className="hidden sm:flex items-center gap-1">
            {pages.map((page, index) =>
              page === 'ellipsis' ? (
                <div
                  key={`ellipsis-${index}`}
                  className="w-9 h-9 flex items-center justify-center"
                  aria-hidden="true"
                >
                  <span className="text-muted-foreground">...</span>
                </div>
              ) : (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  aria-label={`Go to page ${page}`}
                  aria-current={currentPage === page ? 'page' : undefined}
                  className="h-9 w-9 p-0"
                >
                  {page}
                </Button>
              )
            )}
          </div>

          {/* Mobile: Current page indicator */}
          <div className="flex sm:hidden items-center justify-center min-w-[80px] text-sm">
            <span className="font-medium">{currentPage}</span>
            <span className="text-muted-foreground mx-1">/</span>
            <span className="text-muted-foreground">{totalPages}</span>
          </div>

          {/* Next page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="다음 페이지로 이동"
            className="h-9 w-9 p-0 sm:w-auto sm:px-4"
          >
            <span className="hidden sm:inline mr-2">다음</span>
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            aria-label="Go to last page"
            className="hidden sm:flex h-9 w-9 p-0"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Page size selector */}
        {showPageSize && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">페이지당 항목:</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="w-[80px] h-9" aria-label="페이지 크기 선택">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Simple pagination for minimal use cases
 */
interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function SimplePagination({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}: SimplePaginationProps) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="이전 페이지"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm text-muted-foreground">
        페이지 {currentPage} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="다음 페이지"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
