import { NextRequest, NextResponse } from "next/server"
import { deleteInvoice, getInvoiceById, updateInvoice, type UpdateInvoiceInput } from "@/lib/services/invoiceService"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params
    
    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 }
      )
    }

    const invoice = await getInvoiceById(invoiceId)
    
    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(invoice)
  } catch (error) {
    console.error("Error fetching invoice:", error)
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params
    
    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const updates: UpdateInvoiceInput = {}
    
    if (body.status) {
      updates.status = body.status
    }
    
    // Handle paid_date: include it if explicitly provided (even if null to clear it)
    if (body.paid_date !== undefined) {
      updates.paid_date = body.paid_date || null
    }
    if (body.invoice_number !== undefined) {
      updates.invoice_number = body.invoice_number
    }
    if (body.issued_on) {
      updates.issued_on = body.issued_on
    }
    if (body.due_date) {
      updates.due_date = body.due_date
    }
    if (body.currency) {
      updates.currency = body.currency
    }
    if (body.contact_id !== undefined) {
      updates.contact_id = body.contact_id
    }
    if (body.project_id !== undefined) {
      updates.project_id = body.project_id
    }
    if (body.bank_account_id !== undefined) {
      updates.bank_account_id = body.bank_account_id
    }
    if (body.notes !== undefined) {
      updates.notes = body.notes
    }
    if (body.from_info) {
      updates.from_info = body.from_info
    }
    if (body.to_info) {
      updates.to_info = body.to_info
    }
    if (body.items) {
      updates.items = body.items
    }
    if (body.subtotal !== undefined) {
      updates.subtotal = body.subtotal
    }
    if (body.vat_amount !== undefined) {
      updates.vat_amount = body.vat_amount
    }
    if (body.vat_rate !== undefined) {
      updates.vat_rate = body.vat_rate
    }
    if (body.total !== undefined) {
      updates.total = body.total
    }
    if (body.exchange_rate !== undefined) {
      updates.exchange_rate = body.exchange_rate
    }
    if (body.amount_in_account_currency !== undefined) {
      updates.amount_in_account_currency = body.amount_in_account_currency
    }
    if (body.payment_terms) {
      updates.payment_terms = body.payment_terms
    }

    const updatedInvoice = await updateInvoice(invoiceId, updates)
    
    return NextResponse.json(updatedInvoice)
  } catch (error) {
    console.error("Error updating invoice:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Failed to update invoice", details: errorMessage },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params
    
    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 }
      )
    }

    await deleteInvoice(invoiceId)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting invoice:", error)
    return NextResponse.json(
      { error: "Failed to delete invoice" },
      { status: 500 }
    )
  }
}

