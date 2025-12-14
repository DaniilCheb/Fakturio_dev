import { NextRequest, NextResponse } from "next/server"
import { deleteExpense, getExpenseById, updateExpense, type UpdateExpenseInput } from "@/lib/services/expenseService"

export async function GET(
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

    const expense = await getExpenseById(expenseId)
    
    if (!expense) {
      return NextResponse.json(
        { error: "Expense not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(expense)
  } catch (error) {
    console.error("Error fetching expense:", error)
    return NextResponse.json(
      { error: "Failed to fetch expense" },
      { status: 500 }
    )
  }
}

export async function PATCH(
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

    const body = await request.json()
    const updates: UpdateExpenseInput = {}
    
    if (body.name !== undefined) {
      updates.name = body.name
    }
    if (body.description !== undefined) {
      updates.description = body.description
    }
    if (body.category) {
      updates.category = body.category
    }
    if (body.type) {
      updates.type = body.type
    }
    if (body.amount !== undefined) {
      updates.amount = body.amount
    }
    if (body.currency) {
      updates.currency = body.currency
    }
    if (body.vat_amount !== undefined) {
      updates.vat_amount = body.vat_amount
    }
    if (body.vat_rate !== undefined) {
      updates.vat_rate = body.vat_rate
    }
    if (body.date) {
      updates.date = body.date
    }
    if (body.end_date !== undefined) {
      updates.end_date = body.end_date
    }
    if (body.frequency !== undefined) {
      updates.frequency = body.frequency
    }
    if (body.depreciation_years !== undefined) {
      updates.depreciation_years = body.depreciation_years
    }
    if (body.receipt_url !== undefined) {
      updates.receipt_url = body.receipt_url
    }
    if (body.project_id !== undefined) {
      updates.project_id = body.project_id
    }
    if (body.contact_id !== undefined) {
      updates.contact_id = body.contact_id
    }

    const updatedExpense = await updateExpense(expenseId, updates)
    
    return NextResponse.json(updatedExpense)
  } catch (error) {
    console.error("Error updating expense:", error)
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    await deleteExpense(expenseId)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting expense:", error)
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    )
  }
}

