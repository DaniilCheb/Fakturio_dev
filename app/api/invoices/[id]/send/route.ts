import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sendInvoiceEmail } from '@/lib/services/emailService'
import { sendInvoiceEmailSchema } from '@/lib/validations/email'
import { apiError } from '@/lib/utils/apiError'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Await params (Next.js 15 requires params to be awaited)
    const { id } = await params

    // Parse and validate request body
    const body = await request.json()
    
    const validationResult = sendInvoiceEmailSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input', 
          details: validationResult.error.flatten().fieldErrors 
        },
        { status: 400 }
      )
    }

    const { recipientEmail } = validationResult.data

    // Send email
    const result = await sendInvoiceEmail(id, recipientEmail)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    })
  } catch (error) {
    console.error('[API] Error sending invoice email:', error)
    return NextResponse.json(
      apiError(error, 'Failed to send invoice email'),
      { status: 500 }
    )
  }
}


