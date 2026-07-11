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
    <div className="theme-admin flex flex-col md:flex-row h-screen bg-secondary">
      {/* Sidebar */}
      <div className="w-full md:w-64 flex-shrink-0 bg-background border-b md:border-b-0 md:border-r border-border flex flex-col">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex flex-row md:flex-col justify-between items-center md:items-start h-16 md:h-auto flex-shrink-0 px-6 py-4 border-b border-border bg-primary/5">
            <span className="text-xl font-bold tracking-tight text-primary-dark">
              Nakoda Admin
            </span>
            <div className="md:hidden">
              <form action={logout}>
                <button type="submit" className="text-muted-foreground hover:text-red-600 transition-colors p-2">
                  <LogOut className="h-5 w-5" />
                </button>
              </form>
            </div>
          </div>
          <div className="flex-1 flex md:flex-col overflow-x-auto md:overflow-y-auto no-scrollbar border-b md:border-none border-border/50">
            <nav className="flex-1 px-4 py-3 md:py-6 flex flex-row md:flex-col gap-2 md:gap-0 md:space-y-2 min-w-max md:min-w-0">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center px-4 md:px-3 py-2 text-sm font-medium rounded-full md:rounded-md text-foreground bg-secondary/50 md:bg-transparent hover:bg-secondary hover:text-primary transition-colors group whitespace-nowrap"
                  >
                    <Icon className="mr-2 md:mr-3 h-4 w-4 md:h-5 md:w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="hidden md:flex flex-shrink-0 border-t border-border p-4">
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
