import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateInvoiceFromRecurring } from '@/lib/services/recurringInvoiceService'

/**
 * Cron job endpoint for generating recurring invoices
 * Runs daily at 6 AM UTC
 * Protected by CRON_SECRET
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this header)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('[Cron] CRON_SECRET not configured')
    return NextResponse.json(
      { error: 'Cron secret not configured' },
      { status: 500 }
    )
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }

    // Create admin client to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const today = new Date().toISOString().split('T')[0]

    // Get all active recurring invoices due today
    const { data: recurringInvoices, error: fetchError } = await supabase
      .from('recurring_invoices')
      .select('*')
      .eq('is_active', true)
      .lte('next_run_date', today)
      .or(`end_date.is.null,end_date.gte.${today}`)

    if (fetchError) {
      console.error('[Cron] Error fetching recurring invoices:', fetchError)
      throw new Error('Failed to fetch recurring invoices')
    }

    if (!recurringInvoices || recurringInvoices.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No recurring invoices due today',
        created: 0,
      })
    }

    let created = 0
    const errors: string[] = []

    // Process each recurring invoice
    for (const recurring of recurringInvoices) {
      try {
        // Import here to avoid circular dependencies
        const { generateInvoiceFromRecurring } = await import(
          '@/lib/services/recurringInvoiceService'
        )

        await generateInvoiceFromRecurring(recurring.id)
        created++
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'
        console.error(
          `[Cron] Error generating invoice from recurring ${recurring.id}:`,
          error
        )
        errors.push(`Recurring ${recurring.id}: ${errorMessage}`)
      }
    }

    return NextResponse.json({
      success: true,
      created,
      total: recurringInvoices.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('[Cron] Error processing recurring invoices:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}




