'use client'

import { Card, CardContent } from '@/components/ui/card'

interface SearchKeywordsProps {
  category: string
  brand: string
  model: string
  searchKeywords: string[]
  onUpdate: (keywords: string[]) => void
}

export function SearchKeywords({
  category,
  searchKeywords,
}: SearchKeywordsProps) {
  // Only show for phone category
  if (category !== 'phones' || searchKeywords.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <div>
        <label className="text-sm font-medium">Search Keywords</label>
        <p className="text-xs text-muted-foreground mt-1">
          Auto-generated based on your product details
        </p>
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-2">
            {searchKeywords.map((keyword, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium"
              >
                {keyword}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {searchKeywords.length} keywords generated
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
