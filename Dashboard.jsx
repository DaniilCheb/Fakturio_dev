import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, getInvoices, deleteInvoice, getInvoiceStatus, getAccountCurrency, importGuestInvoice } from '../context/AuthContext'
import { formatCurrency, formatDate } from '../utils/formatters'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import { BarChart } from '@mui/x-charts'
import PageLayout from '../components/PageLayout'
import Button from './app/components/Button'
import Header from '../components/Header'
import Card from '../components/Card'
import { InvoiceRowSkeleton } from '../components/Skeleton'
import { DownloadIcon, DeleteIcon, PlusIcon } from '../components/Icons'

export default function Dashboard() {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [hoveredMonth, setHoveredMonth] = useState(null)
  const [timePeriod, setTimePeriod] = useState('this-year') // 'this-year' or 'last-12-months'
  const [showTimePeriodDropdown, setShowTimePeriodDropdown] = useState(false)
  const [accountCurrency, setAccountCurrency] = useState('CHF')

  useEffect(() => {
    if (user) {
      // Check if there's a guest invoice to import
      const importedInvoice = importGuestInvoice(user.id)
      if (importedInvoice) {
        // Redirect to the imported invoice
        navigate(`/invoices/${importedInvoice.id}`)
        return
      }
      
      const userInvoices = getInvoices(user.id)
      // Sort by date, newest first
      userInvoices.sort((a, b) => {
        const dateA = new Date(a.invoiceData?.issuedOn || 0)
        const dateB = new Date(b.invoiceData?.issuedOn || 0)
        return dateB - dateA
      })
      setInvoices(userInvoices)
      setAccountCurrency(getAccountCurrency(user.id))
      setIsLoading(false)
    }
  }, [user, navigate])

  const handleDelete = (invoiceId) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      const updated = deleteInvoice(user.id, invoiceId)
      setInvoices(updated)
    }
  }

  const handleDownload = (invoice) => {
    alert('Download functionality will be implemented')
  }


  // Get the issued date from an invoice
  const getIssuedDate = (inv) => {
    // Use invoiceData.issuedOn if available, otherwise fall back to createdAt
    if (inv.invoiceData?.issuedOn) {
      return new Date(inv.invoiceData.issuedOn)
    }
    return new Date(inv.createdAt)
  }

  // Get available years from invoices data
  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear()
    const years = new Set()
    
    invoices.forEach(inv => {
      const invDate = getIssuedDate(inv)
      const year = invDate.getFullYear()
      // Only add years that are not the current year (current year is covered by "This Year")
      if (year !== currentYear) {
        years.add(year)
      }
    })
    
    return Array.from(years).sort((a, b) => b - a) // Sort descending (newest first)
  }

  const availableYears = getAvailableYears()

  // Calculate monthly data based on selected time period
  const getMonthlyData = () => {
    const months = []
    const now = new Date()
    let startDate
    let targetYear
    
    // Check if timePeriod is a specific year (e.g., 'year-2024')
    if (timePeriod.startsWith('year-')) {
      targetYear = parseInt(timePeriod.replace('year-', ''))
      startDate = new Date(targetYear, 0, 1)
      
      for (let i = 0; i < 12; i++) {
        const date = new Date(targetYear, i, 1)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const monthLabel = date.toLocaleDateString('en-US', { month: 'short' })
        const monthLabelFull = date.toLocaleDateString('en-US', { month: 'long' })
        
        const monthTotal = invoices.reduce((sum, inv) => {
          const invDate = getIssuedDate(inv)
          const invMonthKey = `${invDate.getFullYear()}-${String(invDate.getMonth() + 1).padStart(2, '0')}`
          if (invMonthKey === monthKey) {
            return sum + (inv.grandTotal || 0)
          }
          return sum
        }, 0)
        
        const monthCount = invoices.filter(inv => {
          const invDate = getIssuedDate(inv)
          const invMonthKey = `${invDate.getFullYear()}-${String(invDate.getMonth() + 1).padStart(2, '0')}`
          return invMonthKey === monthKey
        }).length
        
        months.push({ label: monthLabel, labelFull: monthLabelFull, amount: monthTotal, count: monthCount })
      }
    } else if (timePeriod === 'this-year') {
      // This year: Jan to Dec of current year
      const currentYear = now.getFullYear()
      startDate = new Date(currentYear, 0, 1)
      
      for (let i = 0; i < 12; i++) {
        const date = new Date(currentYear, i, 1)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const monthLabel = date.toLocaleDateString('en-US', { month: 'short' })
        const monthLabelFull = date.toLocaleDateString('en-US', { month: 'long' })
        
        const monthTotal = invoices.reduce((sum, inv) => {
          const invDate = getIssuedDate(inv)
          const invMonthKey = `${invDate.getFullYear()}-${String(invDate.getMonth() + 1).padStart(2, '0')}`
          if (invMonthKey === monthKey) {
            return sum + (inv.grandTotal || 0)
          }
          return sum
        }, 0)
        
        const monthCount = invoices.filter(inv => {
          const invDate = getIssuedDate(inv)
          const invMonthKey = `${invDate.getFullYear()}-${String(invDate.getMonth() + 1).padStart(2, '0')}`
          return invMonthKey === monthKey
        }).length
        
        months.push({ label: monthLabel, labelFull: monthLabelFull, amount: monthTotal, count: monthCount })
      }
    } else {
      // Last 12 months
      startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1)
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const monthLabel = date.toLocaleDateString('en-US', { month: 'short' })
        const monthLabelFull = date.toLocaleDateString('en-US', { month: 'long' })
        
        const monthTotal = invoices.reduce((sum, inv) => {
          const invDate = getIssuedDate(inv)
          const invMonthKey = `${invDate.getFullYear()}-${String(invDate.getMonth() + 1).padStart(2, '0')}`
          if (invMonthKey === monthKey) {
            return sum + (inv.grandTotal || 0)
          }
          return sum
        }, 0)
        
        const monthCount = invoices.filter(inv => {
          const invDate = getIssuedDate(inv)
          const invMonthKey = `${invDate.getFullYear()}-${String(invDate.getMonth() + 1).padStart(2, '0')}`
          return invMonthKey === monthKey
        }).length
        
        months.push({ label: monthLabel, labelFull: monthLabelFull, amount: monthTotal, count: monthCount })
      }
    }

    return { months, startDate }
  }

  const { months: monthlyData, startDate: periodStartDate } = getMonthlyData()
  const maxAmount = Math.max(...monthlyData.map(m => m.amount), 1)

  // Calculate totals for selected period
  const periodInvoices = invoices.filter(inv => {
    const invDate = getIssuedDate(inv)
    if (timePeriod.startsWith('year-')) {
      const targetYear = parseInt(timePeriod.replace('year-', ''))
      return invDate.getFullYear() === targetYear
    }
    if (timePeriod === 'this-year') {
      return invDate.getFullYear() === new Date().getFullYear()
    }
    return invDate >= periodStartDate
  })
  const totalInvoices = periodInvoices.length
  const totalAmount = periodInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0)

  return (
    <PageLayout>
          <Header 
            title="Invoices" 
            actions={
              <Link to="/new-invoice">
                <Button variant="primary" className="gap-2">
                  <PlusIcon />
                  {t('dashboard.newInvoice')}
                </Button>
              </Link>
            }
          />

          {/* Stats & Chart */}
          <div className="bg-white dark:bg-[#252525] border border-[#e0e0e0] dark:border-[#333] rounded-xl shadow-sm transition-colors duration-200">
            {/* Custom Header with Dropdown */}
            <div className="px-6 h-[42px] flex items-center bg-white dark:bg-[#2a2a2a] border-b border-[#e0e0e0] dark:border-[#333] rounded-t-xl">
              <div className="relative inline-block">
                <button
                  onClick={() => setShowTimePeriodDropdown(!showTimePeriodDropdown)}
                  className="flex items-center gap-0 text-[12px] font-semibold text-[#666666] dark:text-[#999] uppercase tracking-wide hover:text-[#141414] dark:hover:text-white transition-colors"
                >
                  {timePeriod === 'this-year' 
                    ? t('dashboard.thisYear') 
                    : timePeriod === 'last-12-months' 
                      ? t('dashboard.last12Months')
                      : timePeriod.replace('year-', '')}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 10L12 15L17 10H7Z"/>
                  </svg>
                </button>
                {showTimePeriodDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowTimePeriodDropdown(false)} />
                    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-[#2a2a2a] border border-[#e0e0e0] dark:border-[#444] rounded-lg shadow-lg z-20 min-w-[160px] py-1">
                      <button
                        onClick={() => { setTimePeriod('this-year'); setShowTimePeriodDropdown(false); }}
                        className={`w-full px-4 py-2 text-left text-[13px] hover:bg-[#f5f5f5] dark:hover:bg-[#333] transition-colors ${timePeriod === 'this-year' ? 'text-[#141414] dark:text-white font-medium' : 'text-[#666] dark:text-[#999]'}`}
                      >
                        {t('dashboard.thisYear')}
                      </button>
                      <button
                        onClick={() => { setTimePeriod('last-12-months'); setShowTimePeriodDropdown(false); }}
                        className={`w-full px-4 py-2 text-left text-[13px] hover:bg-[#f5f5f5] dark:hover:bg-[#333] transition-colors ${timePeriod === 'last-12-months' ? 'text-[#141414] dark:text-white font-medium' : 'text-[#666] dark:text-[#999]'}`}
                      >
                        {t('dashboard.last12Months')}
                      </button>
                      {availableYears.map(year => (
                        <button
                          key={year}
                          onClick={() => { setTimePeriod(`year-${year}`); setShowTimePeriodDropdown(false); }}
                          className={`w-full px-4 py-2 text-left text-[13px] hover:bg-[#f5f5f5] dark:hover:bg-[#333] transition-colors ${timePeriod === `year-${year}` ? 'text-[#141414] dark:text-white font-medium' : 'text-[#666] dark:text-[#999]'}`}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="p-6">
            <div className="flex flex-col gap-6 md:gap-8">
              {/* Stats */}
              <div className="flex flex-col md:flex-row gap-4 md:gap-0">
                <div className="flex-1 flex flex-col gap-1">
                  <p className="text-[14px] text-[#666666] dark:text-[#aaa]">
                    {hoveredMonth !== null ? monthlyData[hoveredMonth]?.labelFull : t('dashboard.totalInvoiced')}
                  </p>
                  <p className="text-[24px] md:text-[32px] font-semibold text-[#141414] dark:text-white transition-all duration-150">
                    {formatCurrency(hoveredMonth !== null ? monthlyData[hoveredMonth]?.amount || 0 : totalAmount)}
                  </p>
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <p className="text-[14px] text-[#666666] dark:text-[#aaa]">{t('dashboard.monthlyAverage')}</p>
                  <p className="text-[24px] md:text-[32px] font-semibold text-[#141414] dark:text-white transition-all duration-150">
                    {formatCurrency(totalAmount / 12, accountCurrency)}
                  </p>
                </div>
              </div>

              {/* Monthly Chart */}
              <div 
                className="hidden md:block h-[140px] md:h-[180px] -ml-10 -mr-2 -mb-8"
                onMouseLeave={() => setHoveredMonth(null)}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const x = e.clientX - rect.left
                  const chartWidth = rect.width
                  const bandIndex = Math.floor((x / chartWidth) * 12)
                  if (bandIndex >= 0 && bandIndex < 12) {
                    setHoveredMonth(bandIndex)
                  }
                }}
              >
                <BarChart
                  xAxis={[{ 
                    scaleType: 'band', 
                    data: monthlyData.map(m => m.label),
                    tickLabelStyle: {
                      fontSize: 11,
                      fill: isDark ? '#666' : '#999'
                    },
                    categoryGapRatio: 0.4
                  }]}
                  yAxis={[{ disableLine: true, disableTicks: true, tickLabelStyle: { display: 'none' }, min: 0 }]}
                  leftAxis={null}
                  series={[{ 
                    data: monthlyData.map(m => m.amount),
                    color: '#2A9D8F',
                    highlightScope: { highlight: 'item', fade: 'global' },
                  }]}
                  height={180}
                  margin={{ top: 10, bottom: 30, left: 0, right: 0 }}
                  tooltip={{ trigger: 'none' }}
                  slots={{ tooltip: () => null }}
                  axisHighlight={{ x: 'none', y: 'none' }}
                  onAxisClick={(event, data) => {
                    if (data?.dataIndex !== undefined) {
                      setHoveredMonth(data.dataIndex)
                    }
                  }}
                  onHighlightChange={(highlight) => {
                    if (highlight?.dataIndex !== undefined) {
                      setHoveredMonth(highlight.dataIndex)
                    }
                  }}
                  sx={{
                    '& .MuiChartsAxis-left': { display: 'none' },
                    '& .MuiChartsAxis-bottom .MuiChartsAxis-line': { display: 'none' },
                    '& .MuiChartsAxis-bottom .MuiChartsAxis-tick': { display: 'none' },
                    '& .MuiBarElement-root': {
                      transition: 'opacity 0.2s ease',
                    },
                    '& .MuiChartsAxisHighlight-root': {
                      fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    },
                  }}
                  slotProps={{
                    bar: {
                      rx: 4,
                      ry: 4,
                    },
                  }}
                />
              </div>
            </div>
            </div>
          </div>

          {/* Invoices List */}
          <div className="bg-white dark:bg-[#252525] border border-[#e0e0e0] dark:border-[#333] rounded-xl shadow-sm overflow-hidden transition-colors duration-200">
            <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex flex-col">
                {/* Table Header */}
                <div 
                  className="grid gap-4 px-6 h-[42px] items-center bg-white dark:bg-[#2a2a2a] border-b border-[#e0e0e0] dark:border-[#333] text-[12px] font-semibold text-[#666666] dark:text-[#999] uppercase tracking-wide"
                  style={{ gridTemplateColumns: '1fr 100px 110px 80px 56px' }}
                >
                  <div>{t('dashboard.client')}</div>
                  <div>{t('dashboard.date')}</div>
                  <div>{t('dashboard.amount')}</div>
                  <div>{t('dashboard.status')}</div>
                  <div className="text-right">{t('dashboard.actions')}</div>
                </div>
                {/* Skeleton Rows */}
                <InvoiceRowSkeleton />
                <InvoiceRowSkeleton />
                <InvoiceRowSkeleton />
              </div>
            ) : invoices.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-[#f5f5f5] dark:bg-[#333] rounded-full flex items-center justify-center mb-4">
                  <DocumentIcon className="w-8 h-8 text-[#999999] dark:text-[#666]" />
                </div>
                <h3 className="font-semibold text-[18px] text-[#141414] dark:text-white mb-2">{t('dashboard.noInvoicesYet')}</h3>
                <p className="text-[#666666] dark:text-[#999] mb-6 max-w-xs">{t('dashboard.noInvoicesDesc')}</p>
                <Link to="/new-invoice">
                  <Button variant="primary">{t('dashboard.createInvoice')}</Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col">
                {/* Table Header */}
                <div 
                  className="grid gap-4 px-6 h-[42px] items-center bg-white dark:bg-[#2a2a2a] border-b border-[#e0e0e0] dark:border-[#333] text-[12px] font-semibold text-[#666666] dark:text-[#999] uppercase tracking-wide"
                  style={{ gridTemplateColumns: '1fr 100px 110px 80px 56px' }}
                >
                  <div>{t('dashboard.client')}</div>
                  <div>{t('dashboard.date')}</div>
                  <div>{t('dashboard.amount')}</div>
                  <div>{t('dashboard.status')}</div>
                  <div className="text-right">{t('dashboard.actions')}</div>
                </div>

                {/* Table Body */}
                {invoices.map((invoice, index) => {
                  const status = getInvoiceStatus(invoice)
                  return (
                  <Link 
                    key={`${invoice.id}-${index}`}
                    to={`/invoices/${invoice.id}`}
                    className="grid gap-4 px-6 py-4 border-b border-[#f0f0f0] dark:border-[#333] last:border-none items-center hover:bg-[#fcfcfc] dark:hover:bg-[#2a2a2a] transition-colors group cursor-pointer"
                    style={{ gridTemplateColumns: '1fr 100px 110px 80px 56px' }}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-[#141414] dark:text-white text-[15px]">{invoice.toData?.name || t('dashboard.unknownClient')}</span>
                      <span className="text-[13px] text-[#666666] dark:text-[#999]">#{invoice.invoiceData?.invoiceNumber}</span>
                    </div>
                    <div className="text-[14px] text-[#555555] dark:text-[#aaa]">
                      {formatDate(invoice.createdAt)}
                    </div>
                    <div className="text-[14px] font-medium text-[#141414] dark:text-white">
                      {formatCurrency(invoice.grandTotal, invoice.invoiceData?.currency)}
                    </div>
                    <div>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[12px] font-normal ${
                        status === 'paid' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : status === 'overdue'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {t(`dashboard.${status}`)}
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.preventDefault(); handleDownload(invoice); }}
                        className="p-2 text-[#555555] dark:text-[#aaa] hover:text-[#141414] dark:hover:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#333] rounded-full transition-colors"
                        title={t('common.download')}
                      >
                        <DownloadIcon size={16} />
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); handleDelete(invoice.id); }}
                        className="p-2 text-[#555555] dark:text-[#aaa] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                        title={t('common.delete')}
                      >
                        <DeleteIcon size={16} />
                      </button>
                    </div>
                  </Link>
                  )
                })}
              </div>
            )}
            </div>
          </div>

    </PageLayout>
  )
}

const DocumentIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
)
