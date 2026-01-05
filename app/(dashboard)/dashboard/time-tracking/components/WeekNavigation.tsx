'use client'

import { Button } from '@/app/components/ui/button'

// Left arrow icon component
const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg 
    width="28" 
    height="28" 
    viewBox="0 0 28 28" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M12.2983 4.28892C12.4878 4.10754 12.7411 4.00793 13.0035 4.01157C13.2658 4.01521 13.5162 4.12181 13.7007 4.30838C13.8851 4.49495 13.9889 4.74655 13.9896 5.00892C13.9902 5.27129 13.8878 5.52341 13.7043 5.71092L6.32826 12.9999H24.0033C24.2685 12.9999 24.5228 13.1053 24.7104 13.2928C24.8979 13.4804 25.0033 13.7347 25.0033 13.9999C25.0033 14.2651 24.8979 14.5195 24.7104 14.707C24.5228 14.8946 24.2685 14.9999 24.0033 14.9999H6.33026L13.7043 22.2859C13.893 22.4724 13.9999 22.7261 14.0015 22.9914C14.0031 23.2567 13.8992 23.5117 13.7128 23.7004C13.5263 23.8891 13.2725 23.996 13.0073 23.9976C12.742 23.9992 12.487 23.8954 12.2983 23.7089L3.37126 14.8879C3.25365 14.7717 3.16027 14.6332 3.09654 14.4806C3.03281 14.328 3 14.1643 3 13.9989C3 13.8335 3.03281 13.6698 3.09654 13.5172C3.16027 13.3646 3.25365 13.2262 3.37126 13.1099L12.2983 4.28892Z" 
      fill="currentColor"
    />
  </svg>
)

// Right arrow icon component
const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg 
    width="28" 
    height="28" 
    viewBox="0 0 28 28" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M15.705 4.28908C15.6122 4.19424 15.5014 4.11882 15.3791 4.06722C15.2569 4.01562 15.1256 3.98887 14.9929 3.98853C14.8602 3.98819 14.7287 4.01427 14.6062 4.06524C14.4837 4.11621 14.3725 4.19106 14.2792 4.28543C14.1859 4.3798 14.1123 4.49179 14.0627 4.61488C14.0132 4.73798 13.9886 4.86971 13.9904 5.0024C13.9923 5.13509 14.0205 5.26609 14.0735 5.38776C14.1264 5.50943 14.2031 5.61934 14.299 5.71108L21.675 13.0001H4C3.73478 13.0001 3.48043 13.1054 3.29289 13.293C3.10536 13.4805 3 13.7349 3 14.0001C3 14.2653 3.10536 14.5196 3.29289 14.7072C3.48043 14.8947 3.73478 15.0001 4 15.0001H21.673L14.299 22.2861C14.1103 22.4725 14.0034 22.7263 14.0018 22.9916C14.0002 23.2568 14.1041 23.5119 14.2905 23.7006C14.4769 23.8893 14.7307 23.9962 14.996 23.9978C15.2613 23.9994 15.5163 23.8955 15.705 23.7091L24.632 14.8881C24.7496 14.7718 24.843 14.6334 24.9067 14.4808C24.9704 14.3282 25.0033 14.1645 25.0033 13.9991C25.0033 13.8337 24.9704 13.67 24.9067 13.5174C24.843 13.3648 24.7496 13.2263 24.632 13.1101L15.705 4.28908Z" 
      fill="currentColor"
    />
  </svg>
)

interface WeekNavigationProps {
  selectedWeek: Date
  onWeekChange: (date: Date) => void
}

export default function WeekNavigation({ selectedWeek, onWeekChange }: WeekNavigationProps) {
  const goToPreviousWeek = () => {
    const newDate = new Date(selectedWeek)
    newDate.setDate(selectedWeek.getDate() - 7)
    onWeekChange(newDate)
  }

  const goToNextWeek = () => {
    const newDate = new Date(selectedWeek)
    newDate.setDate(selectedWeek.getDate() + 7)
    onWeekChange(newDate)
  }

  const goToToday = () => {
    const today = new Date()
    const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, etc.
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - dayOfWeek) // Go back to Sunday
    startOfWeek.setHours(0, 0, 0, 0)
    onWeekChange(startOfWeek)
  }

  const formatWeekRange = (date: Date): string => {
    const end = new Date(date)
    end.setDate(date.getDate() + 6)
    
    const startStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    
    return `${startStr} - ${endStr}`
  }

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={goToToday}
        className="font-medium"
      >
        Today
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={goToPreviousWeek}
        className="h-8 w-8"
      >
        <ArrowLeftIcon className="h-4 w-4" />
      </Button>
      
      <span className="text-[20px] font-bold">{formatWeekRange(selectedWeek)}</span>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={goToNextWeek}
        className="h-8 w-8"
      >
        <ArrowRightIcon className="h-4 w-4" />
      </Button>
    </div>
  )
}

