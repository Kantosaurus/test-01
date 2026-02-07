'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, Minus, Maximize2, Paperclip, Link2, Smile, Image, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'

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
      <div className="fixed bottom-0 right-20 w-64 bg-white dark:bg-gray-800 shadow-lg rounded-t-lg">
        <div 
          className="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-900 text-white rounded-t-lg cursor-pointer"
          onClick={() => setIsMinimized(false)}
        >
          <span className="text-sm font-medium truncate">
            {subject || 'New Message'}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }}>
              <Maximize2 className="w-4 h-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onClose(); }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-0 right-20 w-[550px] bg-white dark:bg-gray-800 shadow-2xl rounded-t-lg flex flex-col max-h-[70vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-900 text-white rounded-t-lg">
        <span className="text-sm font-medium">New Message</span>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-gray-700 rounded"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            placeholder="To"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full px-4 py-2 bg-transparent focus:outline-none"
          />
        </div>
        <div className="border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-2 bg-transparent focus:outline-none"
          />
        </div>
        <div className="flex-1 min-h-[200px] relative">
          <textarea
            placeholder="Compose email"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full h-full px-4 py-3 bg-transparent focus:outline-none resize-none"
          />
          
          {/* Smart compose suggestions */}
          {showSuggestions && suggestions && (
            <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-3 max-h-48 overflow-y-auto">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-gmail-blue" />
                <span className="text-xs font-medium text-gmail-blue">AI Suggestions</span>
                <button 
                  onClick={() => setShowSuggestions(false)}
                  className="ml-auto text-xs text-gmail-gray hover:text-gray-600"
                >
                  Close
                </button>
              </div>
              {isFetching ? (
                <div className="text-sm text-gmail-gray">Generating suggestions...</div>
              ) : (
                <div className="space-y-2">
                  {suggestions.suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => applySuggestion(s)}
                      className="w-full text-left p-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800"
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
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-1">
          <button
            onClick={handleSend}
            disabled={sendMutation.isPending || !to || !subject}
            className="px-6 py-2 bg-gmail-blue text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendMutation.isPending ? 'Sending...' : 'Send'}
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <Paperclip className="w-5 h-5 text-gmail-gray" />
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <Link2 className="w-5 h-5 text-gmail-gray" />
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <Smile className="w-5 h-5 text-gmail-gray" />
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <Image className="w-5 h-5 text-gmail-gray" />
          </button>
          <button 
            onClick={handleSmartCompose}
            disabled={isFetching}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            title="Smart Compose"
          >
            <Sparkles className={`w-5 h-5 text-gmail-blue ${isFetching ? 'animate-pulse' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  )
}
