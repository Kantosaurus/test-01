'use client'

import { X, Keyboard } from 'lucide-react'
import { shortcutsList } from '@/lib/useKeyboardShortcuts'

interface ShortcutsModalProps {
  onClose: () => void
}

export function ShortcutsModal({ onClose }: ShortcutsModalProps) {
  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-gmail-blue" />
            <h2 className="text-lg font-medium">Keyboard Shortcuts</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5 text-gmail-gray" />
          </button>
        </div>
        
        <div className="p-4 max-h-96 overflow-y-auto">
          <div className="space-y-2">
            {shortcutsList.map(({ key, description }) => (
              <div key={key} className="flex items-center justify-between py-1">
                <span className="text-sm text-gmail-gray">{description}</span>
                <kbd className="px-2 py-1 text-xs bg-gmail-lightGray dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 font-mono">
                  {key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
          <span className="text-sm text-gmail-gray">Press ? to toggle this menu</span>
        </div>
      </div>
    </div>
  )
}
