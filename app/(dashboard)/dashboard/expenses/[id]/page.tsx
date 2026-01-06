import { notFound } from "next/navigation"
import { getExpenseById } from "@/lib/services/expenseService"
import ExpenseDetailClient from "./ExpenseDetailClient"

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const expense = await getExpenseById(id)

  if (!expense) {
    notFound()
  }

  return (
    <div className="max-w-[920px] mx-auto space-y-8">
      <ExpenseDetailClient expense={expense} title={expense.name} />
    </div>
  )
}

