'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Inbox, Send, FileText, AlertTriangle, Trash2, Star,
  Tag, Plus, Edit3
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
  { name: 'INBOX', icon: Inbox },
  { name: 'STARRED', icon: Star },
  { name: 'SENT', icon: Send },
  { name: 'DRAFTS', icon: FileText },
  { name: 'SPAM', icon: AlertTriangle },
  { name: 'TRASH', icon: Trash2 },
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
    <aside className="w-56 flex-shrink-0 flex flex-col gap-4">
      {/* Compose button */}
      <button
        onClick={onCompose}
        className="compose-btn text-white"
      >
        <Edit3 className="w-5 h-5" />
        <span>Compose</span>
      </button>

      {/* Navigation - glass panel */}
      <nav className="glass-panel p-2 flex-1 overflow-y-auto">
        <div className="space-y-0.5">
          {systemLabels.map(({ name, icon: Icon }) => {
            const isActive = currentLabel === name
            const count = labels?.find(l => l.name === name)?.email_count

            return (
              <button
                key={name}
                onClick={() => onLabelChange(name)}
                className={clsx(
                  'nav-item w-full group',
                  isActive && 'active'
                )}
              >
                <Icon
                  className={clsx(
                    'w-[18px] h-[18px] transition-colors',
                    name === 'STARRED' && isActive && 'text-amber-400 fill-amber-400'
                  )}
                />
                <span className="flex-1 text-left text-sm capitalize">
                  {name.toLowerCase()}
                </span>
                {count ? (
                  <span className={clsx(
                    'text-xs tabular-nums',
                    isActive ? 'text-accent-cyan' : 'text-white/40'
                  )}>
                    {count}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>

        {/* Custom labels section */}
        {customLabels.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="px-3 mb-2">
              <span className="text-[11px] font-medium text-white/30 uppercase tracking-wider">
                Labels
              </span>
            </div>
            <div className="space-y-0.5">
              {customLabels.map((label) => (
                <button
                  key={label.name}
                  onClick={() => onLabelChange(label.name)}
                  className={clsx(
                    'nav-item w-full',
                    currentLabel === label.name && 'active'
                  )}
                >
                  <Tag
                    className="w-[18px] h-[18px]"
                    style={label.color ? { color: label.color } : undefined}
                  />
                  <span className="flex-1 text-left text-sm">{label.name}</span>
                  {label.email_count > 0 && (
                    <span className="text-xs text-white/40">{label.email_count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add label button */}
        <button
          onClick={onManageLabels}
          className="nav-item w-full mt-2"
        >
          <Plus className="w-[18px] h-[18px]" />
          <span className="text-sm">Manage labels</span>
        </button>
      </nav>
    </aside>
  )
}
