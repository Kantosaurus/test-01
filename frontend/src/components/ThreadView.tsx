'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  X, Archive, Trash2, Clock, Reply, ReplyAll, Forward, 
  Star, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react'
import { format } from 'date-fns'
import { api, Email } from '@/lib/api'
import { useState } from 'react'

interface ThreadViewProps {
  threadId: string
  onClose: () => void
}

function EmailMessage({ email, isExpanded, onToggle }: { 
  email: Email; 
  isExpanded: boolean; 
  onToggle: () => void;
}) {
  const queryClient = useQueryClient()
  
  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateEmail(email.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thread'] })
    },
  })

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 last:border-0">
      <div 
        onClick={onToggle}
        className="flex items-start gap-4 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <div className="w-10 h-10 rounded-full bg-gmail-blue text-white flex items-center justify-center flex-shrink-0">
          {(email.from.name || email.from.email)[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{email.from.name || email.from.email}</span>
            <span className="text-sm text-gmail-gray">
              {format(new Date(email.date), 'MMM d, h:mm a')}
            </span>
          </div>
          {!isExpanded && (
            <p className="text-sm text-gmail-gray truncate">{email.snippet}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              updateMutation.mutate({ is_starred: !email.is_starred })
            }}
          >
            <Star 
              className={`w-5 h-5 ${
                email.is_starred ? 'text-yellow-400 fill-yellow-400' : 'text-gmail-gray'
              }`}
            />
          </button>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gmail-gray" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gmail-gray" />
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-4 pb-4 ml-14">
          <div className="text-sm text-gmail-gray mb-4">
            to {email.to.map(t => t.name || t.email).join(', ')}
          </div>
          <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
            {email.body}
          </div>
          <div className="flex gap-3 mt-4">
            <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm">
              <Reply className="w-4 h-4" />
              Reply
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm">
              <Forward className="w-4 h-4" />
              Forward
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function ThreadView({ threadId, onClose }: ThreadViewProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  
  const { data: thread, isLoading } = useQuery({
    queryKey: ['thread', threadId],
    queryFn: () => api.getThread(threadId),
  })

  const { data: summary, refetch: fetchSummary, isFetching: isSummarizing } = useQuery({
    queryKey: ['thread-summary', threadId],
    queryFn: () => api.summarize({ thread_id: threadId }),
    enabled: false,
  })

  // Expand last email by default
  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  if (isLoading || !thread) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gmail-blue" />
      </div>
    )
  }

  // Auto-expand the last email
  const lastEmailId = thread.emails[thread.emails.length - 1]?.id
  const isExpanded = (id: string) => expandedIds.has(id) || id === lastEmailId

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-1">
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5 text-gmail-gray" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <Archive className="w-5 h-5 text-gmail-gray" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <Trash2 className="w-5 h-5 text-gmail-gray" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <Clock className="w-5 h-5 text-gmail-gray" />
          </button>
        </div>
        
        <div className="text-sm text-gmail-gray">
          {thread.emails.length} messages · {thread.participant_count} participants
        </div>
      </div>

      {/* Thread content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          {/* Subject */}
          <div className="flex items-start justify-between mb-6">
            <h1 className="text-2xl text-gray-900 dark:text-gray-100">{thread.subject}</h1>
            <button
              onClick={() => fetchSummary()}
              disabled={isSummarizing}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gmail-lightGray hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-sm"
            >
              <Sparkles className={`w-4 h-4 ${isSummarizing ? 'animate-pulse' : ''}`} />
              Summarize Thread
            </button>
          </div>

          {/* AI Summary */}
          {summary && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-gmail-blue" />
                <span className="text-sm font-medium text-gmail-blue">Thread Summary</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{summary.summary}</p>
            </div>
          )}

          {/* Messages */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            {thread.emails.map((email) => (
              <EmailMessage
                key={email.id}
                email={email}
                isExpanded={isExpanded(email.id)}
                onToggle={() => toggleExpanded(email.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
