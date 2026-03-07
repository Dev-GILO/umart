'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Expand, X, ZoomIn } from 'lucide-react'

interface Props {
  images: string[]
  title: string
  currentIndex: number
  onChange: (index: number) => void
}

export function ImageGallery({ images, title, currentIndex, onChange }: Props) {
  const [fullscreen, setFullscreen] = useState(false)

  const prev = useCallback(() => {
    onChange((currentIndex - 1 + images.length) % images.length)
  }, [currentIndex, images.length, onChange])

  const next = useCallback(() => {
    onChange((currentIndex + 1) % images.length)
  }, [currentIndex, images.length, onChange])

  // Keyboard navigation
  useEffect(() => {
    if (!fullscreen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape') setFullscreen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [fullscreen, prev, next])

  // Lock body scroll when fullscreen
  useEffect(() => {
    document.body.style.overflow = fullscreen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [fullscreen])

  const hasMultiple = images.length > 1

  const NavButton = ({
    onClick,
    side,
  }: {
    onClick: () => void
    side: 'left' | 'right'
  }) => (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={`
        absolute top-1/2 -translate-y-1/2 z-10
        ${side === 'left' ? 'left-3' : 'right-3'}
        flex items-center justify-center
        w-9 h-9 rounded-full
        bg-background/80 border border-border
        text-foreground shadow-md
        backdrop-blur-sm
        hover:bg-background hover:scale-105
        transition-all duration-150
      `}
      aria-label={side === 'left' ? 'Previous image' : 'Next image'}
    >
      {side === 'left'
        ? <ChevronLeft className="w-5 h-5" />
        : <ChevronRight className="w-5 h-5" />
      }
    </button>
  )

  return (
    <>
      {/* ── Main viewer ──────────────────────────── */}
      <div className="relative group rounded-2xl overflow-hidden bg-muted border border-border">
        <div className="relative aspect-square w-full">
          {images.length > 0 ? (
            <Image
              src={images[currentIndex]}
              alt={`${title} — image ${currentIndex + 1}`}
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 60vw"
              priority={currentIndex === 0}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ZoomIn className="w-10 h-10 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Arrow controls */}
        {hasMultiple && (
          <>
            <NavButton onClick={prev} side="left" />
            <NavButton onClick={next} side="right" />
          </>
        )}

        {/* Counter pill */}
        {hasMultiple && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-background/80 border border-border text-xs font-medium text-foreground backdrop-blur-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Fullscreen trigger */}
        {images.length > 0 && (
          <button
            onClick={() => setFullscreen(true)}
            className="
              absolute top-3 right-3
              flex items-center justify-center w-8 h-8 rounded-full
              bg-background/80 border border-border text-foreground
              opacity-0 group-hover:opacity-100
              backdrop-blur-sm transition-all duration-150
              hover:scale-105
            "
            aria-label="View fullscreen"
          >
            <Expand className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Fullscreen overlay ───────────────────── */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md"
          onClick={() => setFullscreen(false)}
        >
          {/* Close */}
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
            aria-label="Close fullscreen"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Counter */}
          {hasMultiple && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-sm font-medium">
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {/* Image */}
          <div
            className="relative w-full h-full max-w-5xl mx-auto flex items-center justify-center px-16"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[currentIndex]}
              alt={`${title} — image ${currentIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {/* Fullscreen nav */}
          {hasMultiple && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev() }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-11 h-11 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-11 h-11 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Thumbnail strip in fullscreen */}
          {hasMultiple && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 px-6 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); onChange(i) }}
                  className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                    i === currentIndex
                      ? 'border-white scale-105'
                      : 'border-white/20 opacity-50 hover:opacity-80'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`Thumbnail ${i + 1}`}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}