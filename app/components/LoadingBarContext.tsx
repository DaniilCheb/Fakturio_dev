'use client'

import { createContext, useContext, useState, useRef, ReactNode, useEffect } from 'react'

interface LoadingBarContextType {
  start: () => void
  complete: () => void
  isActive: boolean
  progress: number
  setProgress: (progress: number) => void
}

const LoadingBarContext = createContext<LoadingBarContextType | undefined>(undefined)

export function LoadingBarProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false)
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const start = () => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    setIsActive(true)
    setProgress(20)
    
    // Simulate progress
    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          return prev
        }
        return prev + Math.random() * 10
      })
    }, 100)
    
    // Clear interval after timeout as safety
    setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }, 3000)
  }

  const complete = () => {
    // Clear interval if still running
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    setProgress(100)
    setTimeout(() => {
      setIsActive(false)
      setProgress(0)
    }, 200)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return (
    <LoadingBarContext.Provider value={{ start, complete, isActive, progress, setProgress }}>
      {children}
    </LoadingBarContext.Provider>
  )
}

export function useLoadingBar() {
  const context = useContext(LoadingBarContext)
  if (context === undefined) {
    throw new Error('useLoadingBar must be used within a LoadingBarProvider')
  }
  return context
}

