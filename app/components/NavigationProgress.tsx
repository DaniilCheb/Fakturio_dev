'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export default function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isNavigating, setIsNavigating] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // When pathname or searchParams change, navigation has completed
    setIsNavigating(false)
    setProgress(100)
    
    // Reset progress after animation
    const timeout = setTimeout(() => {
      setProgress(0)
    }, 200)

    return () => clearTimeout(timeout)
  }, [pathname, searchParams])

  useEffect(() => {
    // Listen for navigation start
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest('a')
      
      if (link && link.href && !link.href.startsWith('#')) {
        const url = new URL(link.href)
        const currentUrl = new URL(window.location.href)
        
        // Only show progress for internal navigation to different paths
        if (url.origin === currentUrl.origin && url.pathname !== currentUrl.pathname) {
          setIsNavigating(true)
          setProgress(20)
          
          // Simulate progress
          const interval = setInterval(() => {
            setProgress(prev => {
              if (prev >= 90) {
                clearInterval(interval)
                return prev
              }
              return prev + Math.random() * 10
            })
          }, 100)
          
          // Clear interval after timeout
          setTimeout(() => clearInterval(interval), 3000)
        }
      }
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[3px] bg-[#F8DA43]">
      <div 
        className="h-full bg-[#141414] dark:bg-white transition-all duration-200 ease-out"
        style={{ 
          width: `${progress}%`,
          opacity: isNavigating ? 1 : 0 
        }}
      />
    </div>
  )
}

