import { Metadata } from 'next'
import DashboardClient from './client'

export const metadata: Metadata = {
  title: 'Dashboard - uHomes Mart Creator',
  description: 'Creator dashboard for uHomes Mart',
}

export default function DashboardPage() {
  return <DashboardClient />
}
