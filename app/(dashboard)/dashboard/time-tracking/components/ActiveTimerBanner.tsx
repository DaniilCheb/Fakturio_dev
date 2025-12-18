'use client'

import { useState, useEffect } from 'react'
import type { TimeEntry } from '@/lib/services/timeEntryService.client'

interface ActiveTimerBannerProps {
  timer: TimeEntry
  onStop: () => void
  isProcessing: boolean
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export default function ActiveTimerBanner({ timer, onStop, isProcessing }: ActiveTimerBannerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    if (!timer.start_time) return
    
    const startTime = new Date(timer.start_time).getTime()
    
    const updateElapsed = () => {
      const now = Date.now()
      const elapsed = Math.floor((now - startTime) / 1000)
      setElapsedSeconds(elapsed)
    }
    
    updateElapsed()
    const interval = setInterval(updateElapsed, 1000)
    
    return () => clearInterval(interval)
  }, [timer.start_time])

  const projectName = timer.projects?.name || 'Unknown Project'

  return (
    <div 
      className="rounded-xl border"
      style={{ 
        backgroundColor: '#000000', 
        borderColor: 'rgba(255, 255, 255, 0.2)' 
      }}
    >
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div 
            className="w-3 h-3 rounded-full animate-pulse" 
            style={{ backgroundColor: '#ffffff' }}
          />
          <div>
            <div 
              className="font-semibold text-sm"
              style={{ color: '#ffffff' }}
            >
              {projectName}
              {timer.description && ` • ${timer.description}`}
            </div>
            <div 
              className="text-2xl font-mono font-bold"
              style={{ color: '#ffffff' }}
            >
              {formatTime(elapsedSeconds)}
            </div>
          </div>
        </div>
        <button
          onClick={onStop}
          disabled={isProcessing}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium h-9 px-4 disabled:pointer-events-none disabled:opacity-50 transition-colors"
          style={{ 
            backgroundColor: '#ffffff', 
            color: '#000000',
          }}
          onMouseEnter={(e) => {
            if (!isProcessing) {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.85)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff'
          }}
        >
          ■ Stop
        </button>
      </div>
    </div>
  )
}
