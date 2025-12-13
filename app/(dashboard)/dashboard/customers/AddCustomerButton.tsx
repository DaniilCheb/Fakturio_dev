'use client'

import { Button } from '@/app/components/ui/button'
import { Plus } from 'lucide-react'
import { useContext } from 'react'
import { AddModalContext } from './CustomersList'

export default function AddCustomerButton() {
  const openModal = useContext(AddModalContext)
  
  return (
    <Button 
      variant="default" 
      onClick={openModal || undefined}
      disabled={!openModal}
    >
      <Plus className="mr-2 h-4 w-4" />
      New Customer
    </Button>
  )
}

