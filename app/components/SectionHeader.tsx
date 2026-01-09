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
      <div className={`px-6 h-[56px] flex items-center bg-card border-b border-border rounded-t-xl ${className}`}>
        {children}
      </div>
    )
  }

  // New API with title and optional actions
  return (
    <div className={`pl-6 pr-2 py-3 border-b flex items-center justify-between h-[56px] ${className}`} style={{ borderBottomColor: 'rgba(224, 224, 224, 1)' }}>
      {title && (
        <p className="text-[16px] font-medium tracking-[-0.3px]" style={{ color: 'rgba(20, 20, 20, 1)' }}>
          {title}
        </p>
      )}
      {actions && (
        <div className="flex items-center justify-center gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}

