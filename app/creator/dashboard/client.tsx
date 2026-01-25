'use client'

import { CreatorNav } from '@/components/nav/creator-nav'

export default function DashboardClient() {
  return (
    <div className="min-h-screen bg-background">
      <CreatorNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="text-center space-y-4 sm:space-y-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground">
            Creator Dashboard
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            This page is under construction. We're building your creator dashboard!
          </p>
          <div className="pt-8">
            <div className="inline-block p-8 sm:p-12 rounded-lg bg-muted/50">
              <p className="text-muted-foreground">🚀 Coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
