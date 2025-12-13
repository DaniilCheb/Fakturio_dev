"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/app/components/ui/dialog"
import { Button } from "@/app/components/ui/button"
import Input from "@/app/components/Input"
import DatePicker from "@/app/components/DatePicker"
import TextArea from "@/app/components/TextArea"
import { type Invoice } from "@/lib/services/invoiceService.client"
import { formatDateISO } from "@/lib/utils/dateUtils"

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

  // Form state
  const [invoiceNumber, setInvoiceNumber] = useState(invoice.invoice_number)
  const [issuedOn, setIssuedOn] = useState(invoice.issued_on)
  const [dueDate, setDueDate] = useState(invoice.due_date)
  const [notes, setNotes] = useState(invoice.notes || "")

  // Reset form when invoice changes
  useEffect(() => {
    if (open && invoice) {
      setInvoiceNumber(invoice.invoice_number)
      setIssuedOn(invoice.issued_on)
      setDueDate(invoice.due_date)
      setNotes(invoice.notes || "")
      setErrors({})
    }
  }, [open, invoice])

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Invoice</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
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
                onChange={(e) => {
                  setIssuedOn(e.target.value)
                  clearError("issued_on")
                }}
                error={errors.issued_on}
                onErrorClear={() => clearError("issued_on")}
                fieldName="issued_on"
              />
            </div>
          </div>

          <div>
            <DatePicker
              label="Due Date"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value)
                clearError("due_date")
              }}
              error={errors.due_date}
              onErrorClear={() => clearError("due_date")}
              fieldName="due_date"
            />
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

