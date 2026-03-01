import { TransactionDetailClient } from './client'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return {
    title: `Transaction ${id} — Umart`,
    description: 'View your transaction details and confirm value received',
  }
}

export default function TransactionDetailPage() {
  return <TransactionDetailClient />
}