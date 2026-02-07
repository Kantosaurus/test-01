'use client'

import { useState } from 'react'
import { Menu, Search, Settings, HelpCircle, Sparkles, Command } from 'lucide-react'

interface HeaderProps {
  onMenuClick: () => void
  onSearch: (query: string, useAI?: boolean) => void
  searchQuery: string
}

export function Header({ onMenuClick, onSearch, searchQuery }: HeaderProps) {
  const [useAISearch, setUseAISearch] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  return (
    <header className="h-16 flex items-center px-4 gap-4">
      {/* Menu toggle */}
      <button
        onClick={onMenuClick}
        className="icon-btn"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Logo / Brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-violet flex items-center justify-center">
          <span className="text-white font-heading font-bold text-sm">M</span>
        </div>
        <span className="font-heading font-semibold text-lg tracking-tight hidden sm:block">
          Mailflow
        </span>
      </div>

      {/* Search bar */}
      <div className="flex-1 max-w-2xl mx-4">
        <div className={`search-container transition-all duration-300 ${isFocused ? 'scale-[1.02]' : ''}`}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder={useAISearch ? "Search with AI..." : "Search emails"}
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value, useAISearch)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSearch(searchQuery, useAISearch)
              }
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="input-glass w-full pl-11 pr-24 py-2.5 text-sm"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              onClick={() => setUseAISearch(!useAISearch)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all duration-200 ${
                useAISearch
                  ? 'bg-gradient-to-r from-accent-violet/20 to-accent-rose/20 text-accent-violet border border-accent-violet/30'
                  : 'hover:bg-white/5 text-white/40'
              }`}
              title={useAISearch ? "AI Search enabled" : "Enable AI Search"}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-1">
        <button className="icon-btn hidden sm:flex" title="Keyboard shortcuts">
          <Command className="w-4 h-4" />
        </button>
        <button className="icon-btn" title="Help">
          <HelpCircle className="w-4 h-4" />
        </button>
        <button className="icon-btn" title="Settings">
          <Settings className="w-4 h-4" />
        </button>

        {/* User avatar */}
        <button className="ml-2 w-9 h-9 rounded-xl bg-gradient-to-br from-accent-rose to-accent-violet flex items-center justify-center text-white text-sm font-medium transition-transform hover:scale-105">
          U
        </button>
      </div>
    </header>
  )
}
