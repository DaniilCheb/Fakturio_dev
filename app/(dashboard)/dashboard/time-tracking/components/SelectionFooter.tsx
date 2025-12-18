'use client'

import { Card } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'

interface SelectionFooterProps {
  count: number
  totalHours: number
  totalAmount: number
  onCreateInvoice: () => void
  formatCurrency: (amount: number, currency?: string) => string
}

export default function SelectionFooter({
  count,
  totalHours,
  totalAmount,
  onCreateInvoice,
  formatCurrency,
}: SelectionFooterProps) {
  return (
    <Card className="sticky bottom-4 border-2">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-sm text-muted-foreground">Selected:</span>
            <span className="ml-2 font-semibold">{count} entries</span>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Total time:</span>
            <span className="ml-2 font-semibold">{totalHours.toFixed(2)}h</span>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Amount:</span>
            <span className="ml-2 font-semibold">{formatCurrency(totalAmount, 'CHF')}</span>
          </div>
        </div>
        <Button onClick={onCreateInvoice} size="lg">
          Create Invoice
        </Button>
      </div>
    </Card>
  )
}

