import { NextRequest, NextResponse } from "next/server"
import { duplicateInvoice } from "@/lib/services/invoiceService"

export async function POST(
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

    const duplicatedInvoice = await duplicateInvoice(invoiceId)
    
    return NextResponse.json(duplicatedInvoice)
  } catch (error) {
    console.error("Error duplicating invoice:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to duplicate invoice" },
      { status: 500 }
    )
  }
}

