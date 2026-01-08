import { ReactNode } from "react"

interface SectionHeaderProps {
  title?: string
  actions?: ReactNode
  children?: ReactNode
  className?: string
}

export default function SectionHeader({ title, actions, children, className = "" }: SectionHeaderProps) {
  // Support legacy usage with children
  if (children) {
    return (
      <div className={`px-6 h-[42px] flex items-center bg-card border-b border-border rounded-t-xl ${className}`}>
        {children}
      </div>
    )
  }

  // New API with title and optional actions
  return (
    <div className={`px-6 py-3 border-b flex items-center justify-between h-[56px] ${className}`}>
      {title && (
        <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </p>
      )}
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}

