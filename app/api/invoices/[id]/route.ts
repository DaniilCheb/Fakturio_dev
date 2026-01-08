import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { deleteInvoice, getInvoiceById, updateInvoice } from "@/lib/services/invoiceService"
import { updateInvoiceSchema } from "@/lib/validations/invoice"
import { apiError } from "@/lib/utils/apiError"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: invoiceId } = await params
    
    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 }
      )
    }

    const body = await request.json()
    
    // Validate input with Zod
    const validationResult = updateInvoiceSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input', 
          details: validationResult.error.flatten().fieldErrors 
        },
        { status: 400 }
      )
    }

    const updates = validationResult.data
    // Convert null values to undefined for type compatibility with service layer
    const cleanUpdates: any = {}
    for (const [key, value] of Object.entries(updates)) {
      cleanUpdates[key] = value === null ? undefined : value
    }
    const updatedInvoice = await updateInvoice(invoiceId, cleanUpdates)
    
    return NextResponse.json(updatedInvoice)
  } catch (error) {
    console.error("Error updating invoice:", error)
    return NextResponse.json(
      apiError(error, "Failed to update invoice"),
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

