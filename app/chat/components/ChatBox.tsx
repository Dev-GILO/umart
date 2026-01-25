'use client'

import React from 'react'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Loader2 } from 'lucide-react'

interface ChatBoxProps {
  chatId: string
  onSendMessage: (text: string) => Promise<void>
  disabled?: boolean
  isLoading?: boolean
}

export function ChatBox({ chatId, onSendMessage, disabled, isLoading }: ChatBoxProps) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!message.trim() || loading || isLoading) return

    try {
      setLoading(true)
      await onSendMessage(message)
      setMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-border bg-background p-4 mt-auto">
      <div className="flex gap-3">
        <Input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading || disabled || isLoading}
          className="flex-1"
        />
        <Button
          onClick={handleSend}
          disabled={loading || disabled || !message.trim() || isLoading}
          size="icon"
        >
          {loading || isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
