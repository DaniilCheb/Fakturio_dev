import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import PublicInvoiceView from './PublicInvoiceView'

// Create Supabase client with service role for public access
function createPublicSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[Public Invoice] Missing Supabase environment variables')
    return null
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const supabase = createPublicSupabaseClient()

  if (!supabase) {
    notFound()
  }

  // Await params (Next.js 15 requires params to be awaited)
  const { token } = await params

  // Fetch invoice by token (bypasses RLS with service role)
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('view_token', token)
    .single()

  // Fetch project name if project_id exists
  let projectName: string | undefined
  if (invoice?.project_id) {
    const { data: project } = await supabase
      .from('projects')
      .select('name')
      .eq('id', invoice.project_id)
      .single()
    projectName = project?.name
  }

  if (error || !invoice) {
    console.error('[Public Invoice] Error fetching invoice:', error)
    notFound()
  }

  // Check expiration
  if (
    invoice.view_token_expires_at &&
    new Date(invoice.view_token_expires_at) < new Date()
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-design-background">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-semibold text-design-content-default mb-2">
            Link Expired
          </h1>
          <p className="text-design-content-weak">
            This invoice link has expired. Please contact the sender for a new
            link.
          </p>
        </div>
      </div>
    )
  }

  // Track view (fire and forget - don't await)
  supabase
    .from('invoices')
    .update({
      last_viewed_at: new Date().toISOString(),
      view_count: (invoice.view_count || 0) + 1,
    })
    .eq('id', invoice.id)
    .then(
      () => {
        // Silently handle success
      },
      () => {
        // Silently handle errors
      }
    )

  return <PublicInvoiceView invoice={{ ...invoice, projects: projectName ? { name: projectName } : null }} />
}

