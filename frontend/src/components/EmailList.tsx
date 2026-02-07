'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { RefreshCw, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react'
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
        // Use semantic search
        const results = await api.semanticSearch({ query: searchQuery, limit: 50 })
        // Fetch full email details for each result
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

  // Emit email IDs when data changes
  useEffect(() => {
    if (data?.emails && onEmailIdsChange) {
      onEmailIdsChange(data.emails.map(e => e.id))
    }
  }, [data?.emails, onEmailIdsChange])

  return (
    <div className="flex-1 flex flex-col border-r border-gray-200 dark:border-gray-700 min-w-[400px]">
      {/* Toolbar */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <input type="checkbox" className="w-4 h-4 rounded" />
          <button 
            onClick={() => refetch()}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <RefreshCw className={`w-4 h-4 text-gmail-gray ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <MoreVertical className="w-4 h-4 text-gmail-gray" />
          </button>
        </div>
        
        <div className="flex items-center gap-1 text-xs text-gmail-gray">
          <span>
            {data?.emails.length ? `1-${data.emails.length}` : '0'} of {data?.total || 0}
          </span>
          <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Email list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="w-6 h-6 text-gmail-gray animate-spin" />
          </div>
        ) : data?.emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gmail-gray">
            <p className="text-lg">No emails found</p>
            <p className="text-sm mt-2">
              {searchQuery ? 'Try a different search' : 'Your inbox is empty'}
            </p>
          </div>
        ) : (
          data?.emails.map((email) => (
            <EmailItem
              key={email.id}
              email={email}
              isSelected={selectedId === email.id}
              onClick={() => onSelect(email.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
