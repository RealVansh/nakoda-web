import { ReactNode } from 'react'
import Link from 'next/link'
import { logout } from '@/actions/auth.actions'
import {
  LayoutDashboard,
  Package,
  Tags,
  Layers,
  LogOut,
} from 'lucide-react'

import { requireAdmin } from '@/actions/auth.actions'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Categories', href: '/admin/categories', icon: Tags },
  { name: 'Collections', href: '/admin/collections', icon: Layers },
]

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin()
  
  return (
    <div className="theme-admin flex h-screen bg-secondary">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 bg-background border-r border-border flex flex-col">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center h-16 flex-shrink-0 px-6 border-b border-border bg-primary/5">
            <span className="text-xl font-bold tracking-tight text-primary-dark">
              Nakoda Admin
            </span>
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-foreground hover:bg-secondary hover:text-primary transition-colors group"
                  >
                    <Icon className="mr-3 h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-border p-4">
            <form action={logout} className="w-full">
              <button
                type="submit"
                className="flex w-full items-center px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
