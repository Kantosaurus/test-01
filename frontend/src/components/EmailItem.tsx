'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Star, Archive, Trash2 } from 'lucide-react'
import { format, isToday, isThisYear } from 'date-fns'
import { api, Email } from '@/lib/api'
import clsx from 'clsx'

interface EmailItemProps {
  email: Email
  isSelected: boolean
  onClick: () => void
}

export function EmailItem({ email, isSelected, onClick }: EmailItemProps) {
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Email> }) => 
      api.updateEmail(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] })
    },
  })

  const formatDate = (date: string) => {
    const d = new Date(date)
    if (isToday(d)) {
      return format(d, 'h:mm a')
    }
    if (isThisYear(d)) {
      return format(d, 'MMM d')
    }
    return format(d, 'MM/dd/yy')
  }

  const handleStar = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateMutation.mutate({
      id: email.id,
      data: { is_starred: !email.is_starred },
    })
  }

  return (
    <div
      onClick={onClick}
      className={clsx(
        'email-item flex items-center gap-2 px-4 py-2 cursor-pointer border-b border-gray-100 dark:border-gray-800',
        isSelected 
          ? 'bg-gmail-selected' 
          : 'hover:bg-gmail-hover',
        !email.is_read && 'bg-white dark:bg-gray-900 font-semibold'
      )}
    >
      <input 
        type="checkbox" 
        className="w-4 h-4 rounded flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      />
      
      <button
        onClick={handleStar}
        className="p-1 flex-shrink-0"
      >
        <Star 
          className={clsx(
            'w-5 h-5',
            email.is_starred ? 'text-yellow-400 fill-yellow-400' : 'text-gmail-gray'
          )}
        />
      </button>

      <div className="flex-1 min-w-0 flex items-center gap-4">
        <div className="w-48 flex-shrink-0 truncate">
          {email.from.name || email.from.email}
        </div>
        
        <div className="flex-1 min-w-0 flex items-baseline gap-1">
          <span className="truncate">{email.subject}</span>
          <span className="text-gmail-gray font-normal truncate">
            {' '}- {email.snippet}
          </span>
        </div>
        
        <div className="text-xs text-gmail-gray flex-shrink-0 w-16 text-right">
          {formatDate(email.date)}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
        <button className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
          <Archive className="w-4 h-4 text-gmail-gray" />
        </button>
        <button className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
          <Trash2 className="w-4 h-4 text-gmail-gray" />
        </button>
      </div>
    </div>
  )
}
