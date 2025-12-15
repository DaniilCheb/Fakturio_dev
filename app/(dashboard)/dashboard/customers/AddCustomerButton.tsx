'use client'

import { Button } from '@/app/components/ui/button'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AddCustomerButton() {
  const router = useRouter()
  
  return (
    <Button 
      variant="default" 
      onClick={() => router.push('/dashboard/customers/new')}
    >
      <Plus className="mr-2 h-4 w-4" />
      New Customer
    </Button>
  )
}
