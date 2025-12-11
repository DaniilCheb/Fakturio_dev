'use client'

import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost' | 'primary-inverted' | 'outline-inverted'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  children: React.ReactNode
  className?: string
}

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'default',
  onClick, 
  disabled = false, 
  type = 'button', 
  className = '', 
  ...props 
}: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center font-medium transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed rounded-full"
  
  const sizeClasses = {
    default: "px-5 py-2.5 text-[14px] h-[44px]",
    sm: "px-4 py-2 text-[13px] h-[36px]",
    lg: "px-6 py-3 text-[15px] h-[52px]",
    icon: "p-2.5 h-[44px] w-[44px]"
  }
  
  const variantClasses = {
    // Primary - Dark filled button
    primary: "bg-[#141414] dark:bg-white text-white dark:text-[#141414] hover:bg-[#333333] dark:hover:bg-[#e0e0e0] active:bg-[#000000] dark:active:bg-[#d0d0d0] focus:ring-[#141414] dark:focus:ring-white",
    
    // Secondary - Light with border (white background)
    secondary: "bg-white dark:bg-[#2a2a2a] text-[#141414] dark:text-white border border-[#e0e0e0] dark:border-[#444] hover:bg-[#f5f5f5] dark:hover:bg-[#333] hover:border-[#d0d0d0] dark:hover:border-[#555] active:bg-[#ebebeb] dark:active:bg-[#3a3a3a] focus:ring-[#e0e0e0] dark:focus:ring-[#555]",
    
    // Outline - Same as secondary (white background with border)
    outline: "bg-white dark:bg-[#2a2a2a] text-[#141414] dark:text-white border border-[#e0e0e0] dark:border-[#444] hover:bg-[#f5f5f5] dark:hover:bg-[#333] hover:border-[#d0d0d0] dark:hover:border-[#555] active:bg-[#ebebeb] dark:active:bg-[#3a3a3a] focus:ring-[#e0e0e0] dark:focus:ring-[#555]",
    
    // Destructive - Red variant for delete actions
    destructive: "bg-white dark:bg-[#2a2a2a] text-red-600 dark:text-red-400 border border-[#e0e0e0] dark:border-[#444] hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800/50 hover:text-red-700 dark:hover:text-red-300 active:bg-red-100 dark:active:bg-red-900/30 focus:ring-red-200 dark:focus:ring-red-800",
    
    // Ghost - Minimal button
    ghost: "bg-transparent text-[#555555] dark:text-[#aaa] hover:bg-[#f5f5f5] dark:hover:bg-[#333] hover:text-[#141414] dark:hover:text-white active:bg-[#ebebeb] dark:active:bg-[#3a3a3a] rounded-lg",
    
    // Inverted variants for dark backgrounds
    'primary-inverted': "bg-white text-[#141414] hover:bg-[#e0e0e0] active:bg-[#d0d0d0] focus:ring-white",
    'outline-inverted': "bg-transparent text-white border border-[#444] hover:bg-[#333] active:bg-[#444] focus:ring-[#444]"
  }
  
  return (
    <button
      type={type}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

