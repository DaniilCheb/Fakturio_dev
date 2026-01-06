"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Modal, { ModalBody, ModalFooter } from "@/app/components/Modal"
import Button from "@/app/components/Button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select"
import { Label } from "@/app/components/ui/label"
import Input from "@/app/components/Input"
import DatePicker from "@/app/components/DatePicker"
import TextArea from "@/app/components/TextArea"
import { type Invoice } from "@/lib/services/invoiceService.client"
import { calculateDueDate, formatDate } from "@/lib/utils/dateUtils"
import { cn } from "@/lib/utils"

const PAYMENT_TERMS_OPTIONS = [
  { value: 0, label: 'On receipt' },
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
  { value: 45, label: '45 days' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' },
]

interface EditInvoiceModalProps {
  invoice: Invoice
  open: boolean
  onOpenChange: (open: boolean) => void
  onInvoiceUpdated: (invoice: Invoice) => void
}

export default function EditInvoiceModal({
  invoice,
  open,
  onOpenChange,
  onInvoiceUpdated,
}: EditInvoiceModalProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Calculate initial payment terms from invoice dates
  const getInitialPaymentDays = () => {
    if (!invoice.issued_on || !invoice.due_date) return 14
    const issuedDate = new Date(invoice.issued_on)
    const dueDate = new Date(invoice.due_date)
    const days = Math.ceil((dueDate.getTime() - issuedDate.getTime()) / (1000 * 60 * 60 * 24))
    // Find closest matching option or default to 14
    const matchingOption = PAYMENT_TERMS_OPTIONS.find(opt => opt.value === days)
    return matchingOption ? matchingOption.value : (days > 0 ? days : 14)
  }

  // Form state
  const [invoiceNumber, setInvoiceNumber] = useState(invoice.invoice_number)
  const [issuedOn, setIssuedOn] = useState(invoice.issued_on)
  const [dueDate, setDueDate] = useState(invoice.due_date)
  const [paymentDays, setPaymentDays] = useState(getInitialPaymentDays())
  const [notes, setNotes] = useState(invoice.notes || "")

  // Reset form when invoice changes
  useEffect(() => {
    if (open && invoice) {
      setInvoiceNumber(invoice.invoice_number)
      setIssuedOn(invoice.issued_on)
      setDueDate(invoice.due_date)
      setPaymentDays(getInitialPaymentDays())
      setNotes(invoice.notes || "")
      setErrors({})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoice])

  // Recalculate due date when issued date or payment days change
  const updateDueDate = (newIssuedOn: string, days: number) => {
    if (newIssuedOn) {
      const calculated = calculateDueDate(newIssuedOn, `${days} days`)
      setDueDate(calculated)
    }
  }

  const handleIssuedDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIssuedDate = e.target.value
    setIssuedOn(newIssuedDate)
    clearError("issued_on")
    updateDueDate(newIssuedDate, paymentDays)
  }

  const handlePaymentTermsChange = (value: string) => {
    const days = parseInt(value, 10)
    setPaymentDays(days)
    clearError("due_date")
    updateDueDate(issuedOn, days)
  }

  const clearError = (field: string) => {
    setErrors((prev) => {
      const updated = { ...prev }
      delete updated[field]
      return updated
    })
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!invoiceNumber?.trim()) {
      newErrors.invoice_number = "Invoice number is required"
    }
    if (!issuedOn) {
      newErrors.issued_on = "Issued date is required"
    }
    if (!dueDate) {
      newErrors.due_date = "Due date is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) {
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_number: invoiceNumber,
          issued_on: issuedOn,
          due_date: dueDate,
          notes: notes,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update invoice")
      }

      const updated = await response.json()
      onInvoiceUpdated(updated)
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error("Error updating invoice:", error)
      alert("Failed to update invoice. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal 
      isOpen={open} 
      onClose={() => onOpenChange(false)} 
      title="Edit Invoice"
    >
      <ModalBody>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Invoice Number"
                value={invoiceNumber}
                onChange={(e) => {
                  setInvoiceNumber(e.target.value)
                  clearError("invoice_number")
                }}
                error={errors.invoice_number}
                required
                onErrorClear={() => clearError("invoice_number")}
                fieldName="invoice_number"
              />
            </div>
            <div>
              <DatePicker
                label="Issued On"
                value={issuedOn}
                onChange={handleIssuedDateChange}
                error={errors.issued_on}
                onErrorClear={() => clearError("issued_on")}
                fieldName="issued_on"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="font-medium text-[13px] text-[rgba(20,20,20,0.8)] dark:text-[#999] tracking-[-0.208px]">
                Payment Terms
              </Label>
              <Select
                value={paymentDays.toString()}
                onValueChange={handlePaymentTermsChange}
              >
                <SelectTrigger className={cn(
                  "w-full h-11 bg-[#f7f7f7] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#333] rounded-lg",
                  errors.due_date && "border-destructive focus:ring-destructive"
                )}>
                  <SelectValue placeholder="Select payment terms" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TERMS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="font-medium text-[13px] text-[rgba(20,20,20,0.8)] dark:text-[#999] tracking-[-0.208px]">
                Due Date
              </Label>
              <div className="flex items-center h-11 px-3 bg-[#f7f7f7] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#333] rounded-lg">
                <svg 
                  className="w-4 h-4 mr-2 text-[#666] dark:text-[#888]" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-foreground">
                  {formatDate(dueDate) || 'Select issued date first'}
                </span>
              </div>
              {errors.due_date && (
                <p className="text-destructive text-[12px]">{errors.due_date}</p>
              )}
            </div>
          </div>

          <div>
            <TextArea
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes or description"
              rows={4}
            />
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
