// hooks/useBanks.ts

import { useEffect, useState } from 'react'

export interface Bank {
  name: string
  code: string
}

let cachedBanks: Bank[] | null = null

export function useBanks() {
  const [banks, setBanks] = useState<Bank[]>(cachedBanks ?? [])
  const [loading, setLoading] = useState(!cachedBanks)
  const [error, setError] = useState('')

  useEffect(() => {
    if (cachedBanks) {
      setBanks(cachedBanks)
      setLoading(false)
      return
    }

    let cancelled = false

    const fetchBanks = async () => {
      try {
        setLoading(true)
        setError('')

        const res = await fetch('https://api.paystack.co/bank?country=nigeria&perPage=200', {
          headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY}` },
        })

        if (!res.ok) throw new Error('Failed to fetch banks')

        const json = await res.json()
        if (!json.status) throw new Error(json.message || 'Paystack error')

        const seen = new Set<string>()
        const mapped: Bank[] = (json.data as any[]).reduce<Bank[]>((acc, b) => {
          const code = b.code as string
          if (!seen.has(code)) {
            seen.add(code)
            acc.push({ name: b.name as string, code })
          }
          return acc
        }, [])

        cachedBanks = mapped
        if (!cancelled) setBanks(mapped)
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Could not load banks')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchBanks()
    return () => { cancelled = true }
  }, [])

  return { banks, loading, error }
}