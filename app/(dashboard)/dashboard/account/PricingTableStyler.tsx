'use client'

import { useEffect, useRef } from 'react'

export default function PricingTableStyler({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const stylePrices = () => {
      if (!containerRef.current) return

      // Find all price elements - try multiple approaches
      const cards = containerRef.current.querySelectorAll(
        '[class*="card"], [class*="Card"], [data-clerk-element*="pricingPlan"]'
      )
      
      cards.forEach((card) => {
        // Look for price elements - try various selectors
        const priceSelectors = [
          '[class*="price"]',
          '[class*="Price"]',
          '[class*="amount"]',
          '[class*="Amount"]',
          '[class*="cost"]',
          '[class*="Cost"]',
          'h2',
          'h3',
          'div'
        ]
        
        priceSelectors.forEach(selector => {
          const elements = card.querySelectorAll(selector)
          elements.forEach((el) => {
            const text = el.textContent || ''
            // Check if this element contains a price (starts with $ and has numbers)
            if (text.match(/^\$[\d,]+/)) {
              const htmlEl = el as HTMLElement
              // Find the number part and style it
              const children = Array.from(htmlEl.childNodes)
              children.forEach((node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                  const textContent = node.textContent || ''
                  if (textContent.match(/^\$[\d,]+/)) {
                    // Wrap the number in a span
                    const span = document.createElement('span')
                    span.textContent = textContent
                    span.style.fontSize = '32px'
                    span.style.fontWeight = '600'
                    span.style.lineHeight = '1.2'
                    node.parentNode?.replaceChild(span, node)
                  }
                }
              })
              
              // Also style the element itself if it contains the price
              if (text.match(/^\$[\d,]+/)) {
                htmlEl.style.fontSize = '32px'
                htmlEl.style.fontWeight = '600'
                htmlEl.style.lineHeight = '1.2'
              }
            }
          })
        })
        
        // Also try to find elements that contain "$0" or "$10" etc
        const allElements = card.querySelectorAll('*')
        allElements.forEach((el) => {
          const htmlEl = el as HTMLElement
          const text = htmlEl.textContent || ''
          
          // If element text is just a price like "$0" or "$10"
          if (text.trim().match(/^\$[\d,]+$/)) {
            htmlEl.style.fontSize = '32px'
            htmlEl.style.fontWeight = '600'
            htmlEl.style.lineHeight = '1.2'
          }
          
          // If element contains price at the start
          if (text.match(/^\$[\d,]+/)) {
            // Check if it's the main price element (not a child)
            const parent = htmlEl.parentElement
            if (parent && !parent.textContent?.match(/^\$[\d,]+/)) {
              htmlEl.style.fontSize = '32px'
              htmlEl.style.fontWeight = '600'
              htmlEl.style.lineHeight = '1.2'
            }
          }
        })
      })
    }

    // Try immediately
    stylePrices()

    // Also try after delays (for async rendering)
    const timeout1 = setTimeout(stylePrices, 100)
    const timeout2 = setTimeout(stylePrices, 500)

    // Use MutationObserver to watch for DOM changes
    const observer = new MutationObserver(() => {
      stylePrices()
    })

    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        characterData: true,
      })
    }

    return () => {
      clearTimeout(timeout1)
      clearTimeout(timeout2)
      observer.disconnect()
    }
  }, [])

  return <div ref={containerRef}>{children}</div>
}

