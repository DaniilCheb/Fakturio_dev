'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useLoadingBar } from './LoadingBarContext'

export default function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { isActive, progress, setProgress, start, complete } = useLoadingBar()
  const [localIsNavigating, setLocalIsNavigating] = useState(true)
  const [localProgress, setLocalProgress] = useState(0)

  // Use context values if available, otherwise use local state
  const isNavigating = isActive || localIsNavigating
  const displayProgress = isActive ? progress : localProgress

  useEffect(() => {
    // Show progress on initial load
    setLocalIsNavigating(true)
    setLocalProgress(30)
    
    // Simulate progress on initial load
    const interval = setInterval(() => {
      setLocalProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval)
          return prev
        }
        return prev + Math.random() * 10
      })
    }, 100)

    // Complete on mount
    const timeout = setTimeout(() => {
      setLocalProgress(100)
      setTimeout(() => {
        setLocalIsNavigating(false)
        setLocalProgress(0)
        clearInterval(interval)
      }, 200)
    }, 500)

    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    // When pathname or searchParams change, navigation has completed
    complete()
    setLocalIsNavigating(false)
    setLocalProgress(100)
    
    // Reset progress after animation
    const timeout = setTimeout(() => {
      setLocalProgress(0)
    }, 200)

    return () => clearTimeout(timeout)
  }, [pathname, searchParams, complete])

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
          start()
          setLocalIsNavigating(true)
          setLocalProgress(20)
          
          // Simulate progress
          const interval = setInterval(() => {
            setLocalProgress(prev => {
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
  }, [start])

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[4px]">
      <div 
        className="h-full bg-black transition-all duration-200 ease-out"
        style={{ 
          width: `${displayProgress}%`,
          opacity: isNavigating ? 1 : 0 
        }}
      />
    </div>
  )
}

