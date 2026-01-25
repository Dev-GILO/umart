// Phone variants that should be expanded into search keywords
const PHONE_VARIANTS = {
  'plus': ['plus', '+'],
  'pro': ['pr', 'pro'],
  'pro max': ['pm', 'pro max'],
  'ultra': ['u', 'ultra'],
  'max': ['max'],
  'lite': ['lite'],
  'mini': ['mini'],
  'xr': ['xr'],
  'xs': ['xs'],
  'se': ['se'],
  'fe': ['fe'],
  'note': ['note'],
  'edge': ['edge'],
  'fold': ['fold'],
  'flip': ['flip'],
  'zoom': ['zoom'],
}

export function generateSearchKeywords(brand: string, model: string): string[] {
  const brandLower = brand.toLowerCase().trim()
  const modelLower = model.toLowerCase().trim()

  const keywords: Set<string> = new Set()

  // Extract number patterns from model (e.g., "16", "s23", "14")
  const numberMatches = modelLower.match(/\d+/g) || []
  const numbers = numberMatches.length > 0 ? numberMatches[0] : ''

  // Add base brand
  keywords.add(brandLower)

  // Add base model without extra spaces
  const modelClean = modelLower.replace(/\s+/g, ' ')
  keywords.add(modelClean)

  // Add brand + model combinations
  if (modelClean) {
    keywords.add(`${brandLower} ${modelClean}`)
  }

  // Process variants in the model
  let remainingModel = modelClean
  const variants: { variant: string; abbreviations: string[] }[] = []

  for (const [variant, abbrevs] of Object.entries(PHONE_VARIANTS)) {
    if (modelClean.includes(variant)) {
      variants.push({ variant, abbreviations: abbrevs })
      remainingModel = remainingModel.replace(variant, '').trim()
    }
  }

  // Add number-based keywords
  if (numbers) {
    keywords.add(numbers)

    // Add number + variant combinations
    variants.forEach(({ variant, abbreviations }) => {
      // Full variant
      keywords.add(`${numbers} ${variant}`)
      
      // Abbreviations
      abbreviations.forEach(abbr => {
        keywords.add(`${numbers}${abbr}`)
        keywords.add(`${numbers} ${abbr}`)
      })
    })

    // Add number + model (for names like Galaxy S25)
    if (remainingModel && remainingModel !== numbers) {
      const modelNamePart = remainingModel.replace(numbers, '').trim()
      if (modelNamePart) {
        keywords.add(`${modelNamePart} ${numbers}`)
        keywords.add(`${brandLower} ${modelNamePart} ${numbers}`)
      }
    }
  }

  // Add variant combinations with brand
  variants.forEach(({ variant, abbreviations }) => {
    keywords.add(`${brandLower} ${variant}`)
    abbreviations.forEach(abbr => {
      keywords.add(`${brandLower} ${abbr}`)
    })
  })

  // For Samsung Galaxy style phones
  if (modelClean.includes('galaxy') && numbers) {
    keywords.add(`galaxy ${numbers}`)
    keywords.add(`${brandLower} galaxy ${numbers}`)
    
    variants.forEach(({ abbreviations }) => {
      abbreviations.forEach(abbr => {
        keywords.add(`galaxy s${abbr}`)
        keywords.add(`s${abbr}`)
      })
    })
  }

  // For iPhone style phones
  if (brandLower === 'apple' && modelClean.includes('iphone')) {
    keywords.add('iphone')
    if (numbers) {
      keywords.add(`iphone ${numbers}`)
      keywords.add(`iphone${numbers}`)
    }
    
    variants.forEach(({ variant, abbreviations }) => {
      keywords.add(`iphone ${variant}`)
      abbreviations.forEach(abbr => {
        keywords.add(`iphone ${abbr}`)
      })
    })
  }

  // Filter out empty strings and sort for consistency
  return Array.from(keywords)
    .filter(k => k.length > 0)
    .sort()
}
