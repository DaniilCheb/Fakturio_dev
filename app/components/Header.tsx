import { ReactNode } from "react"

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <div className="flex flex-row items-start justify-between gap-4 mb-2 w-full">
      <div className="flex flex-col gap-1">
        <h1 className="font-semibold text-[32px] text-foreground tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex gap-3 items-center ml-auto">
          {actions}
        </div>
      )}
    </div>
  )
}

