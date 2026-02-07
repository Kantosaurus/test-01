'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, Minus, Maximize2, Paperclip, Link2, Smile, Image, Sparkles, Send } from 'lucide-react'
import { api } from '@/lib/api'
import clsx from 'clsx'

interface ComposeModalProps {
  onClose: () => void
  replyTo?: string
}

export function ComposeModal({ onClose, replyTo }: ComposeModalProps) {
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [isMinimized, setIsMinimized] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const queryClient = useQueryClient()

  const sendMutation = useMutation({
    mutationFn: api.sendEmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] })
      onClose()
    },
  })

  const { data: suggestions, refetch: fetchSuggestions, isFetching } = useQuery({
    queryKey: ['compose-suggestions', subject, body],
    queryFn: () => api.smartCompose({
      prompt: subject || 'general email',
      context: body,
    }),
    enabled: false,
  })

  const handleSend = () => {
    if (!to || !subject) return
    sendMutation.mutate({
      to: to.split(',').map(e => e.trim()),
      subject,
      body,
      reply_to: replyTo,
    })
  }

  const handleSmartCompose = () => {
    setShowSuggestions(true)
    fetchSuggestions()
  }

  const applySuggestion = (suggestion: string) => {
    setBody(suggestion)
    setShowSuggestions(false)
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-6 z-50">
        <div
          className="w-72 glass-panel overflow-hidden cursor-pointer transition-all hover:scale-[1.02]"
          onClick={() => setIsMinimized(false)}
        >
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-accent-cyan/20 to-accent-violet/20 border-b border-white/5">
            <span className="text-sm font-medium truncate text-white/90">
              {subject || 'New Message'}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }}
                className="icon-btn p-1"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="icon-btn p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-6 z-50 animate-slide-up">
      <div className="w-[560px] glass-panel flex flex-col max-h-[75vh] shadow-card">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-accent-cyan/10 to-accent-violet/10 border-b border-white/5 rounded-t-2xl">
          <span className="text-sm font-medium text-white/90">New Message</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="icon-btn p-1.5"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="icon-btn p-1.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b border-white/5">
            <input
              type="text"
              placeholder="To"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-4 py-2.5 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
            />
          </div>
          <div className="border-b border-white/5">
            <input
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2.5 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
            />
          </div>
          <div className="flex-1 min-h-[220px] relative">
            <textarea
              placeholder="Write your message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full h-full px-4 py-3 bg-transparent text-sm text-white/90 placeholder:text-white/30 focus:outline-none resize-none"
            />

            {/* Smart compose suggestions */}
            {showSuggestions && suggestions && (
              <div className="absolute bottom-0 left-0 right-0 glass-panel m-2 p-3 max-h-48 overflow-y-auto animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent-violet" />
                    <span className="text-xs font-medium ai-accent-text">AI Suggestions</span>
                  </div>
                  <button
                    onClick={() => setShowSuggestions(false)}
                    className="text-xs text-white/40 hover:text-white/60"
                  >
                    Close
                  </button>
                </div>
                {isFetching ? (
                  <div className="flex items-center gap-2 text-sm text-white/40">
                    <div className="spinner w-4 h-4" />
                    <span>Generating suggestions...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {suggestions.suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => applySuggestion(s)}
                        className="w-full text-left p-2.5 text-sm text-white/70 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-3 py-3 border-t border-white/5">
          <div className="flex items-center gap-1">
            <button
              onClick={handleSend}
              disabled={sendMutation.isPending || !to || !subject}
              className={clsx(
                'flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all',
                'bg-gradient-to-r from-accent-cyan to-accent-violet text-white',
                'hover:shadow-glow hover:scale-[1.02]',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none'
              )}
            >
              <Send className="w-4 h-4" />
              {sendMutation.isPending ? 'Sending...' : 'Send'}
            </button>
          </div>

          <div className="flex items-center gap-0.5">
            <button className="icon-btn" title="Attach file">
              <Paperclip className="w-4 h-4" />
            </button>
            <button className="icon-btn" title="Insert link">
              <Link2 className="w-4 h-4" />
            </button>
            <button className="icon-btn" title="Insert emoji">
              <Smile className="w-4 h-4" />
            </button>
            <button className="icon-btn" title="Insert image">
              <Image className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-white/10 mx-1" />
            <button
              onClick={handleSmartCompose}
              disabled={isFetching}
              className={clsx(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all',
                'ai-accent hover:scale-[1.02]'
              )}
              title="Smart Compose"
            >
              <Sparkles className={clsx('w-3.5 h-3.5', isFetching && 'animate-pulse-subtle')} />
              <span className="ai-accent-text font-medium">AI</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
