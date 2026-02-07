'use client'

import { useState, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Header } from '@/components/Header'
import { Sidebar } from '@/components/Sidebar'
import { EmailList } from '@/components/EmailList'
import { EmailView } from '@/components/EmailView'
import { ComposeModal } from '@/components/ComposeModal'
import { ShortcutsModal } from '@/components/ShortcutsModal'
import { LabelManager } from '@/components/LabelManager'
import { useKeyboardShortcuts } from '@/lib/useKeyboardShortcuts'
import { useDarkMode } from '@/lib/useDarkMode'
import { api } from '@/lib/api'

export default function Home() {
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null)
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)
  const [isLabelManagerOpen, setIsLabelManagerOpen] = useState(false)
  const [currentLabel, setCurrentLabel] = useState('INBOX')
  const [searchQuery, setSearchQuery] = useState('')
  const [useAISearch, setUseAISearch] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [emailIds, setEmailIds] = useState<string[]>([])
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const { toggle: toggleDarkMode } = useDarkMode()

  const handleSearch = (query: string, useAI?: boolean) => {
    setSearchQuery(query)
    if (useAI !== undefined) {
      setUseAISearch(useAI)
    }
  }

  const navigateEmail = useCallback((direction: 'next' | 'prev') => {
    if (!emailIds.length) return
    
    const currentIndex = selectedEmailId ? emailIds.indexOf(selectedEmailId) : -1
    let newIndex: number
    
    if (direction === 'next') {
      newIndex = currentIndex < emailIds.length - 1 ? currentIndex + 1 : 0
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : emailIds.length - 1
    }
    
    setSelectedEmailId(emailIds[newIndex])
  }, [emailIds, selectedEmailId])

  const handleStar = useCallback(async () => {
    if (!selectedEmailId) return
    try {
      const email = await api.getEmail(selectedEmailId)
      await api.updateEmail(selectedEmailId, { is_starred: !email.is_starred })
      queryClient.invalidateQueries({ queryKey: ['emails'] })
      queryClient.invalidateQueries({ queryKey: ['email', selectedEmailId] })
    } catch (e) {
      console.error('Failed to star email', e)
    }
  }, [selectedEmailId, queryClient])

  const handleMarkRead = useCallback(async () => {
    if (!selectedEmailId) return
    try {
      await api.updateEmail(selectedEmailId, { is_read: true })
      queryClient.invalidateQueries({ queryKey: ['emails'] })
    } catch (e) {
      console.error('Failed to mark as read', e)
    }
  }, [selectedEmailId, queryClient])

  const handleMarkUnread = useCallback(async () => {
    if (!selectedEmailId) return
    try {
      await api.updateEmail(selectedEmailId, { is_read: false })
      queryClient.invalidateQueries({ queryKey: ['emails'] })
    } catch (e) {
      console.error('Failed to mark as unread', e)
    }
  }, [selectedEmailId, queryClient])

  const handleDelete = useCallback(async () => {
    if (!selectedEmailId) return
    try {
      await api.deleteEmail(selectedEmailId)
      setSelectedEmailId(null)
      queryClient.invalidateQueries({ queryKey: ['emails'] })
    } catch (e) {
      console.error('Failed to delete email', e)
    }
  }, [selectedEmailId, queryClient])

  useKeyboardShortcuts({
    onCompose: () => setIsComposeOpen(true),
    onSearch: () => searchInputRef.current?.focus(),
    onRefresh: () => queryClient.invalidateQueries({ queryKey: ['emails'] }),
    onStar: handleStar,
    onMarkRead: handleMarkRead,
    onMarkUnread: handleMarkUnread,
    onDelete: handleDelete,
    onNextEmail: () => navigateEmail('next'),
    onPrevEmail: () => navigateEmail('prev'),
    onOpenEmail: () => {
      if (emailIds.length && !selectedEmailId) {
        setSelectedEmailId(emailIds[0])
      }
    },
    onClose: () => {
      if (isComposeOpen) setIsComposeOpen(false)
      else if (isShortcutsOpen) setIsShortcutsOpen(false)
      else if (isLabelManagerOpen) setIsLabelManagerOpen(false)
      else if (selectedEmailId) setSelectedEmailId(null)
    },
    onGoInbox: () => setCurrentLabel('INBOX'),
    onGoSent: () => setCurrentLabel('SENT'),
    onGoStarred: () => setCurrentLabel('STARRED'),
    onGoTrash: () => setCurrentLabel('TRASH'),
    onToggleDarkMode: toggleDarkMode,
    onHelp: () => setIsShortcutsOpen(prev => !prev),
  })

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        onSearch={handleSearch}
        searchQuery={searchQuery}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar 
          isOpen={sidebarOpen}
          currentLabel={currentLabel}
          onLabelChange={setCurrentLabel}
          onCompose={() => setIsComposeOpen(true)}
          onManageLabels={() => setIsLabelManagerOpen(true)}
        />
        
        <main className="flex-1 flex overflow-hidden">
          <EmailList 
            label={currentLabel}
            searchQuery={searchQuery}
            useAISearch={useAISearch}
            selectedId={selectedEmailId}
            onSelect={setSelectedEmailId}
            onEmailIdsChange={setEmailIds}
          />
          
          {selectedEmailId && (
            <EmailView 
              emailId={selectedEmailId}
              onClose={() => setSelectedEmailId(null)}
            />
          )}
        </main>
      </div>

      {isComposeOpen && (
        <ComposeModal onClose={() => setIsComposeOpen(false)} />
      )}

      {isShortcutsOpen && (
        <ShortcutsModal onClose={() => setIsShortcutsOpen(false)} />
      )}

      {isLabelManagerOpen && (
        <LabelManager onClose={() => setIsLabelManagerOpen(false)} />
      )}
    </div>
  )
}
