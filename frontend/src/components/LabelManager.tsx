'use client'

import { useState } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { X, Plus, Trash2, Tag, Check } from 'lucide-react'
import { api } from '@/lib/api'
import clsx from 'clsx'

interface LabelManagerProps {
  onClose: () => void
}

const COLORS = [
  '#22d3ee', // cyan
  '#a78bfa', // violet
  '#fb7185', // rose
  '#fbbf24', // amber
  '#34d399', // emerald
  '#60a5fa', // blue
  '#f472b6', // pink
  '#a3e635', // lime
  '#818cf8', // indigo
  '#2dd4bf', // teal
]

export function LabelManager({ onClose }: LabelManagerProps) {
  const [newLabelName, setNewLabelName] = useState('')
  const [selectedColor, setSelectedColor] = useState(COLORS[0])
  const queryClient = useQueryClient()

  const { data: labels } = useQuery({
    queryKey: ['labels'],
    queryFn: api.getLabels,
  })

  const createMutation = useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) =>
      api.createLabel(name, color),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels'] })
      setNewLabelName('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: api.deleteLabel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels'] })
    },
  })

  const systemLabels = ['INBOX', 'SENT', 'DRAFTS', 'SPAM', 'TRASH', 'STARRED', 'IMPORTANT']
  const customLabels = labels?.filter(l => !systemLabels.includes(l.name)) || []

  const handleCreate = () => {
    if (newLabelName.trim()) {
      createMutation.mutate({ name: newLabelName.trim(), color: selectedColor })
    }
  }

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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-violet/20 to-accent-rose/20 flex items-center justify-center">
              <Tag className="w-4 h-4 text-accent-violet" />
            </div>
            <h2 className="font-heading text-lg font-semibold">Manage Labels</h2>
          </div>
          <button onClick={onClose} className="icon-btn">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create new label */}
        <div className="p-4 border-b border-white/5">
          <h3 className="text-sm font-medium text-white/60 mb-3">Create new label</h3>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              placeholder="Label name"
              className="input-glass flex-1 py-2 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate()
              }}
            />
            <button
              onClick={handleCreate}
              disabled={!newLabelName.trim() || createMutation.isPending}
              className={clsx(
                'px-4 py-2 rounded-xl transition-all',
                'bg-gradient-to-r from-accent-cyan to-accent-violet text-white',
                'hover:shadow-glow hover:scale-[1.02]',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
              )}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Color picker */}
          <div className="flex gap-2">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={clsx(
                  'w-7 h-7 rounded-lg transition-all flex items-center justify-center',
                  selectedColor === color ? 'ring-2 ring-offset-2 ring-offset-surface-base ring-white/30 scale-110' : 'hover:scale-105'
                )}
                style={{ backgroundColor: color }}
              >
                {selectedColor === color && (
                  <Check className="w-4 h-4 text-white drop-shadow-sm" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Custom labels */}
        <div className="p-4 max-h-56 overflow-y-auto">
          <h3 className="text-sm font-medium text-white/60 mb-3">Your labels</h3>
          {customLabels.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                <Tag className="w-6 h-6 text-white/20" />
              </div>
              <p className="text-sm text-white/40">No custom labels yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {customLabels.map((label) => (
                <div
                  key={label.name}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: label.color || '#9e9e9e' }}
                    />
                    <span className="text-sm text-white/80">{label.name}</span>
                    <span className="text-xs text-white/30">({label.email_count})</span>
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(label.name)}
                    disabled={deleteMutation.isPending}
                    className="icon-btn p-1.5 opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System labels */}
        <div className="p-4 border-t border-white/5">
          <h3 className="text-xs font-medium text-white/30 uppercase tracking-wider mb-3">System labels</h3>
          <div className="flex flex-wrap gap-2">
            {systemLabels.map((name) => (
              <span
                key={name}
                className="badge"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
