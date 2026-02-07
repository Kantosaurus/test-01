'use client'

import { useEffect } from 'react'

interface KeyboardShortcuts {
  onCompose?: () => void
  onSearch?: () => void
  onRefresh?: () => void
  onArchive?: () => void
  onDelete?: () => void
  onStar?: () => void
  onMarkRead?: () => void
  onMarkUnread?: () => void
  onNextEmail?: () => void
  onPrevEmail?: () => void
  onOpenEmail?: () => void
  onClose?: () => void
  onGoInbox?: () => void
  onGoSent?: () => void
  onGoStarred?: () => void
  onGoTrash?: () => void
  onToggleDarkMode?: () => void
  onHelp?: () => void
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      // Check for modifier keys
      const withCtrl = e.ctrlKey || e.metaKey
      const withShift = e.shiftKey

      // Gmail-like shortcuts
      switch (e.key.toLowerCase()) {
        case 'c':
          if (!withCtrl) {
            e.preventDefault()
            shortcuts.onCompose?.()
          }
          break
        case '/':
          e.preventDefault()
          shortcuts.onSearch?.()
          break
        case 'r':
          if (!withCtrl) {
            e.preventDefault()
            shortcuts.onRefresh?.()
          }
          break
        case 'e':
          if (!withCtrl) {
            e.preventDefault()
            shortcuts.onArchive?.()
          }
          break
        case '#':
          e.preventDefault()
          shortcuts.onDelete?.()
          break
        case 's':
          if (!withCtrl) {
            e.preventDefault()
            shortcuts.onStar?.()
          }
          break
        case 'i':
          if (withShift) {
            e.preventDefault()
            shortcuts.onMarkRead?.()
          }
          break
        case 'u':
          if (withShift) {
            e.preventDefault()
            shortcuts.onMarkUnread?.()
          }
          break
        case 'j':
          e.preventDefault()
          shortcuts.onNextEmail?.()
          break
        case 'k':
          e.preventDefault()
          shortcuts.onPrevEmail?.()
          break
        case 'o':
        case 'enter':
          e.preventDefault()
          shortcuts.onOpenEmail?.()
          break
        case 'escape':
          e.preventDefault()
          shortcuts.onClose?.()
          break
        case 'g':
          // Gmail-style "go to" shortcuts
          // Wait for next key
          break
        case 'd':
          if (!withCtrl) {
            e.preventDefault()
            shortcuts.onToggleDarkMode?.()
          }
          break
        case '?':
          e.preventDefault()
          shortcuts.onHelp?.()
          break
      }

      // Go shortcuts (g + key)
      if (e.key === 'i' && !withCtrl && !withShift) {
        shortcuts.onGoInbox?.()
      }
      if (e.key === 't' && !withCtrl && !withShift) {
        shortcuts.onGoSent?.()
      }
      if (e.key === 's' && !withCtrl && !withShift) {
        shortcuts.onGoStarred?.()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

export const shortcutsList = [
  { key: 'c', description: 'Compose new email' },
  { key: '/', description: 'Search' },
  { key: 'r', description: 'Refresh inbox' },
  { key: 'e', description: 'Archive' },
  { key: '#', description: 'Delete' },
  { key: 's', description: 'Star/unstar' },
  { key: 'Shift+i', description: 'Mark as read' },
  { key: 'Shift+u', description: 'Mark as unread' },
  { key: 'j', description: 'Next email' },
  { key: 'k', description: 'Previous email' },
  { key: 'o / Enter', description: 'Open email' },
  { key: 'Escape', description: 'Close' },
  { key: 'd', description: 'Toggle dark mode' },
  { key: '?', description: 'Show shortcuts' },
]
