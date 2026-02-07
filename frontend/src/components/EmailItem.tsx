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
  style?: React.CSSProperties
}

export function EmailItem({ email, isSelected, onClick, style }: EmailItemProps) {
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
      style={style}
      className={clsx(
        'email-item group flex items-center gap-3 px-4 py-3 cursor-pointer animate-fade-in',
        isSelected && 'selected',
        !email.is_read && 'unread'
      )}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        className="w-4 h-4 rounded bg-white/5 border-white/10 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Star button */}
      <button
        onClick={handleStar}
        className={clsx(
          'star-btn flex-shrink-0 transition-all',
          email.is_starred && 'starred'
        )}
      >
        <Star className={clsx(
          'w-[18px] h-[18px]',
          email.is_starred ? 'fill-amber-400 text-amber-400' : 'text-white/30'
        )} />
      </button>

      {/* Email content */}
      <div className="flex-1 min-w-0 flex items-center gap-3">
        {/* Sender avatar */}
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-violet/30 to-accent-cyan/30 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-medium text-white/80">
            {(email.from.name || email.from.email)[0].toUpperCase()}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={clsx(
              'text-sm truncate',
              !email.is_read ? 'font-semibold text-white' : 'text-white/70'
            )}>
              {email.from.name || email.from.email}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className={clsx(
              'email-subject text-sm truncate',
              !email.is_read ? 'text-white/90' : 'text-white/50'
            )}>
              {email.subject}
            </span>
            <span className="text-xs text-white/30 truncate hidden sm:inline">
              — {email.snippet}
            </span>
          </div>
        </div>

        {/* Date */}
        <div className="text-xs text-white/40 flex-shrink-0 tabular-nums">
          {formatDate(email.date)}
        </div>
      </div>

      {/* Hover actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="icon-btn p-1.5"
          onClick={(e) => e.stopPropagation()}
          title="Archive"
        >
          <Archive className="w-4 h-4" />
        </button>
        <button
          className="icon-btn p-1.5"
          onClick={(e) => e.stopPropagation()}
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
