interface TableRowLabelProps {
  mainText: string
  labelText?: string
  className?: string
}

export default function TableRowLabel({ 
  mainText, 
  labelText,
  className = ""
}: TableRowLabelProps) {
  return (
    <div className={`flex flex-col ${className}`}>
      <span className="font-medium text-[14px]">{mainText}</span>
      {labelText && (
        <span className="text-[13px] text-muted-foreground font-normal w-[200px]">
          {labelText}
        </span>
      )}
    </div>
  )
}


