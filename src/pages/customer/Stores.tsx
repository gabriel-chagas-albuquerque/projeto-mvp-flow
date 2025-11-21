import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Store, MapPin, Phone, Mail } from 'lucide-react'
import { toast } from 'sonner'

interface StoreData {
  id: string
  name: string
  slug: string
  logo_url: string | null
  phone: string | null
  email: string | null
  address: string | null
  whatsapp: string | null
}

export default function CustomerStores() {
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const [stores, setStores] = useState<StoreData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStores()
  }, [])

  const loadStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error loading stores:', error)
        toast.error(`Erro ao carregar lojas: ${error.message}`)
        return
      }
      
      setStores(data || [])
    } catch (error: any) {
      console.error('Error loading stores:', error)
      toast.error(`Erro ao carregar lojas: ${error.message || 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleStoreClick = (slug: string) => {
    navigate(`/store/${slug}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (stores.length === 0) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Lojas Disponíveis</h1>
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-600">Nenhuma loja disponível no momento.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Lojas Disponíveis</h1>
          <p className="text-gray-600">Escolha uma loja para ver o cardápio e fazer seu pedido</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <Card
              key={store.id}
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
              onClick={() => handleStoreClick(store.slug)}
            >
              <CardHeader>
                {store.logo_url ? (
                  <div className="mb-4">
                    <img
                      src={store.logo_url}
                      alt={store.name}
                      className="w-full h-32 object-contain rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="mb-4 flex items-center justify-center h-32 bg-gray-100 rounded-lg">
                    <Store className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <CardTitle className="text-xl">{store.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  {store.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{store.address}</span>
                    </div>
                  )}
                  {store.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span>{store.phone}</span>
                    </div>
                  )}
                  {store.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{store.email}</span>
                    </div>
                  )}
                </div>
                <Button className="w-full mt-4" onClick={(e) => {
                  e.stopPropagation()
                  handleStoreClick(store.slug)
                }}>
                  Ver Cardápio
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
