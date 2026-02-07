'use client'

import { X, Keyboard } from 'lucide-react'
import { shortcutsList } from '@/lib/useKeyboardShortcuts'

interface ShortcutsModalProps {
  onClose: () => void
}

export function ShortcutsModal({ onClose }: ShortcutsModalProps) {
  return (
    <div
      className="modal-overlay flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="glass-panel w-full max-w-md shadow-card animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-cyan/20 to-accent-violet/20 flex items-center justify-center">
              <Keyboard className="w-4 h-4 text-accent-cyan" />
            </div>
            <h2 className="font-heading text-lg font-semibold">Keyboard Shortcuts</h2>
          </div>
          <button onClick={onClose} className="icon-btn">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="p-4 max-h-80 overflow-y-auto">
          <div className="space-y-1">
            {shortcutsList.map(({ key, description }) => (
              <div
                key={key}
                className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-white/3 transition-colors"
              >
                <span className="text-sm text-white/60">{description}</span>
                <kbd className="px-2.5 py-1 text-xs bg-white/5 rounded-lg border border-white/10 font-mono text-white/80">
                  {key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 text-center">
          <span className="text-sm text-white/40">
            Press <kbd className="px-1.5 py-0.5 text-xs bg-white/5 rounded border border-white/10 font-mono mx-1">?</kbd> to toggle this menu
          </span>
        </div>
      </div>
    </div>
  )
}
