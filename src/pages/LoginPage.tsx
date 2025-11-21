import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, userProfile, loading: authLoading, user, clearUserProfile, disableAutoProfileLoad, enableAutoProfileLoad } = useAuth()
  const navigate = useNavigate()
  const loginAttempted = useRef(false)
  const profileWaitTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Desabilitar carregamento automático do perfil e limpar ao entrar na página de login
  useEffect(() => {
    disableAutoProfileLoad()
    clearUserProfile()
    
    // Reabilitar quando sair da página
    return () => {
      enableAutoProfileLoad()
    }
  }, [clearUserProfile, disableAutoProfileLoad, enableAutoProfileLoad])

  // Aguardar o userProfile ser atualizado após o login
  useEffect(() => {
    // Early return se não houve tentativa de login
    if (!loginAttempted.current) {
      return
    }

    // Limpar timeout anterior se existir
    if (profileWaitTimeout.current) {
      clearTimeout(profileWaitTimeout.current)
      profileWaitTimeout.current = null
    }

    // Se o perfil foi carregado, fazer o redirecionamento
    if (!authLoading && user && userProfile) {
      loginAttempted.current = false
      setLoading(false)
      
      // Pequeno delay para garantir que tudo está pronto
      setTimeout(() => {
        if (userProfile.role === 'admin') {
          navigate('/admin/menu', { replace: true })
        } else {
          navigate('/stores', { replace: true })
        }
      }, 100)
    } else if (!authLoading && user && !userProfile) {
      // Se o usuário está autenticado mas o perfil não carregou após 5 segundos, mostrar erro
      if (!profileWaitTimeout.current) {
        profileWaitTimeout.current = setTimeout(() => {
          console.error('Profile loading timeout - user authenticated but profile not found')
          toast.error('Erro ao carregar perfil do usuário. Por favor, tente novamente.')
          setLoading(false)
          loginAttempted.current = false
        }, 5000)
      }
    }

    // Cleanup timeout on unmount
    return () => {
      if (profileWaitTimeout.current) {
        clearTimeout(profileWaitTimeout.current)
      }
    }
  }, [userProfile, authLoading, user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    loginAttempted.current = true
    // Reabilitar carregamento automático para permitir que o perfil seja carregado após login
    enableAutoProfileLoad()

    try {
      await signIn(email, password)
      toast.success('Login realizado com sucesso!')
      // O redirecionamento será feito pelo useEffect quando userProfile for atualizado
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error(error.message || 'Erro ao fazer login')
      setLoading(false)
      loginAttempted.current = false
      // Desabilitar novamente em caso de erro
      disableAutoProfileLoad()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Entre com sua conta para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || authLoading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">Não tem uma conta? </span>
            <Link to="/register" className="text-blue-600 hover:underline">
              Cadastre-se
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

