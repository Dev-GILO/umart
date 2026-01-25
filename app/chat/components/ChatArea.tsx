'use client'

import { useEffect, useState, useRef } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { convertToDate } from '@/lib/timestamp'
import { Loader2 } from 'lucide-react'
import { ChatSenderBubble } from './ChatSenderBubble'
import { ChatRecipientBubble } from './ChatRecipientBubble'
import { ChatBox } from './ChatBox'

interface Message {
  id: string
  senderId: string
  senderName: string
  text: string
  createdAt: any
  isSystemAdmin: boolean
  isCreator: boolean
}

interface ChatAreaProps {
  chatId?: string
}

interface ChatInfo {
  productId?: string
  productName?: string
}

export function ChatArea({ chatId }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [messageSending, setMessageSending] = useState(false)
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastMessageCountRef = useRef(0)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid)
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!chatId) {
      setMessages([])
      setChatInfo(null)
      setLoading(false)
      setError('')
      return
    }

    let unsubscribeMessages: (() => void) | null = null
    let unsubscribeChat: (() => void) | null = null

    const setupRealtimeListeners = async () => {
      try {
        setLoading(true)
        setError('')
        
        const user = auth.currentUser
        if (!user) {
          setError('You must be logged in')
          setLoading(false)
          return
        }

        // Listen to chat info
        const chatDocRef = doc(db, 'chats', chatId)
        unsubscribeChat = onSnapshot(
          chatDocRef,
          (chatDoc) => {
            if (chatDoc.exists()) {
              const chatData = chatDoc.data()
              setChatInfo({
                productId: chatData?.productId,
                productName: chatData?.productName,
              })
            } else {
              setError('Chat not found')
            }
          },
          (err) => {
            console.error('Error listening to chat info:', err)
            setError('Failed to load chat info')
          }
        )

        // Listen to messages in real-time
        const messagesRef = collection(db, 'chats', chatId, 'messages')
        const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'))

        unsubscribeMessages = onSnapshot(
          messagesQuery,
          (snapshot) => {
            const newMessages: Message[] = snapshot.docs.map((doc) => {
              const data = doc.data()
              return {
                id: doc.id,
                senderId: data.senderId,
                senderName: data.senderName || 'User',
                text: data.text,
                createdAt: data.createdAt,
                isSystemAdmin: data.isSystemAdmin || false,
                isCreator: data.isCreator || false,
              }
            })

            setMessages(newMessages)
            setLoading(false)

            // Only scroll if new messages were added
            if (newMessages.length > lastMessageCountRef.current) {
              lastMessageCountRef.current = newMessages.length
              // Small delay to ensure DOM has updated
              setTimeout(scrollToBottom, 100)
            }
          },
          (err) => {
            console.error('Error listening to messages:', err)
            setError('Failed to load messages: ' + err.message)
            setLoading(false)
          }
        )
      } catch (err: any) {
        console.error('Error setting up listeners:', err)
        setError(err.message || 'Failed to load messages')
        setLoading(false)
      }
    }

    setupRealtimeListeners()

    return () => {
      if (unsubscribeMessages) {
        unsubscribeMessages()
      }
      if (unsubscribeChat) {
        unsubscribeChat()
      }
      lastMessageCountRef.current = 0
    }
  }, [chatId])

  const handleSendMessage = async (text: string) => {
    if (!chatId || !text.trim()) return

    try {
      setMessageSending(true)
      const user = auth.currentUser
      if (!user) return

      const token = await user.getIdToken()

      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chatId,
          text,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        console.error('Failed to send message:', result.error)
        setError('Failed to send message')
      }
      // No need to manually add message - real-time listener will handle it
    } catch (error) {
      console.error('Error sending message:', error)
      setError('Failed to send message')
    } finally {
      setMessageSending(false)
    }
  }

  if (!chatId) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/50">
        <div className="text-center">
          <p className="text-lg font-medium text-muted-foreground">Select a Chat to start chatting</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {/* Warning Banner */}
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-4">
          <p className="text-sm text-destructive font-medium">
            Chats are stored and we can review at any time. Buyers ensure to NOT MAKE PAYMENTS DIRECTLY IN SELLER ACCOUNT. Report any seller that asks you to make direct payment.
          </p>
        </div>

        {/* Product Info */}
        {chatInfo?.productId && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 mb-4">
            <p className="text-sm text-foreground">
              This chat started from this product:{' '}
              <a href={`/product/${chatInfo.productId}`} className="text-primary hover:underline font-medium">
                {chatInfo.productName || `View Product`}
              </a>
            </p>
          </div>
        )}

        {error && (
          <div className="text-center text-destructive text-sm mb-4">{error}</div>
        )}

        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const messageDate = convertToDate(message.createdAt)

            return (
              <div key={message.id}>
                {message.senderId === currentUserId ? (
                  <ChatSenderBubble
                    text={message.text}
                    senderName={message.senderName}
                    timestamp={messageDate}
                    isSystemAdmin={message.isSystemAdmin}
                    isCreator={message.isCreator}
                  />
                ) : (
                  <ChatRecipientBubble
                    text={message.text}
                    senderName={message.senderName}
                    timestamp={messageDate}
                    isSystemAdmin={message.isSystemAdmin}
                    isCreator={message.isCreator}
                  />
                )}
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      <ChatBox
        chatId={chatId}
        onSendMessage={handleSendMessage}
        disabled={!chatId}
        isLoading={messageSending}
      />
    </div>
  )
}