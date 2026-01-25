'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, ArrowRight, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CreatorNav } from '@/components/nav/creator-nav'

export default function SuccessClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const productId = searchParams.get('productId')

  useEffect(() => {
    // Confetti animation
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: any[] = []
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

    // Create confetti particles
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -10,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 4 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 2,
        rotation: Math.random() * Math.PI * 2,
        rotationVel: (Math.random() - 0.5) * 0.2,
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p, index) => {
        p.y += p.vy
        p.x += p.vx
        p.vy += 0.1 // gravity
        p.rotation += p.rotationVel

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
        ctx.restore()

        // Remove particles that have fallen off screen
        if (p.y > canvas.height) {
          particles.splice(index, 1)
        }
      })

      if (particles.length > 0) {
        requestAnimationFrame(animate)
      }
    }

    animate()

    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />

      <div className="relative z-10 max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 animate-ping opacity-75 bg-green-400 rounded-full w-24 h-24" />
              <CheckCircle2 className="w-24 h-24 text-green-500 relative" />
      {/* <CreatorNav />   */}
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold">Congratulations!</h1>
            <p className="text-lg text-muted-foreground">
              Your product has been successfully created and is now live on uHomes Mart
            </p>
          </div>
        </div>

        {/* Product Details Card */}
        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Product ID</p>
            <p className="font-mono text-sm font-medium break-all">
              {productId || 'N/A'}
            </p>
          </div>

          <div className="border-t border-border pt-4 space-y-2">
            <p className="text-sm font-medium">What's next?</p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Your product is now visible to buyers</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>You'll receive notifications when buyers contact you</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                <span>Manage all your listings from your dashboard</span>
              </li>
            </ul>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => router.push('/creator/dashboard')}
            className="w-full gap-2"
            size="lg"
          >
            Go to Dashboard
            <ArrowRight className="w-4 h-4" />
          </Button>

          <Button
            onClick={() => router.push('/creator/product/create')}
            variant="outline"
            className="w-full"
            size="lg"
          >
            Create Another Product
          </Button>

          <Button
            onClick={() => router.push('/')}
            variant="ghost"
            className="w-full gap-2"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  )
}
