import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'customer'
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth()

  // Se ainda está carregando, mostrar loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Se não tem usuário autenticado, redirecionar para login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Se requer role específica, verificar se o userProfile foi carregado
  if (requiredRole) {
    // Se ainda não carregou o perfil, aguardar (mas só se tiver usuário autenticado)
    if (!userProfile && user) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      )
    }

    // Se o role não corresponde, redirecionar
    if (userProfile && userProfile.role !== requiredRole) {
      // Se for admin tentando acessar rota admin, mas não tem role admin, redirecionar para login
      if (requiredRole === 'admin') {
        return <Navigate to="/login" replace />
      }
      // Se for customer tentando acessar rota admin, redirecionar para stores
      if (requiredRole === 'customer' && userProfile.role === 'admin') {
        return <Navigate to="/admin/menu" replace />
      }
      return <Navigate to="/stores" replace />
    }
  }

  return <>{children}</>
}

