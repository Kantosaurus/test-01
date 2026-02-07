'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { RefreshCw, MoreHorizontal, ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import { api } from '@/lib/api'
import { EmailItem } from './EmailItem'

interface EmailListProps {
  label: string
  searchQuery: string
  useAISearch?: boolean
  selectedId: string | null
  onSelect: (id: string) => void
  onEmailIdsChange?: (ids: string[]) => void
}

export function EmailList({ label, searchQuery, useAISearch, selectedId, onSelect, onEmailIdsChange }: EmailListProps) {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['emails', label, searchQuery, useAISearch],
    queryFn: async () => {
      if (useAISearch && searchQuery) {
        const results = await api.semanticSearch({ query: searchQuery, limit: 50 })
        const emails = await Promise.all(
          results.results.map(async (r) => {
            try {
              return await api.getEmail(r.email_id)
            } catch {
              return null
            }
          })
        )
        return {
          emails: emails.filter((e): e is NonNullable<typeof e> => e !== null),
          total: results.results.length,
          page: 1,
          limit: 50,
        }
      }
      return api.getEmails({ label, search: searchQuery })
    },
  })

  useEffect(() => {
    if (data?.emails && onEmailIdsChange) {
      onEmailIdsChange(data.emails.map(e => e.id))
    }
  }, [data?.emails, onEmailIdsChange])

  return (
    <div className="h-full glass-panel flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="h-12 flex items-center justify-between px-3 border-b border-white/5">
        <div className="flex items-center gap-1">
          <input
            type="checkbox"
            className="w-4 h-4 rounded bg-white/5 border-white/10 checked:bg-accent-cyan"
          />
          <button
            onClick={() => refetch()}
            className="icon-btn ml-1"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button className="icon-btn" title="More actions">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/40">
          <span className="tabular-nums">
            {data?.emails.length ? `1-${data.emails.length}` : '0'} of {data?.total || 0}
          </span>
          <div className="flex items-center">
            <button className="icon-btn p-1.5">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="icon-btn p-1.5">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Email list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="spinner" />
            <span className="text-sm text-white/40">Loading emails...</span>
          </div>
        ) : data?.emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-white/20" />
            </div>
            <p className="text-white/60 font-medium">No emails found</p>
            <p className="text-sm text-white/30 mt-1">
              {searchQuery ? 'Try a different search term' : 'Your inbox is empty'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {data?.emails.map((email, index) => (
              <EmailItem
                key={email.id}
                email={email}
                isSelected={selectedId === email.id}
                onClick={() => onSelect(email.id)}
                style={{ animationDelay: `${index * 30}ms` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
