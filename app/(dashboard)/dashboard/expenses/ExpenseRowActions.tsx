"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { useUser } from "@clerk/nextjs"
import { Edit, Copy, Trash2 } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { useConfirmDialog } from "@/app/components/useConfirmDialog"
import type { Expense } from "@/lib/services/expenseService.client"

interface ExpenseRowActionsProps {
  expense: Expense
}

export default function ExpenseRowActions({ expense }: ExpenseRowActionsProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useUser()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const { confirm, DialogComponent } = useConfirmDialog()

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Delete Expense",
      message: `Are you sure you want to delete "${expense.name}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    })

    if (!confirmed) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete expense")
      }

      // Invalidate expenses query to refetch the list
      if (user?.id) {
        await queryClient.invalidateQueries({ queryKey: ['expenses', user.id] })
      }
    } catch (error) {
      console.error("Error deleting expense:", error)
      alert("Failed to delete expense. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDuplicate = async () => {
    setIsDuplicating(true)
    try {
      const response = await fetch(`/api/expenses/${expense.id}/duplicate`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to duplicate expense")
      }

      const duplicated = await response.json()
      
      // Invalidate expenses query to refetch the list
      if (user?.id) {
        await queryClient.invalidateQueries({ queryKey: ['expenses', user.id] })
      }
      
      router.push(`/dashboard/expenses/${duplicated.id}`)
    } catch (error) {
      console.error("Error duplicating expense:", error)
      alert("Failed to duplicate expense. Please try again.")
    } finally {
      setIsDuplicating(false)
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/dashboard/expenses/${expense.id}/edit`)
  }

  return (
    <>
      {DialogComponent}
      <div className="flex items-center justify-end gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-[46px] w-[46px] sm:h-8 sm:w-8"
          onClick={handleEdit}
          title="Edit expense"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-[46px] w-[46px] sm:h-8 sm:w-8"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleDuplicate()
          }}
          disabled={isDuplicating}
          title="Duplicate expense"
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-[46px] w-[46px] sm:h-8 sm:w-8 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleDelete()
          }}
          disabled={isDeleting}
          title="Delete expense"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </>
  )
}

