import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function AdminSettings() {
  const { userProfile } = useAuth()
  const [store, setStore] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    phone: '',
    email: '',
    address: '',
  })

  useEffect(() => {
    if (userProfile?.store_id) {
      loadStore()
    }
  }, [userProfile])

  const loadStore = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', userProfile.store_id)
        .single()

      if (error) throw error
      setStore(data)
      setFormData({
        name: data.name || '',
        logo_url: data.logo_url || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
      })
    } catch (error) {
      console.error('Error loading store:', error)
    }
  }

  const updateStore = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('stores')
        .update(formData)
        .eq('id', userProfile.store_id)

      if (error) throw error
      toast.success('Dados da loja atualizados!')
      loadStore()
    } catch (error: any) {
      toast.error('Erro ao atualizar dados')
    }
  }

  if (!store) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Configurações da Loja</h1>

        <Card>
          <CardHeader>
            <CardTitle>Informações da Loja</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={updateStore} className="space-y-4">
              <div>
                <Label htmlFor="store-name">Nome da Loja</Label>
                <Input
                  id="store-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="store-logo">URL do Logo</Label>
                <Input
                  id="store-logo"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="store-phone">Telefone</Label>
                <Input
                  id="store-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="store-email">Email</Label>
                <Input
                  id="store-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="store-address">Endereço</Label>
                <Input
                  id="store-address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="pt-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Link do Cardápio:</strong>
                </p>
                <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                  {window.location.origin}/store/{store.slug}
                </p>
              </div>
              <Button type="submit">Salvar Alterações</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

