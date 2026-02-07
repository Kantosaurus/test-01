'use client'

import { useQuery } from '@tanstack/react-query'
import { 
  Inbox, Send, FileText, AlertTriangle, Trash2, Star, 
  Tag, Plus, ChevronDown, Edit3
} from 'lucide-react'
import { api } from '@/lib/api'
import clsx from 'clsx'

interface SidebarProps {
  isOpen: boolean
  currentLabel: string
  onLabelChange: (label: string) => void
  onCompose: () => void
  onManageLabels?: () => void
}

const systemLabels = [
  { name: 'INBOX', icon: Inbox, color: null },
  { name: 'STARRED', icon: Star, color: '#fbbc04' },
  { name: 'SENT', icon: Send, color: null },
  { name: 'DRAFTS', icon: FileText, color: null },
  { name: 'SPAM', icon: AlertTriangle, color: null },
  { name: 'TRASH', icon: Trash2, color: null },
]

export function Sidebar({ isOpen, currentLabel, onLabelChange, onCompose, onManageLabels }: SidebarProps) {
  const { data: labels } = useQuery({
    queryKey: ['labels'],
    queryFn: api.getLabels,
  })

  const customLabels = labels?.filter(
    l => !systemLabels.some(sl => sl.name === l.name)
  ) || []

  if (!isOpen) return null

  return (
    <aside className="w-64 flex-shrink-0 overflow-y-auto pt-4">
      <button 
        onClick={onCompose}
        className="compose-btn ml-4 mb-4 flex items-center gap-3 px-6 py-4 rounded-2xl bg-white dark:bg-gray-800 hover:bg-gmail-lightGray dark:hover:bg-gray-700"
      >
        <Edit3 className="w-6 h-6 text-gmail-gray" />
        <span className="text-sm font-medium text-gmail-gray">Compose</span>
      </button>

      <nav>
        {systemLabels.map(({ name, icon: Icon, color }) => (
          <button
            key={name}
            onClick={() => onLabelChange(name)}
            className={clsx(
              'w-full flex items-center gap-4 px-6 py-2 rounded-r-full transition-colors',
              currentLabel === name
                ? 'bg-gmail-selected text-gmail-blue font-semibold'
                : 'hover:bg-gmail-hover text-gmail-gray'
            )}
          >
            <Icon 
              className="w-5 h-5" 
              style={color ? { color } : undefined}
              fill={name === 'STARRED' && currentLabel === name ? (color ?? undefined) : 'none'}
            />
            <span className="flex-1 text-left text-sm">{name}</span>
            {labels?.find(l => l.name === name)?.email_count ? (
              <span className="text-xs">{labels.find(l => l.name === name)?.email_count}</span>
            ) : null}
          </button>
        ))}

        {customLabels.length > 0 && (
          <>
            <div className="flex items-center gap-2 px-6 py-2 mt-4">
              <ChevronDown className="w-4 h-4 text-gmail-gray" />
              <span className="text-xs font-medium text-gmail-gray">Labels</span>
            </div>
            {customLabels.map((label) => (
              <button
                key={label.name}
                onClick={() => onLabelChange(label.name)}
                className={clsx(
                  'w-full flex items-center gap-4 px-6 py-2 rounded-r-full transition-colors',
                  currentLabel === label.name
                    ? 'bg-gmail-selected text-gmail-blue font-semibold'
                    : 'hover:bg-gmail-hover text-gmail-gray'
                )}
              >
                <Tag 
                  className="w-5 h-5" 
                  style={label.color ? { color: label.color } : undefined}
                />
                <span className="flex-1 text-left text-sm">{label.name}</span>
                {label.email_count > 0 && (
                  <span className="text-xs">{label.email_count}</span>
                )}
              </button>
            ))}
          </>
        )}

        <button 
          onClick={onManageLabels}
          className="w-full flex items-center gap-4 px-6 py-2 mt-2 hover:bg-gmail-hover text-gmail-gray rounded-r-full"
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm">Manage labels</span>
        </button>
      </nav>
    </aside>
  )
}
