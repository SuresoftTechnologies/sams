import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface SpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
}

/**
 * Spinner component for loading states
 *
 * @example
 * ```tsx
 * <Spinner size="md" />
 * ```
 */
export function Spinner({ className, size = "md" }: SpinnerProps) {
  return (
    <Loader2
      className={cn("animate-spin text-primary", sizeClasses[size], className)}
    />
  )
}

/**
 * Full page centered spinner
 */
export function SpinnerFullPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
}

/**
 * Overlay spinner (for modal/dialog loading states)
 */
export function SpinnerOverlay() {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Spinner size="lg" />
    </div>
  )
}
