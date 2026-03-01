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
    <>
      {/*
        Desktop: stays in normal flow at the bottom of the flex column (mt-auto).
        Mobile: fixed to the bottom of the viewport so it's always visible
                while the message list scrolls freely behind it.
        safe-area-inset-bottom handles iPhone home indicator overlap.
      */}
      <div className="
        border-t border-border bg-background p-4 mt-auto
        md:relative md:bottom-auto md:left-auto md:right-auto md:z-auto
        fixed bottom-0 left-0 right-0 z-20
        pb-[calc(1rem+env(safe-area-inset-bottom))]
        md:pb-4
      ">
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
    </>
  )
}