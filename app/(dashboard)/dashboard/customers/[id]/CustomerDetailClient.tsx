"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@clerk/nextjs"
import Link from "next/link"
import { Card, CardContent } from "@/app/components/ui/card"
import StatusBadge from "@/app/components/StatusBadge"
import { EditIcon, DeleteIcon, ProjectsIcon } from "@/app/components/Icons"
import BackLink from "@/app/components/BackLink"
import CountryPicker from "@/app/components/CountryPicker"
import { useConfirmDialog } from "@/app/components/useConfirmDialog"
import { type Contact, type UpdateContactInput, updateContactWithClient, deleteContactWithClient } from "@/lib/services/contactService.client"
import { type Invoice, getInvoiceStatus } from "@/lib/services/invoiceService.client"
import { type Project } from "@/lib/services/projectService.client"
import { formatDate } from "@/lib/utils/dateUtils"
import { formatCurrency } from "@/lib/utils/formatters"
import { createClientSupabaseClient } from "@/lib/supabase-client"

interface CustomerDetailClientProps {
  customer: Contact
  invoices: Invoice[]
  projects: Project[]
}

export default function CustomerDetailClient({ customer: initialCustomer, invoices, projects }: CustomerDetailClientProps) {
  const router = useRouter()
  const { session } = useSession()
  const [customer, setCustomer] = useState(initialCustomer)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { confirm, DialogComponent } = useConfirmDialog()

  const [formData, setFormData] = useState<UpdateContactInput>({
    name: customer.name || '',
    company_name: customer.company_name || '',
    email: customer.email || '',
    phone: customer.phone || '',
    address: customer.address || '',
    city: customer.city || '',
    postal_code: customer.postal_code || '',
    country: customer.country || 'Switzerland',
    vat_number: customer.vat_number || '',
    notes: customer.notes || '',
  })

  const displayName = customer.company_name || customer.name || 'Customer'
  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0)

  const handleChange = (field: keyof UpdateContactInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  const handleSave = async () => {
    if (!session || !formData.name?.trim()) {
      alert('Name is required')
      return
    }

    setIsSaving(true)
    try {
      const supabase = createClientSupabaseClient(session)
      const userId = session.user.id

      const updated = await updateContactWithClient(supabase, userId, customer.id, formData)
      setCustomer(updated)
      setIsEditing(false)
      router.refresh()
    } catch (error) {
      console.error("Error updating customer:", error)
      alert("Failed to update customer. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setFormData({
      name: customer.name || '',
      company_name: customer.company_name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      postal_code: customer.postal_code || '',
      country: customer.country || 'Switzerland',
      vat_number: customer.vat_number || '',
      notes: customer.notes || '',
    })
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (!session) return

    const confirmed = await confirm({
      title: "Delete Customer",
      message: `Are you sure you want to delete "${displayName}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    })

    if (!confirmed) return

    setIsDeleting(true)
    try {
      const supabase = createClientSupabaseClient(session)
      const userId = session.user.id

      await deleteContactWithClient(supabase, userId, customer.id)
      router.push('/dashboard/customers')
    } catch (error) {
      console.error("Error deleting customer:", error)
      alert("Failed to delete customer. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusBadge = (invoice: Invoice) => {
    const status = getInvoiceStatus(invoice)
    // StatusBadge expects 'variant' prop and uses 'pending' (which displays as "Issued")
    return <StatusBadge variant={status} />
  }

  const actionButtons = (
    <div className="flex items-center gap-6">
      {!isEditing ? (
        <>
          <button
            onClick={() => setIsEditing(true)}
            className="flex flex-col items-center gap-1 text-[#555] dark:text-[#aaa] hover:text-[#141414] dark:hover:text-white transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-white dark:bg-[#2a2a2a] border border-[#e0e0e0] dark:border-[#444] flex items-center justify-center hover:bg-[#f5f5f5] dark:hover:bg-[#333] transition-colors">
              <EditIcon size={18} />
            </div>
            <span className="text-[11px] font-medium">Edit</span>
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex flex-col items-center gap-1 text-[#555] dark:text-[#aaa] hover:text-red-600 dark:hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 rounded-full bg-white dark:bg-[#2a2a2a] border border-[#e0e0e0] dark:border-[#444] flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 transition-colors">
              <DeleteIcon size={18} />
            </div>
            <span className="text-[11px] font-medium">Delete</span>
          </button>
        </>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving || !formData.name?.trim()}
            className="px-4 py-2 bg-[#141414] dark:bg-white text-white dark:text-[#141414] rounded-full text-[14px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleCancelEdit}
            disabled={isSaving}
            className="px-4 py-2 border border-[#e0e0e0] dark:border-[#444] text-[#141414] dark:text-white rounded-full text-[14px] font-medium hover:bg-[#f5f5f5] dark:hover:bg-[#2a2a2a] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )

  return (
    <>
      {DialogComponent}
      
      {/* Back link */}
      <BackLink to="/dashboard/customers" label="Customers" />

      {/* Header with Actions */}
      <div className="flex flex-row items-center justify-between gap-4 mb-2">
        <div className="flex flex-col gap-1">
          <h1 className="font-semibold text-[24px] md:text-[32px] text-foreground tracking-tight">
            {displayName}
          </h1>
        </div>
        {actionButtons}
      </div>

      {/* Customer Info Card */}
      <Card>
        <CardContent className="p-6">
          {isEditing ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={handleChange('name')}
                    className="w-full h-[40px] px-3 py-2 bg-design-surface-field border border-design-border-default rounded-lg text-[14px] text-design-content-default placeholder:text-[#9D9B9A] focus:outline-none focus:border-design-content-default transition-colors"
                    placeholder="John Doe"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={handleChange('company_name')}
                    className="w-full h-[40px] px-3 py-2 bg-design-surface-field border border-design-border-default rounded-lg text-[14px] text-design-content-default placeholder:text-[#9D9B9A] focus:outline-none focus:border-design-default transition-colors"
                    placeholder="Acme GmbH"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={handleChange('email')}
                    className="w-full h-[40px] px-3 py-2 bg-design-surface-field border border-design-border-default rounded-lg text-[14px] text-design-content-default placeholder:text-[#9D9B9A] focus:outline-none focus:border-design-content-default transition-colors"
                    placeholder="john@example.com"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange('phone')}
                    className="w-full h-[40px] px-3 py-2 bg-design-surface-field border border-design-border-default rounded-lg text-[14px] text-design-content-default placeholder:text-[#9D9B9A] focus:outline-none focus:border-design-content-default transition-colors"
                    placeholder="+41 44 123 45 67"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                  Street Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={handleChange('address')}
                  className="w-full h-[40px] px-3 py-2 bg-design-surface-field border border-design-border-default rounded-lg text-[14px] text-design-content-default placeholder:text-[#9D9B9A] focus:outline-none focus:border-design-content-default transition-colors"
                  placeholder="Bahnhofstrasse 1"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={handleChange('postal_code')}
                    className="w-full h-[40px] px-3 py-2 bg-design-surface-field border border-design-border-default rounded-lg text-[14px] text-design-content-default placeholder:text-[#9D9B9A] focus:outline-none focus:border-design-content-default transition-colors"
                    placeholder="8001"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={handleChange('city')}
                    className="w-full h-[40px] px-3 py-2 bg-design-surface-field border border-design-border-default rounded-lg text-[14px] text-design-content-default placeholder:text-[#9D9B9A] focus:outline-none focus:border-design-content-default transition-colors"
                    placeholder="Zürich"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                    Country
                  </label>
                  <CountryPicker
                    value={formData.country}
                    onChange={(value) => {
                      const syntheticEvent = {
                        target: { value }
                      } as React.ChangeEvent<HTMLInputElement>
                      handleChange('country')(syntheticEvent)
                    }}
                    placeholder="Switzerland"
                    noLabel
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                  UID/VAT number
                </label>
                <input
                  type="text"
                  value={formData.vat_number}
                  onChange={handleChange('vat_number')}
                  className="w-full h-[40px] px-3 py-2 bg-design-surface-field border border-design-border-default rounded-lg text-[14px] text-design-content-default placeholder:text-[#9D9B9A] focus:outline-none focus:border-design-content-default transition-colors"
                  placeholder="CHE-123.456.789"
                />
              </div>
              {formData.notes !== undefined && (
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={handleChange('notes')}
                    rows={3}
                    className="w-full px-3 py-2 bg-design-surface-field border border-design-border-default rounded-lg text-[14px] text-design-content-default placeholder:text-[#9D9B9A] focus:outline-none focus:border-design-content-default transition-colors resize-none"
                    placeholder="Additional notes..."
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Total Invoiced
                </p>
                <p className="text-[15px] text-foreground">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
              <div>
                <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Invoices
                </p>
                <p className="text-[15px] text-foreground">
                  {invoices.length}
                </p>
              </div>
              <div>
                <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Projects
                </p>
                <p className="text-[15px] text-foreground">
                  {projects.length}
                </p>
              </div>
              {customer.email && (
                <div>
                  <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Email
                  </p>
                  <p className="text-[15px] text-foreground">
                    {customer.email}
                  </p>
                </div>
              )}
              {customer.phone && (
                <div>
                  <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Phone
                  </p>
                  <p className="text-[15px] text-foreground">
                    {customer.phone}
                  </p>
                </div>
              )}
              {(customer.address || customer.postal_code || customer.city) && (
                <div>
                  <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Address
                  </p>
                  <p className="text-[15px] text-foreground">
                    {customer.address && <span>{customer.address}<br/></span>}
                    {customer.postal_code} {customer.city}
                  </p>
                </div>
              )}
              {customer.vat_number && (
                <div>
                  <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    UID/VAT number
                  </p>
                  <p className="text-[15px] text-foreground">
                    {customer.vat_number}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projects Section */}
      <Card>
        <div className="px-6 py-3 border-b flex items-center justify-between">
          <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Projects</p>
          <Link 
            href={`/dashboard/projects/new?contactId=${customer.id}`}
            className="flex items-center gap-2 text-[13px] font-medium text-foreground hover:text-muted-foreground transition-colors"
          >
            <ProjectsIcon size={16} />
            New Project
          </Link>
        </div>
        <CardContent className="p-0">
          {projects.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">No projects yet</p>
            </div>
          ) : (
            <div>
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/dashboard/projects/${project.id}`}
                  className="flex items-center gap-3 px-6 py-4 border-b last:border-none hover:bg-muted/50 transition-colors"
                >
                  <ProjectsIcon size={16} />
                  <span className="font-medium text-[15px] text-foreground">{project.name}</span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoices Section */}
      <Card>
        <div className="px-6 py-3 border-b">
          <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Invoices</p>
        </div>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">No invoices yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="w-full min-w-[600px]">
                {/* Table header */}
                <div 
                  className="grid px-6 py-3 border-b text-[12px] font-medium text-muted-foreground uppercase tracking-wide"
                  style={{ gridTemplateColumns: '1fr 120px 100px 110px 80px' }}
                >
                  <p>Invoice</p>
                  <p>Date</p>
                  <p>Amount</p>
                  <p>Status</p>
                  <p className="text-right">Actions</p>
                </div>
                
                {/* Table rows */}
                {invoices.map((invoice) => (
                  <Link 
                    key={invoice.id}
                    href={`/dashboard/invoices/${invoice.id}`}
                    className="group grid px-6 py-4 border-b last:border-none hover:bg-muted/50 transition-colors items-center"
                    style={{ gridTemplateColumns: '1fr 120px 100px 110px 80px' }}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground text-[15px]">#{invoice.invoice_number || invoice.id}</span>
                    </div>
                    <div className="text-[14px] text-muted-foreground">
                      {formatDate(invoice.issued_on || invoice.created_at)}
                    </div>
                    <div className="text-[14px] font-medium text-foreground">
                      {formatCurrency(invoice.total || 0, invoice.currency)}
                    </div>
                    <div>
                      {getStatusBadge(invoice)}
                    </div>
                    <div className="flex justify-end">
                      <span className="text-[12px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        View →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

