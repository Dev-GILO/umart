'use client'

import Image from 'next/image'

interface Props {
  images: string[]
  currentIndex: number
  onSelect: (index: number) => void
  orientation: 'vertical' | 'horizontal'
}

export function Thumbnails({ images, currentIndex, onSelect, orientation }: Props) {
  if (orientation === 'vertical') {
    return (
      <div className="flex flex-col gap-2 w-[76px] max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`
              relative flex-shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden border-2 transition-all duration-150
              ${i === currentIndex
                ? 'border-primary shadow-sm shadow-primary/20 scale-105'
                : 'border-border opacity-60 hover:opacity-90 hover:border-border/80'
              }
            `}
            aria-label={`View image ${i + 1}`}
          >
            <Image
              src={img}
              alt={`Thumbnail ${i + 1}`}
              fill
              className="object-cover"
              sizes="72px"
            />
          </button>
        ))}
      </div>
    )
  }

  // Horizontal strip for mobile
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
      {images.map((img, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={`
            relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-150
            ${i === currentIndex
              ? 'border-primary shadow-sm shadow-primary/20 scale-105'
              : 'border-border opacity-60 hover:opacity-90'
            }
          `}
          aria-label={`View image ${i + 1}`}
        >
          <Image
            src={img}
            alt={`Thumbnail ${i + 1}`}
            fill
            className="object-cover"
            sizes="64px"
          />
        </button>
      ))}
    </div>
  )
}