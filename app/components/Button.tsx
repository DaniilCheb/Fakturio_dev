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
    primary: "bg-design-button-primary text-design-on-button-content hover:opacity-90 active:opacity-80 focus:ring-design-button-primary",
    
    // Secondary - Light with border (white background)
    secondary: "bg-design-surface-default text-design-content-default border border-design-border-default hover:bg-design-surface-field hover:border-design-border-default/80 active:bg-design-surface-field/80 focus:ring-design-border-default",
    
    // Outline - Same as secondary (white background with border)
    outline: "bg-design-surface-default text-design-content-default border border-design-border-default hover:bg-design-surface-field hover:border-design-border-default/80 active:bg-design-surface-field/80 focus:ring-design-border-default",
    
    // Destructive - Red variant for delete actions
    destructive: "bg-design-surface-default text-red-600 dark:text-red-400 border border-design-border-default hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800/50 hover:text-red-700 dark:hover:text-red-300 active:bg-red-100 dark:active:bg-red-900/30 focus:ring-red-200 dark:focus:ring-red-800",
    
    // Ghost - Minimal button
    ghost: "bg-transparent text-design-content-weak hover:bg-design-surface-field hover:text-design-content-default active:bg-design-surface-field/80 rounded-lg",
    
    // Inverted variants for dark backgrounds
    'primary-inverted': "bg-design-on-button-content-inverted text-design-on-button-content hover:opacity-90 active:opacity-80 focus:ring-design-on-button-content-inverted",
    'outline-inverted': "bg-transparent text-design-on-button-content border border-design-border-default hover:bg-design-surface-inverted/20 active:bg-design-surface-inverted/30 focus:ring-design-border-default"
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

