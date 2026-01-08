import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Img,
  Hr,
  Row,
  Column,
  Preview,
} from '@react-email/components'

interface InvoiceEmailProps {
  invoice: {
    invoice_number: string
    currency: string
    total: number
    subtotal: number
    vat_amount: number
    due_date: string
    issued_on: string
    notes?: string
    from_info: {
      name: string
      company_name?: string
      street?: string
      zip?: string
    }
    to_info: {
      name: string
      address?: string
      zip?: string
    }
    project_name?: string
  }
  viewUrl: string
  recipientName?: string
}

// Design system colors (matching globals.css)
const colors = {
  background: '#f7f5f3',
  surface: '#ffffff',
  surfaceField: '#f7f5f3',
  contentDefault: '#151514',
  contentWeak: '#434343',
  contentWeakest: '#888888',
  border: '#e0e0e0',
  buttonPrimary: '#151514',
  accent: '#F8DA43', // Yellow from logo
}

export default function InvoiceEmail({
  invoice,
  viewUrl,
  recipientName,
}: InvoiceEmailProps) {
  const { from_info, to_info } = invoice

  // Sender display
  const senderCompany = from_info.company_name
  const senderName = from_info.name
  const displayName = senderCompany || senderName

  // Format dates
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  // Calculate days until due
  const dueDate = new Date(invoice.due_date)
  const today = new Date()
  const daysUntilDue = Math.ceil(
    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  const getDueText = () => {
    if (daysUntilDue < 0) return `${Math.abs(daysUntilDue)} days overdue`
    if (daysUntilDue === 0) return 'Due today'
    if (daysUntilDue === 1) return 'Due tomorrow'
    return `Due in ${daysUntilDue} days`
  }

  const getDueColor = () => {
    if (daysUntilDue < 0) return '#dc2626'
    if (daysUntilDue <= 3) return '#f59e0b'
    return colors.contentWeak
  }

  return (
    <Html>
      <Head>
        <style>{`
          @media only screen and (max-width: 600px) {
            .container { padding: 16px !important; }
            .card { padding: 24px !important; }
          }
        `}</style>
      </Head>
      <Preview>
        Invoice {invoice.invoice_number} for {invoice.currency}{' '}
        {invoice.total.toFixed(2)} from {displayName}
      </Preview>
      <Body
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
          backgroundColor: colors.background,
          margin: 0,
          padding: 0,
        }}
      >
        {/* Full width wrapper */}
        <Section style={{ backgroundColor: colors.background, padding: '40px 16px' }}>
          <Container style={{ maxWidth: '600px', margin: '0 auto' }}>
            {/* Logo Header */}
            <Section style={{ marginBottom: '32px' }}>
              <Img
                src={`${process.env.NEXT_PUBLIC_APP_URL || 'https://fakturio.ch'}/LOGO.svg`}
                alt="Fakturio"
                width="120"
                height="26"
                style={{ display: 'block' }}
              />
            </Section>

            {/* Main Card */}
            <Section
              className="card"
              style={{
                backgroundColor: colors.surface,
                borderRadius: '16px',
                border: `1px solid ${colors.border}`,
                padding: '32px',
                marginBottom: '24px',
              }}
            >
              {/* Header */}
              <Text
                style={{
                  fontSize: '28px',
                  fontWeight: '600',
                  color: colors.contentDefault,
                  margin: '0 0 8px',
                  letterSpacing: '-0.5px',
                }}
              >
                You have a new invoice
              </Text>

              <Text
                style={{
                  fontSize: '16px',
                  color: colors.contentWeak,
                  margin: '0 0 28px',
                  lineHeight: '1.5',
                }}
              >
                {senderCompany ? (
                  <>
                    <strong style={{ color: colors.contentDefault }}>
                      {senderName}
                    </strong>{' '}
                    from{' '}
                    <strong style={{ color: colors.contentDefault }}>
                      {senderCompany}
                    </strong>{' '}
                    has sent you an invoice.
                  </>
                ) : (
                  <>
                    <strong style={{ color: colors.contentDefault }}>
                      {senderName}
                    </strong>{' '}
                    has sent you an invoice.
                  </>
                )}
              </Text>

              {/* Amount Card */}
              <Section
                style={{
                  backgroundColor: colors.surfaceField,
                  borderRadius: '12px',
                  padding: '24px',
                  marginBottom: '24px',
                  textAlign: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: '13px',
                    color: colors.contentWeakest,
                    margin: '0 0 8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontWeight: '500',
                  }}
                >
                  Amount Due
                </Text>
                <Text
                  style={{
                    fontSize: '42px',
                    fontWeight: '700',
                    color: colors.contentDefault,
                    margin: '0 0 4px',
                    letterSpacing: '-1px',
                  }}
                >
                  {invoice.currency} {invoice.total.toFixed(2)}
                </Text>
                <Text
                  style={{
                    fontSize: '14px',
                    color: getDueColor(),
                    margin: '0',
                    fontWeight: '500',
                  }}
                >
                  {getDueText()}
                </Text>
              </Section>

              {/* Invoice Details Grid */}
              <Section style={{ marginBottom: '24px' }}>
                <Row>
                  <Column style={{ width: '50%', paddingRight: '12px' }}>
                    <Text
                      style={{
                        fontSize: '12px',
                        color: colors.contentWeakest,
                        margin: '0 0 4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Invoice Number
                    </Text>
                    <Text
                      style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: colors.contentDefault,
                        margin: '0',
                      }}
                    >
                      #{invoice.invoice_number}
                    </Text>
                  </Column>
                  <Column style={{ width: '50%', paddingLeft: '12px' }}>
                    <Text
                      style={{
                        fontSize: '12px',
                        color: colors.contentWeakest,
                        margin: '0 0 4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Issue Date
                    </Text>
                    <Text
                      style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: colors.contentDefault,
                        margin: '0',
                      }}
                    >
                      {formatDate(invoice.issued_on)}
                    </Text>
                  </Column>
                </Row>

                {/* Project row (if available) */}
                {invoice.project_name && (
                  <Row style={{ marginTop: '16px' }}>
                    <Column>
                      <Text
                        style={{
                          fontSize: '12px',
                          color: colors.contentWeakest,
                          margin: '0 0 4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Project
                      </Text>
                      <Text
                        style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: colors.contentDefault,
                          margin: '0',
                        }}
                      >
                        {invoice.project_name}
                      </Text>
                    </Column>
                  </Row>
                )}
              </Section>

              <Hr
                style={{
                  borderColor: colors.border,
                  borderWidth: '1px',
                  margin: '24px 0',
                }}
              />

              {/* QR Code Section */}
              <Section style={{ textAlign: 'center', marginBottom: '28px' }}>
                <Text
                  style={{
                    fontSize: '14px',
                    color: colors.contentWeak,
                    margin: '0 0 16px',
                  }}
                >
                  Scan with your banking app to pay
                </Text>
                <Section
                  style={{
                    display: 'inline-block',
                    backgroundColor: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '12px',
                    padding: '12px',
                  }}
                >
                  <Img
                    src="cid:payment-qr"
                    alt="Swiss Payment QR Code"
                    width="160"
                    height="160"
                    style={{ display: 'block' }}
                  />
                </Section>
              </Section>

              {/* CTA Button */}
              <Section style={{ textAlign: 'center' }}>
                <Button
                  href={viewUrl}
                  style={{
                    backgroundColor: colors.buttonPrimary,
                    color: '#ffffff',
                    padding: '16px 32px',
                    borderRadius: '100px',
                    fontSize: '16px',
                    fontWeight: '600',
                    textDecoration: 'none',
                    display: 'inline-block',
                  }}
                >
                  View Invoice & Download PDF
                </Button>
              </Section>
            </Section>

            {/* Footer Card */}
            <Section
              style={{
                backgroundColor: colors.surface,
                borderRadius: '12px',
                border: `1px solid ${colors.border}`,
                padding: '20px 24px',
              }}
            >
              <Row>
                <Column style={{ width: '50%' }}>
                  <Text
                    style={{
                      fontSize: '12px',
                      color: colors.contentWeakest,
                      margin: '0 0 4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    From
                  </Text>
                  <Text
                    style={{
                      fontSize: '14px',
                      color: colors.contentDefault,
                      margin: '0',
                      fontWeight: '500',
                    }}
                  >
                    {senderCompany || senderName}
                  </Text>
                  {senderCompany && (
                    <Text
                      style={{
                        fontSize: '13px',
                        color: colors.contentWeak,
                        margin: '2px 0 0',
                      }}
                    >
                      {senderName}
                    </Text>
                  )}
                  {from_info.street && (
                    <Text
                      style={{
                        fontSize: '13px',
                        color: colors.contentWeak,
                        margin: '2px 0 0',
                      }}
                    >
                      {from_info.street}
                    </Text>
                  )}
                  {from_info.zip && (
                    <Text
                      style={{
                        fontSize: '13px',
                        color: colors.contentWeak,
                        margin: '2px 0 0',
                      }}
                    >
                      {from_info.zip}
                    </Text>
                  )}
                </Column>
                <Column style={{ width: '50%' }}>
                  <Text
                    style={{
                      fontSize: '12px',
                      color: colors.contentWeakest,
                      margin: '0 0 4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    To
                  </Text>
                  <Text
                    style={{
                      fontSize: '14px',
                      color: colors.contentDefault,
                      margin: '0',
                      fontWeight: '500',
                    }}
                  >
                    {to_info.name}
                  </Text>
                  {to_info.address && (
                    <Text
                      style={{
                        fontSize: '13px',
                        color: colors.contentWeak,
                        margin: '2px 0 0',
                      }}
                    >
                      {to_info.address}
                    </Text>
                  )}
                  {to_info.zip && (
                    <Text
                      style={{
                        fontSize: '13px',
                        color: colors.contentWeak,
                        margin: '2px 0 0',
                      }}
                    >
                      {to_info.zip}
                    </Text>
                  )}
                </Column>
              </Row>
            </Section>

            {/* Powered by footer */}
            <Section style={{ textAlign: 'center', marginTop: '32px' }}>
              <Text
                style={{
                  fontSize: '12px',
                  color: colors.contentWeakest,
                  margin: '0',
                }}
              >
                Sent via{' '}
                <a
                  href="https://fakturio.ch"
                  style={{
                    color: colors.contentWeak,
                    textDecoration: 'none',
                  }}
                >
                  Fakturio
                </a>
                {' '}• Swiss Invoice Management
              </Text>
            </Section>
          </Container>
        </Section>
      </Body>
    </Html>
  )
}




