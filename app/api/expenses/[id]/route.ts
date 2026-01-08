import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { deleteExpense, getExpenseById, updateExpense } from "@/lib/services/expenseService"
import type { UpdateExpenseInput } from "@/lib/validations/expense"
import { updateExpenseSchema } from "@/lib/validations/expense"
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
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: expenseId } = await params
    
    if (!expenseId) {
      return NextResponse.json(
        { error: "Expense ID is required" },
        { status: 400 }
      )
    }

    const body = await request.json()
    
    // Validate input with Zod
    const validationResult = updateExpenseSchema.safeParse(body)
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
    // The validation schema allows null, but the service expects undefined
    const cleanUpdates: any = {}
    for (const [key, value] of Object.entries(updates)) {
      cleanUpdates[key] = value === null ? undefined : value
    }
    const updatedExpense = await updateExpense(expenseId, cleanUpdates)
    
    return NextResponse.json(updatedExpense)
  } catch (error) {
    console.error("Error updating expense:", error)
    return NextResponse.json(
      apiError(error, "Failed to update expense"),
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


