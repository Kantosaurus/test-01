'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  X, Archive, Trash2, Clock, Reply, ReplyAll, Forward, 
  MoreVertical, Star, Printer, ExternalLink, Sparkles
} from 'lucide-react'
import { format } from 'date-fns'
import { api } from '@/lib/api'

interface EmailViewProps {
  emailId: string
  onClose: () => void
}

export function EmailView({ emailId, onClose }: EmailViewProps) {
  const queryClient = useQueryClient()

  const { data: email, isLoading } = useQuery({
    queryKey: ['email', emailId],
    queryFn: () => api.getEmail(emailId),
  })

  const { data: summary, refetch: fetchSummary, isFetching: isSummarizing } = useQuery({
    queryKey: ['summary', emailId],
    queryFn: () => api.summarize({ email_id: emailId }),
    enabled: false,
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateEmail(emailId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] })
      queryClient.invalidateQueries({ queryKey: ['email', emailId] })
    },
  })

  if (isLoading || !email) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gmail-blue" />
      </div>
    )
  }

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
        
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <Printer className="w-5 h-5 text-gmail-gray" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <ExternalLink className="w-5 h-5 text-gmail-gray" />
          </button>
        </div>
      </div>

      {/* Email content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl">
          {/* Subject */}
          <div className="flex items-start justify-between mb-6">
            <h1 className="text-2xl text-gray-900 dark:text-gray-100">{email.subject}</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchSummary()}
                disabled={isSummarizing}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gmail-lightGray hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-sm"
              >
                <Sparkles className={`w-4 h-4 ${isSummarizing ? 'animate-pulse' : ''}`} />
                AI Summary
              </button>
              <button
                onClick={() => updateMutation.mutate({ is_starred: !email.is_starred })}
              >
                <Star 
                  className={`w-5 h-5 ${
                    email.is_starred ? 'text-yellow-400 fill-yellow-400' : 'text-gmail-gray'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* AI Summary */}
          {summary && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-gmail-blue" />
                <span className="text-sm font-medium text-gmail-blue">AI Summary</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{summary.summary}</p>
            </div>
          )}

          {/* From/To */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-gmail-blue text-white flex items-center justify-center flex-shrink-0">
              {(email.from.name || email.from.email)[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{email.from.name || email.from.email}</span>
                <span className="text-sm text-gmail-gray">&lt;{email.from.email}&gt;</span>
              </div>
              <div className="text-sm text-gmail-gray">
                to {email.to.map(t => t.name || t.email).join(', ')}
              </div>
            </div>
            <div className="text-sm text-gmail-gray">
              {format(new Date(email.date), 'MMM d, yyyy, h:mm a')}
            </div>
          </div>

          {/* Labels */}
          {email.labels && email.labels.length > 0 && (
            <div className="flex gap-2 mb-6">
              {email.labels.map((label) => (
                <span
                  key={label}
                  className="px-2 py-0.5 text-xs rounded bg-gmail-lightGray dark:bg-gray-800"
                >
                  {label}
                </span>
              ))}
            </div>
          )}

          {/* Body */}
          <div className="prose dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap">{email.body}</div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">
              <Reply className="w-4 h-4" />
              Reply
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">
              <ReplyAll className="w-4 h-4" />
              Reply all
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">
              <Forward className="w-4 h-4" />
              Forward
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
