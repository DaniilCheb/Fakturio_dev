import { ReactNode } from "react"

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <div className="flex flex-row items-start justify-center gap-4 mb-2">
      <div className="flex flex-col gap-1 w-full">
        <h1 className="font-semibold text-[24px] md:text-[32px] text-foreground tracking-tight w-full flex flex-row">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex gap-3 items-center">
          {actions}
        </div>
      )}
    </div>
  )
}

