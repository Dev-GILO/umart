import { CreatorTransactionDetailClient } from './client'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return {
    title: `Sale ${id} — Creator Dashboard`,
    description: 'View your sale details and withdraw funds',
  }
}

export default function CreatorTransactionDetailPage() {
  return <CreatorTransactionDetailClient />
}