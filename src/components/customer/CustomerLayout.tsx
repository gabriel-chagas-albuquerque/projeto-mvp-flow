import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import {
  Store,
  ShoppingCart,
  Package,
  User,
  LogOut,
} from 'lucide-react'

interface CustomerLayoutProps {
  children: React.ReactNode
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
  const location = useLocation()
  const { signOut } = useAuth()

  const menuItems = [
    { path: '/stores', icon: Store, label: 'Lojas' },
    { path: '/cart', icon: ShoppingCart, label: 'Carrinho' },
    { path: '/orders', icon: Package, label: 'Meus Pedidos' },
    { path: '/profile', icon: User, label: 'Meu Perfil' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6">Cliente</h2>
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className="w-full justify-start"
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </nav>
          <div className="mt-8">
            <Button variant="outline" className="w-full" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64">{children}</main>
    </div>
  )
}

