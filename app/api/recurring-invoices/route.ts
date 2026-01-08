import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
  getRecurringInvoices,
  createRecurringInvoice,
  type CreateRecurringInvoiceInput,
} from '@/lib/services/recurringInvoiceService'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const recurringInvoices = await getRecurringInvoices()
    return NextResponse.json(recurringInvoices)
  } catch (error) {
    console.error('[API] Error fetching recurring invoices:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const recurringInvoice = await createRecurringInvoice(
      body as CreateRecurringInvoiceInput
    )

    return NextResponse.json(recurringInvoice, { status: 201 })
  } catch (error) {
    console.error('[API] Error creating recurring invoice:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}



