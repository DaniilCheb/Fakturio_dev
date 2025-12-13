import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth, getInvoiceById, updateInvoiceStatus, getInvoiceStatus, getUserProfile, duplicateInvoice, getProjectById, getDefaultBankAccount, getLogo } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { previewInvoicePDF, downloadInvoicePDF } from '../utils/pdfGenerator'
import { formatCurrency, formatDate } from '../utils/formatters'
import PageLayout from '../components/PageLayout'
import Button from '../components/Button'
import StatusBadge from '../components/StatusBadge'
import { DownloadIcon, EditIcon, CopyIcon, PreviewIcon } from '../components/Icons'
import BackLink from '../components/BackLink'

// Check Icon (local, as it's specific to this page)
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.3334 4L6.00002 11.3333L2.66669 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState(null)
  const [project, setProject] = useState(null)

  useEffect(() => {
    if (user && id) {
      const inv = getInvoiceById(user.id, id)
      setInvoice(inv)
      const profile = getUserProfile(user.id)
      setUserProfile(profile)
      
      // Fetch project if invoice has one
      if (inv?.projectId) {
        const proj = getProjectById(user.id, inv.projectId)
        setProject(proj)
      }
      
      setLoading(false)
    }
  }, [user, id])


  const getDaysUntilDue = () => {
    if (!invoice?.dueDate) return null
    const due = new Date(invoice.dueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    due.setHours(0, 0, 0, 0)
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24))
    return diff
  }

  const handleMarkAsPaid = () => {
    if (user && invoice) {
      updateInvoiceStatus(user.id, invoice.id, 'paid')
      setInvoice({ ...invoice, status: 'paid' })
    }
  }

  const handleMarkAsIssued = () => {
    if (user && invoice) {
      updateInvoiceStatus(user.id, invoice.id, 'issued')
      setInvoice({ ...invoice, status: 'issued' })
    }
  }

  const getPdfData = () => {
    if (!invoice) return null
    
    // Get default bank account for IBAN
    const defaultBankAccount = user ? getDefaultBankAccount(user.id) : null
    
    // Get user logo
    const userLogo = user ? getLogo(user.id) : null
    
    // Merge fromData with user profile data (for IBAN etc)
    const fromDataWithProfile = {
      ...invoice.fromData,
      companyName: invoice.fromData?.companyName || userProfile?.companyName || '',
      name: invoice.fromData?.name || userProfile?.name || '',
      street: invoice.fromData?.street || userProfile?.street || '',
      zip: invoice.fromData?.zip || userProfile?.zip || '',
      email: invoice.fromData?.email || userProfile?.email || '',
      telephone: invoice.fromData?.telephone || userProfile?.telephone || '',
      website: invoice.fromData?.website || userProfile?.website || '',
      iban: invoice.fromData?.iban || defaultBankAccount?.iban || userProfile?.iban || '',
      logo: userLogo
    }
    
    return {
      invoiceData: invoice.invoiceData || {},
      fromData: fromDataWithProfile,
      toData: invoice.toData || {},
      items: invoice.items || [],
      productsData: invoice.productsData || { discount: '0', tax: '8.1' },
      paymentMethod: invoice.paymentMethod || 'Bank',
      includeQRCode: true,
      qrCodeDataUrl: null,
      vatSettings: invoice.vatSettings || { mode: 'additive', defaultRate: 8.1 }
    }
  }

  const handlePreviewPDF = async () => {
    const pdfData = getPdfData()
    if (!pdfData) return
    
    try {
      await previewInvoicePDF(pdfData)
    } catch (error) {
      console.error('Error previewing PDF:', error)
      alert('Error previewing PDF. Please try again.')
    }
  }

  const handleDownloadPDF = async () => {
    const pdfData = getPdfData()
    if (!pdfData) return
    
    try {
      await downloadInvoicePDF(pdfData)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('Error downloading PDF. Please try again.')
    }
  }

  const handleDuplicate = () => {
    if (user && invoice) {
      const duplicated = duplicateInvoice(user.id, invoice.id)
      if (duplicated) {
        navigate(`/invoices/${duplicated.id}`)
      }
    }
  }

  if (loading) {
    return (
      <PageLayout>
            <p className="text-[#666666] dark:text-[#999]">Loading...</p>
      </PageLayout>
    )
  }

  if (!invoice) {
    return (
      <PageLayout>
            <p className="text-[#666666] dark:text-[#999]">Invoice not found</p>
            <Link to="/dashboard" className="text-[#141414] dark:text-white underline mt-4 inline-block">
              Back to Dashboard
            </Link>
      </PageLayout>
    )
  }

  const currentStatus = getInvoiceStatus(invoice)
  const daysUntilDue = getDaysUntilDue()
  const currency = invoice.invoiceData?.currency || 'CHF'

  return (
    <PageLayout>
          {/* Back Button */}
          <BackLink to="/dashboard" label={t('dashboard.title')} />

          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-[28px] font-semibold text-[#141414] dark:text-white">
                Invoice {invoice.invoiceData?.invoiceNumber || invoice.id}
              </h1>
              <div className="flex items-center gap-3">
                <StatusBadge status={currentStatus} />
                {daysUntilDue !== null && currentStatus !== 'paid' && (
                  <span className="text-[13px] text-[#666666] dark:text-[#999]">
                    {daysUntilDue > 0 
                      ? `Due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`
                      : daysUntilDue === 0 
                        ? 'Due today'
                        : `${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) === 1 ? '' : 's'} overdue`
                    }
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <Link to={`/invoices/${id}/edit`} className="flex flex-col items-center gap-1 text-[#555] dark:text-[#aaa] hover:text-[#141414] dark:hover:text-white transition-colors">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-[#2a2a2a] border border-[#e0e0e0] dark:border-[#444] flex items-center justify-center hover:bg-[#f5f5f5] dark:hover:bg-[#333] transition-colors">
                  <EditIcon size={18} />
                </div>
                <span className="text-[11px] font-medium">{t('invoiceDetail.edit')}</span>
              </Link>
              <button onClick={handlePreviewPDF} className="flex flex-col items-center gap-1 text-[#555] dark:text-[#aaa] hover:text-[#141414] dark:hover:text-white transition-colors">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-[#2a2a2a] border border-[#e0e0e0] dark:border-[#444] flex items-center justify-center hover:bg-[#f5f5f5] dark:hover:bg-[#333] transition-colors">
                  <PreviewIcon size={18} />
                </div>
                <span className="text-[11px] font-medium">Preview</span>
              </button>
              <button onClick={handleDownloadPDF} className="flex flex-col items-center gap-1 text-[#555] dark:text-[#aaa] hover:text-[#141414] dark:hover:text-white transition-colors">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-[#2a2a2a] border border-[#e0e0e0] dark:border-[#444] flex items-center justify-center hover:bg-[#f5f5f5] dark:hover:bg-[#333] transition-colors">
                  <DownloadIcon size={18} />
                </div>
                <span className="text-[11px] font-medium">Download</span>
              </button>
              <button onClick={handleDuplicate} className="flex flex-col items-center gap-1 text-[#555] dark:text-[#aaa] hover:text-[#141414] dark:hover:text-white transition-colors">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-[#2a2a2a] border border-[#e0e0e0] dark:border-[#444] flex items-center justify-center hover:bg-[#f5f5f5] dark:hover:bg-[#333] transition-colors">
                  <CopyIcon size={18} />
                </div>
                <span className="text-[11px] font-medium">Duplicate</span>
              </button>
              {currentStatus !== 'paid' ? (
                <button onClick={handleMarkAsPaid} className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-[#141414] dark:bg-white text-white dark:text-[#141414] flex items-center justify-center">
                    <CheckIcon />
                  </div>
                  <span className="text-[11px] font-medium text-[#141414] dark:text-white">Mark Paid</span>
                </button>
              ) : (
                <button onClick={handleMarkAsIssued} className="flex flex-col items-center gap-1 text-[#555] dark:text-[#aaa] hover:text-[#141414] dark:hover:text-white transition-colors">
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-[#2a2a2a] border border-[#e0e0e0] dark:border-[#444] flex items-center justify-center hover:bg-[#f5f5f5] dark:hover:bg-[#333] transition-colors">
                    <CheckIcon />
                  </div>
                  <span className="text-[11px] font-medium">Mark Issued</span>
                </button>
              )}
            </div>
          </div>

          {/* Invoice Info Card */}
          <div className="bg-white dark:bg-[#252525] border border-[#e0e0e0] dark:border-[#333] rounded-xl shadow-sm">
            {/* Client Info */}
            <div className="p-6 border-b border-[#f0f0f0] dark:border-[#333]">
              <h2 className="text-[18px] font-semibold text-[#141414] dark:text-white mb-3">
                {invoice.toData?.name || 'Client'}
              </h2>
              <div className="text-[14px] text-[#666666] dark:text-[#999] space-y-1">
                {invoice.toData?.address && <p>{invoice.toData.address}</p>}
                {invoice.toData?.zip && <p>{invoice.toData.zip}</p>}
                {invoice.toData?.uid && (
                  <p className="mt-2">
                    <span className="text-[#999999] dark:text-[#666]">UID: </span>
                    {invoice.toData.uid}
                  </p>
                )}
              </div>
            </div>

            {/* Invoice Details Grid */}
            <div className="p-6 border-b border-[#f0f0f0] dark:border-[#333]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-[12px] font-medium text-[#999999] dark:text-[#666] uppercase tracking-wide mb-1">{t('invoiceDetail.issuedOn')}</p>
                  <p className="text-[14px] text-[#141414] dark:text-white">
                    {formatDate(invoice.invoiceData?.issuedOn || invoice.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium text-[#999999] dark:text-[#666] uppercase tracking-wide mb-1">{t('invoiceDetail.due')}</p>
                  <p className="text-[14px] text-[#141414] dark:text-white">
                    {formatDate(invoice.dueDate)}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium text-[#999999] dark:text-[#666] uppercase tracking-wide mb-1">{t('invoiceDetail.invoiceNumber')}</p>
                  <p className="text-[14px] text-[#141414] dark:text-white">
                    {invoice.invoiceData?.invoiceNumber || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium text-[#999999] dark:text-[#666] uppercase tracking-wide mb-1">{t('invoiceDetail.issuedBy')}</p>
                  <p className="text-[14px] text-[#141414] dark:text-white">
                    {invoice.fromData?.name || userProfile?.name || user?.name || '-'}
                  </p>
                </div>
                {project && (
                  <div>
                    <p className="text-[12px] font-medium text-[#999999] dark:text-[#666] uppercase tracking-wide mb-1">{t('invoiceCreator.project')}</p>
                    <Link 
                      to={`/projects/${project.id}`}
                      className="text-[14px] text-[#141414] dark:text-white hover:underline"
                    >
                      {project.name}
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Line Items */}
            <div className="p-6">
              <div className="mb-4">
                <div className="grid grid-cols-12 gap-4 pb-2 border-b border-[#f0f0f0] dark:border-[#333] text-[11px] font-medium text-[#999999] dark:text-[#666] uppercase tracking-wide">
                  <div className="col-span-6">Description</div>
                  <div className="col-span-2 text-right">Qty</div>
                  <div className="col-span-2 text-right">Price</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>
              </div>
              
              <div className="space-y-3">
                {invoice.items?.map((item, index) => {
                  const qty = parseFloat(item.quantity) || 0
                  const price = parseFloat(item.pricePerUm) || 0
                  const total = qty * price
                  
                  return (
                    <div key={index} className="grid grid-cols-12 gap-4 text-[14px]">
                      <div className="col-span-6 text-[#141414] dark:text-white">
                        {item.description || 'Item'}
                        {item.um && <span className="text-[#999999] dark:text-[#666] ml-1">({item.um})</span>}
                      </div>
                      <div className="col-span-2 text-right text-[#666666] dark:text-[#999]">{qty}</div>
                      <div className="col-span-2 text-right text-[#666666] dark:text-[#999]">{formatCurrency(price, currency)}</div>
                      <div className="col-span-2 text-right font-medium text-[#141414] dark:text-white">{formatCurrency(total, currency)}</div>
                    </div>
                  )
                })}
              </div>

              {/* Total */}
              <div className="mt-6 pt-4 border-t border-[#e0e0e0] dark:border-[#444] flex justify-end">
                <div className="text-right">
                  <p className="text-[12px] font-medium text-[#999999] dark:text-[#666] uppercase tracking-wide mb-1">Total</p>
                  <p className="text-[24px] font-semibold text-[#141414] dark:text-white">
                    {formatCurrency(invoice.grandTotal, currency)}
                  </p>
                </div>
              </div>
            </div>
          </div>

    </PageLayout>
  )
}

