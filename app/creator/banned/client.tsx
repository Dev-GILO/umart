'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function BannedClient() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-destructive/10">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-2xl">Account Restricted</CardTitle>
              <CardDescription>Access denied</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-foreground">
            Seems like your account is disallowed from being a seller on our platform. Please contact our support team for more information.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href="/">Go Home</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 bg-transparent">
              <a href="mailto:support@uhomes.ng">Contact Support</a>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Email: <a href="mailto:support@uhomes.ng" className="text-primary hover:underline">support@uhomes.ng</a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
