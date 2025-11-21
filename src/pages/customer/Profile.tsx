import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Edit2, Save, X } from 'lucide-react'
import { toast } from 'sonner'

export default function CustomerProfile() {
  const { userProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    address: '',
  })

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        phone: userProfile.phone || '',
        whatsapp: userProfile.whatsapp || '',
        address: userProfile.address || '',
      })
    }
  }, [userProfile])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Restaurar valores originais
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        phone: userProfile.phone || '',
        whatsapp: userProfile.whatsapp || '',
        address: userProfile.address || '',
      })
    }
  }

  const handleSave = async () => {
    if (!userProfile?.id) return

    try {
      setLoading(true)
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          address: formData.address,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userProfile.id)

      if (error) throw error

      toast.success('Informações atualizadas com sucesso!')
      setIsEditing(false)
      // Recarregar a página para atualizar o userProfile
      window.location.reload()
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error('Erro ao atualizar informações')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
          {!isEditing && (
            <Button onClick={handleEdit} variant="outline">
              <Edit2 className="h-4 w-4 mr-2" />
              Editar Informações
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={userProfile?.email || ''} disabled />
              <p className="text-sm text-gray-500 mt-1">O email não pode ser alterado</p>
            </div>
            <div>
              <Label>Telefone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                disabled={!isEditing}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <Label>Endereço</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={!isEditing}
                placeholder="Rua, número, bairro, cidade, estado"
              />
            </div>

            {isEditing && (
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={loading}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

