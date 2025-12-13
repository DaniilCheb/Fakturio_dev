import { getContacts, type Contact } from '@/lib/services/contactService'
import { getInvoices } from '@/lib/services/invoiceService'
import { getProjects } from '@/lib/services/projectService'
import CustomersPageContent from './CustomersPageContent'

export interface CustomerWithStats extends Contact {
  invoiceCount: number
  projectCount: number
  totalAmount: number
}

export default async function CustomersPage() {
  let customersWithStats: CustomerWithStats[] = []
  let error: string | null = null

  try {
    // Fetch all data in parallel
    const [allContacts, allInvoices, allProjects] = await Promise.all([
      getContacts(),
      getInvoices(),
      getProjects()
    ])

    // Filter to only show customers (not suppliers)
    const customers = allContacts.filter(contact => contact.type === 'customer')

    // Compute stats for each customer
    customersWithStats = customers.map(customer => {
      const customerInvoices = allInvoices.filter(inv => inv.contact_id === customer.id)
      const customerProjects = allProjects.filter(proj => proj.contact_id === customer.id)
      const totalAmount = customerInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0)

      return {
        ...customer,
        invoiceCount: customerInvoices.length,
        projectCount: customerProjects.length,
        totalAmount
      }
    })
  } catch (e) {
    // For new users who haven't created customers yet, treat as empty state rather than error
    console.error('Error fetching customers (showing empty state):', e)
    error = null
    customersWithStats = []
  }

  return (
    <CustomersPageContent 
      initialCustomers={customersWithStats} 
      error={error}
    />
  )
}
