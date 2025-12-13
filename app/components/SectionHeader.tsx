import { ReactNode } from "react"

interface SectionHeaderProps {
  children: ReactNode
  className?: string
}

export default function SectionHeader({ children, className = "" }: SectionHeaderProps) {
  return (
    <div className={`px-6 h-[42px] flex items-center bg-card border-b border-border rounded-t-xl ${className}`}>
      {children}
    </div>
  )
}

