import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
  getRecurringInvoiceById,
  updateRecurringInvoice,
  deleteRecurringInvoice,
} from '@/lib/services/recurringInvoiceService'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const recurringInvoice = await getRecurringInvoiceById(params.id)
    
    if (!recurringInvoice) {
      return NextResponse.json(
        { error: 'Recurring invoice not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(recurringInvoice)
  } catch (error) {
    console.error('[API] Error fetching recurring invoice:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const recurringInvoice = await updateRecurringInvoice(params.id, body)

    return NextResponse.json(recurringInvoice)
  } catch (error) {
    console.error('[API] Error updating recurring invoice:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await deleteRecurringInvoice(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Error deleting recurring invoice:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}


