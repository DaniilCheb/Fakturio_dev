import { NextRequest, NextResponse } from "next/server"
import { duplicateExpense } from "@/lib/services/expenseService"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: expenseId } = await params
    
    if (!expenseId) {
      return NextResponse.json(
        { error: "Expense ID is required" },
        { status: 400 }
      )
    }

    const duplicatedExpense = await duplicateExpense(expenseId)
    
    return NextResponse.json(duplicatedExpense)
  } catch (error) {
    console.error("Error duplicating expense:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to duplicate expense" },
      { status: 500 }
    )
  }
}

