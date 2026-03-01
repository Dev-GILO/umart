import { AdminNav } from '@/components/nav/admin-nav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background lg:flex lg:min-h-screen">
      <AdminNav />
      <main className="flex-1 min-w-0 pt-[53px] lg:pt-0">
        {children}
      </main>
    </div>
  )
}