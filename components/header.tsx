'use client';

import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Lock, ShoppingBag } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-lg">
            <Lock className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-xl text-foreground">SecureEscrow</h1>
            <p className="text-xs text-muted-foreground">Buyer Marketplace</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/browse" className="text-foreground hover:text-primary transition-colors">
            Browse
          </Link>
          <Link href="/transactions" className="text-foreground hover:text-primary transition-colors">
            Transactions
          </Link>
          <Link href="/chat" className="text-foreground hover:text-primary transition-colors">
            Chat
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button asChild variant="default" size="sm">
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
