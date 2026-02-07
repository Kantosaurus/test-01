'use client'

import { useState } from 'react'
import { Menu, Search, Settings, HelpCircle, Grid3X3, Sparkles } from 'lucide-react'

interface HeaderProps {
  onMenuClick: () => void
  onSearch: (query: string, useAI?: boolean) => void
  searchQuery: string
}

export function Header({ onMenuClick, onSearch, searchQuery }: HeaderProps) {
  const [useAISearch, setUseAISearch] = useState(false)
  
  return (
    <header className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
      <button 
        onClick={onMenuClick}
        className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <Menu className="w-5 h-5 text-gmail-gray" />
      </button>
      
      <div className="flex items-center ml-4">
        <img 
          src="https://ssl.gstatic.com/ui/v1/icons/mail/rfr/logo_gmail_lockup_default_1x_r5.png" 
          alt="Gmail" 
          className="h-8"
        />
      </div>

      <div className="flex-1 max-w-2xl mx-8">
        <div className="relative flex items-center">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gmail-gray" />
          <input
            type="text"
            placeholder={useAISearch ? "AI semantic search..." : "Search mail"}
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value, useAISearch)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSearch(searchQuery, useAISearch)
              }
            }}
            className="w-full pl-12 pr-14 py-3 bg-gmail-lightGray dark:bg-gray-800 rounded-full focus:outline-none focus:bg-white focus:shadow-md dark:focus:bg-gray-700 transition-all"
          />
          <button
            onClick={() => setUseAISearch(!useAISearch)}
            className={`absolute right-3 p-1.5 rounded-full transition-colors ${
              useAISearch 
                ? 'bg-gmail-blue text-white' 
                : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gmail-gray'
            }`}
            title={useAISearch ? "AI Search enabled" : "Enable AI Search"}
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          <HelpCircle className="w-5 h-5 text-gmail-gray" />
        </button>
        <button className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          <Settings className="w-5 h-5 text-gmail-gray" />
        </button>
        <button className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          <Grid3X3 className="w-5 h-5 text-gmail-gray" />
        </button>
        <div className="w-8 h-8 rounded-full bg-gmail-blue text-white flex items-center justify-center ml-2">
          U
        </div>
      </div>
    </header>
  )
}
