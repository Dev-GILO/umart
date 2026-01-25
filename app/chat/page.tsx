import { Metadata } from 'next'
import { BuyerNav } from '@/components/nav/buyer-nav'
import { ChatClient } from './client'

export const metadata: Metadata = {
  title: 'Chat - uHomes Mart',
  description: 'Chat with other users',
}

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-background">
      <BuyerNav />
      <ChatClient />
    </div>
  )
}
