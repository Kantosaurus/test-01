'use client'

import { useState } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { X, Plus, Trash2, Tag } from 'lucide-react'
import { api } from '@/lib/api'

interface LabelManagerProps {
  onClose: () => void
}

const COLORS = [
  '#ea4335', '#fbbc04', '#34a853', '#4285f4', '#9334e6',
  '#f538a0', '#ff6d01', '#46bdc6', '#7baaf7', '#185abc',
]

export function LabelManager({ onClose }: LabelManagerProps) {
  const [newLabelName, setNewLabelName] = useState('')
  const [selectedColor, setSelectedColor] = useState(COLORS[3])
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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-gmail-blue" />
            <h2 className="text-lg font-medium">Manage Labels</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5 text-gmail-gray" />
          </button>
        </div>
        
        {/* Create new label */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium mb-3">Create new label</h3>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              placeholder="Label name"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-gmail-blue"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate()
              }}
            />
            <button
              onClick={handleCreate}
              disabled={!newLabelName.trim() || createMutation.isPending}
              className="px-4 py-2 bg-gmail-blue text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-2">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-6 h-6 rounded-full ${
                  selectedColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Custom labels */}
        <div className="p-4 max-h-64 overflow-y-auto">
          <h3 className="text-sm font-medium mb-3">Your labels</h3>
          {customLabels.length === 0 ? (
            <p className="text-sm text-gmail-gray">No custom labels yet</p>
          ) : (
            <div className="space-y-2">
              {customLabels.map((label) => (
                <div 
                  key={label.name}
                  className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: label.color || '#9e9e9e' }}
                    />
                    <span className="text-sm">{label.name}</span>
                    <span className="text-xs text-gmail-gray">({label.email_count})</span>
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate(label.name)}
                    disabled={deleteMutation.isPending}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <Trash2 className="w-4 h-4 text-gmail-gray" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System labels */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium mb-2 text-gmail-gray">System labels</h3>
          <div className="flex flex-wrap gap-2">
            {systemLabels.map((name) => (
              <span 
                key={name}
                className="px-2 py-1 text-xs bg-gmail-lightGray dark:bg-gray-700 rounded"
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
