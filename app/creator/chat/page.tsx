import { Metadata } from 'next'
import { CreatorNav } from '@/components/nav/creator-nav'
import { CreatorChatClient } from './client'

export const metadata: Metadata = {
  title: 'Chat - uHomes Mart Creator',
  description: 'Chat with buyers',
}

export default function CreatorChatPage() {
  return (
    <div className="min-h-screen bg-background">
      <CreatorNav />
      <CreatorChatClient />
    </div>
  )
}
