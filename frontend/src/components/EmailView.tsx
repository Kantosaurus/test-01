'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  X, Archive, Trash2, Clock, Reply, ReplyAll, Forward,
  Star, Printer, ExternalLink, Sparkles, MoreHorizontal
} from 'lucide-react'
import { format } from 'date-fns'
import { api } from '@/lib/api'
import clsx from 'clsx'

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
      <div className="flex-1 glass-panel flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="spinner w-6 h-6" />
          <span className="text-sm text-white/40">Loading email...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 glass-panel flex flex-col overflow-hidden animate-fade-in">
      {/* Toolbar */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-white/5">
        <div className="flex items-center gap-1">
          <button onClick={onClose} className="icon-btn" title="Close">
            <X className="w-5 h-5" />
          </button>
          <div className="w-px h-5 bg-white/10 mx-1" />
          <button className="icon-btn" title="Archive">
            <Archive className="w-4 h-4" />
          </button>
          <button className="icon-btn" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
          <button className="icon-btn" title="Snooze">
            <Clock className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button className="icon-btn" title="Print">
            <Printer className="w-4 h-4" />
          </button>
          <button className="icon-btn" title="Open in new window">
            <ExternalLink className="w-4 h-4" />
          </button>
          <button className="icon-btn" title="More options">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Email content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6">
          {/* Subject row */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <h1 className="font-heading text-2xl font-semibold text-white leading-tight">
              {email.subject}
            </h1>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* AI Summary button */}
              <button
                onClick={() => fetchSummary()}
                disabled={isSummarizing}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition-all ai-accent hover:scale-[1.02]"
              >
                <Sparkles className={clsx(
                  'w-4 h-4',
                  isSummarizing ? 'animate-pulse-subtle' : ''
                )} />
                <span className="ai-accent-text font-medium">Summarize</span>
              </button>

              {/* Star */}
              <button
                onClick={() => updateMutation.mutate({ is_starred: !email.is_starred })}
                className={clsx('star-btn', email.is_starred && 'starred')}
              >
                <Star className={clsx(
                  'w-5 h-5',
                  email.is_starred ? 'fill-amber-400 text-amber-400' : 'text-white/40'
                )} />
              </button>
            </div>
          </div>

          {/* AI Summary */}
          {summary && (
            <div className="mb-6 p-4 rounded-xl ai-accent animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-accent-violet" />
                <span className="text-sm font-medium ai-accent-text">AI Summary</span>
              </div>
              <p className="text-sm text-white/70 leading-relaxed">{summary.summary}</p>
            </div>
          )}

          {/* Sender info */}
          <div className="flex items-start gap-4 mb-6 pb-6 border-b border-white/5">
            {/* Avatar */}
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-violet flex items-center justify-center flex-shrink-0">
              <span className="text-white font-medium">
                {(email.from.name || email.from.email)[0].toUpperCase()}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">
                  {email.from.name || email.from.email}
                </span>
                <span className="text-sm text-white/40">
                  &lt;{email.from.email}&gt;
                </span>
              </div>
              <div className="text-sm text-white/40 mt-0.5">
                to {email.to.map(t => t.name || t.email).join(', ')}
              </div>
            </div>

            <div className="text-sm text-white/40 flex-shrink-0">
              {format(new Date(email.date), 'MMM d, yyyy, h:mm a')}
            </div>
          </div>

          {/* Labels */}
          {email.labels && email.labels.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {email.labels.map((label) => (
                <span key={label} className="label-tag">
                  {label}
                </span>
              ))}
            </div>
          )}

          {/* Body */}
          <div className="prose prose-invert prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-white/80 leading-relaxed">
              {email.body}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 mt-10 pt-6 border-t border-white/5">
            <button className="action-btn">
              <Reply className="w-4 h-4" />
              <span>Reply</span>
            </button>
            <button className="action-btn">
              <ReplyAll className="w-4 h-4" />
              <span>Reply all</span>
            </button>
            <button className="action-btn">
              <Forward className="w-4 h-4" />
              <span>Forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
