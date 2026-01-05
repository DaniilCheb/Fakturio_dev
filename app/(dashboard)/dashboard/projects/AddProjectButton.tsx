'use client'

import { Button } from '@/app/components/ui/button'
import { Plus } from 'lucide-react'

interface AddProjectButtonProps {
  onClick: () => void
}

export default function AddProjectButton({ onClick }: AddProjectButtonProps) {
  return (
    <Button 
      variant="default" 
      onClick={onClick}
    >
      <Plus className="mr-2 h-4 w-4" />
      New Project
    </Button>
  )
}

