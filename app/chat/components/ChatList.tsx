'use client'

import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { formatRelativeTime } from '@/lib/timestamp'
import { Card } from '@/components/ui/card'
import { Loader2, MessageCircle } from 'lucide-react'

interface ChatItem {
  chatId: string
  participantName: string
  participantId: string
  lastMessage: string
  lastMessageTime: any
  lastMessageSenderName?: string
  createdAt?: any
}

interface ChatListProps {
  selectedChatId?: string
  onSelectChat: (chatId: string) => void
}

export function ChatList({ selectedChatId, onSelectChat }: ChatListProps) {
  const [chats, setChats] = useState<ChatItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null
    const chatUnsubscribers = new Map<string, () => void>()

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        // Set up real-time listener for user's chats
        const userChatsRef = collection(db, 'users', user.uid, 'chats')
        const q = query(userChatsRef, orderBy('createdAt', 'desc'))

        unsubscribeSnapshot = onSnapshot(
          q,
          async (snapshot) => {
            if (snapshot.empty) {
              setChats([])
              setLoading(false)
              return
            }

            // Clean up old chat listeners
            chatUnsubscribers.forEach(unsub => unsub())
            chatUnsubscribers.clear()

            const chatsMap = new Map<string, ChatItem>()

            // Set up listeners for each chat
            snapshot.docs.forEach((chatRefDoc) => {
              const chatRefData = chatRefDoc.data()
              const chatId = chatRefData.chatId

              // Initialize with reference data
              chatsMap.set(chatId, {
                chatId,
                participantName: chatRefData.participantName || 'Unknown',
                participantId: chatRefData.participantId || '',
                lastMessage: '',
                lastMessageTime: chatRefData.createdAt,
                lastMessageSenderName: '',
                createdAt: chatRefData.createdAt,
              })

              // Listen to the main chat document for real-time updates
              const chatDocRef = doc(db, 'chats', chatId)
              const unsubChat = onSnapshot(
                chatDocRef,
                (chatDoc) => {
                  if (chatDoc.exists()) {
                    const chatData = chatDoc.data()
                    chatsMap.set(chatId, {
                      chatId,
                      participantName: chatRefData.participantName || 'Unknown',
                      participantId: chatRefData.participantId || '',
                      lastMessage: chatData?.lastMessage || '',
                      lastMessageTime: chatData?.lastMessageTime || chatRefData.createdAt,
                      lastMessageSenderName: chatData?.lastMessageSenderName || '',
                      createdAt: chatRefData.createdAt,
                    })

                    // Update state with latest chats
                    setChats(Array.from(chatsMap.values()))
                  }
                },
                (err) => {
                  console.error(`Error listening to chat ${chatId}:`, err)
                }
              )

              chatUnsubscribers.set(chatId, unsubChat)
            })

            // Set initial state
            setChats(Array.from(chatsMap.values()))
            setLoading(false)
          },
          (err) => {
            console.error('Error listening to chats:', err)
            setError('Failed to load chats')
            setLoading(false)
          }
        )
      } catch (err: any) {
        console.error('Error setting up chat listeners:', err)
        setError(err.message || 'Failed to load chats')
        setLoading(false)
      }
    })

    return () => {
      unsubscribeAuth()
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot()
      }
      chatUnsubscribers.forEach(unsub => unsub())
      chatUnsubscribers.clear()
    }
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
        <p className="text-muted-foreground">Loading chats...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <MessageCircle className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
        <p className="text-muted-foreground">No chats yet</p>
        <p className="text-sm text-muted-foreground mt-1">Start a conversation with a seller</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {chats.map((chat) => (
        <Card
          key={chat.chatId}
          className={`p-4 cursor-pointer transition-colors ${
            selectedChatId === chat.chatId
              ? 'bg-primary/10 border-primary'
              : 'hover:bg-muted/50'
          }`}
          onClick={() => onSelectChat(chat.chatId)}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-foreground text-sm">
              {chat.participantName || `Chat: ${chat.chatId.slice(0, 8)}`}
            </h3>
            {chat.lastMessageTime && (
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(chat.lastMessageTime)}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {chat.lastMessageSenderName ? (
              <span>
                <strong>{chat.lastMessageSenderName}:</strong> {chat.lastMessage || 'No messages yet'}
              </span>
            ) : (
              chat.lastMessage || 'No messages yet'
            )}
          </p>
        </Card>
      ))}
    </div>
  )
}