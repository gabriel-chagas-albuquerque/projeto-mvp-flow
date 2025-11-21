import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Edit2, Trash2, ArrowUp, ArrowDown } from 'lucide-react'

interface FreightBand {
  id: string
  store_id: string
  radius_km: number
  delivery_price: number
  name?: string
}

export default function AdminDelivery() {
  const { userProfile } = useAuth()
  const [faixas, setFaixas] = useState<FreightBand[]>([])

  useEffect(() => {
    if (userProfile?.store_id) {
      loadFaixas()
    }
  }, [userProfile])

  const loadFaixas = async () => {
    try {
      console.log('📥 [loadFaixas] Carregando faixas de frete para store_id:', userProfile.store_id)
      
      const { data, error } = await supabase
        .from('delivery_radius')
        .select('*')
        .eq('store_id', userProfile.store_id)
        .order('radius_km', { ascending: true })

      if (error) {
        console.error('❌ [loadFaixas] Erro ao carregar faixas:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })
        throw error
      }

      console.log('✅ [loadFaixas] Faixas carregadas com sucesso:', {
        count: data?.length || 0,
        faixas: data
      })
      setFaixas(data || [])
    } catch (error: any) {
      console.error('❌ [loadFaixas] Erro ao carregar faixas:', {
        error,
        message: error?.message,
        code: error?.code,
        details: error?.details
      })
    }
  }

  const createFaixa = async (data: { radius_km: number; delivery_price: number; name?: string }) => {
    try {
      console.log('📦 [createFaixa] Iniciando criação de faixa de frete')
      console.log('📦 [createFaixa] Dados recebidos:', {
        radius_km: data.radius_km,
        delivery_price: data.delivery_price,
        name: data.name,
        store_id: userProfile.store_id
      })

      // Validar dados antes de enviar
      if (!data.radius_km || data.radius_km <= 0) {
        console.error('❌ [createFaixa] Erro de validação: radius_km inválido', data.radius_km)
        toast.error('Distância máxima deve ser maior que zero')
        return
      }

      if (!data.delivery_price || data.delivery_price < 0) {
        console.error('❌ [createFaixa] Erro de validação: delivery_price inválido', data.delivery_price)
        toast.error('Valor do frete deve ser maior ou igual a zero')
        return
      }

      if (!userProfile?.store_id) {
        console.error('❌ [createFaixa] Erro: store_id não encontrado', userProfile)
        toast.error('ID da loja não encontrado')
        return
      }

      // Gerar nome padrão se não fornecido
      const name = data.name?.trim() || `Faixa até ${data.radius_km} km`

      const insertData = {
        store_id: userProfile.store_id,
        name: name,
        radius_km: data.radius_km,
        delivery_price: data.delivery_price,
      }

      console.log('📦 [createFaixa] Dados que serão inseridos:', insertData)

      const { data: insertedData, error } = await supabase
        .from('delivery_radius')
        .insert(insertData)
        .select()

      if (error) {
        console.error('❌ [createFaixa] Erro do Supabase:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })
        throw error
      }

      console.log('✅ [createFaixa] Faixa de frete criada com sucesso:', insertedData)
      toast.success('Faixa de frete criada!')
      loadFaixas()
    } catch (error: any) {
      console.error('❌ [createFaixa] Erro ao criar faixa de frete:', {
        error,
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack
      })
      
      const errorMessage = error?.message || error?.details || 'Erro ao criar faixa de frete'
      toast.error(`Erro: ${errorMessage}`)
    }
  }

  const updateFaixa = async (id: string, data: { radius_km: number; delivery_price: number }) => {
    try {
      console.log('✏️ [updateFaixa] Atualizando faixa de frete:', { id, data })
      
      const { error } = await supabase
        .from('delivery_radius')
        .update(data)
        .eq('id', id)

      if (error) {
        console.error('❌ [updateFaixa] Erro do Supabase:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })
        throw error
      }

      console.log('✅ [updateFaixa] Faixa de frete atualizada com sucesso')
      toast.success('Faixa de frete atualizada!')
      loadFaixas()
    } catch (error: any) {
      console.error('❌ [updateFaixa] Erro ao atualizar faixa de frete:', {
        error,
        message: error?.message,
        code: error?.code,
        details: error?.details
      })
      toast.error('Erro ao atualizar faixa de frete')
    }
  }

  const deleteFaixa = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta faixa de frete?')) {
      console.log('🚫 [deleteFaixa] Exclusão cancelada pelo usuário')
      return
    }

    try {
      console.log('🗑️ [deleteFaixa] Excluindo faixa de frete:', id)
      
      const { error } = await supabase
        .from('delivery_radius')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('❌ [deleteFaixa] Erro do Supabase:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })
        throw error
      }

      console.log('✅ [deleteFaixa] Faixa de frete removida com sucesso')
      toast.success('Faixa de frete removida!')
      loadFaixas()
    } catch (error: any) {
      console.error('❌ [deleteFaixa] Erro ao remover faixa de frete:', {
        error,
        message: error?.message,
        code: error?.code,
        details: error?.details
      })
      toast.error('Erro ao remover faixa de frete')
    }
  }

  const getDistanceRange = (index: number): string => {
    if (index === 0) {
      return `0 - ${faixas[index].radius_km} km`
    }
    const previousMax = faixas[index - 1].radius_km
    return `${previousMax.toFixed(2)} - ${faixas[index].radius_km} km`
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Faixas de Frete</h1>
            <p className="text-gray-600 mt-2">
              Configure as faixas de distância e seus respectivos valores de frete
            </p>
          </div>
          <CreateFaixaDialog onCreate={createFaixa} />
        </div>

        {faixas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600 mb-4">Nenhuma faixa de frete cadastrada</p>
              <p className="text-sm text-gray-500">
                As faixas devem ser cadastradas em ordem crescente de distância máxima
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {faixas.map((faixa, index) => (
              <Card key={faixa.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="w-32">
                          <p className="text-sm text-gray-600">Faixa {index + 1}</p>
                          <p className="text-lg font-semibold">{getDistanceRange(index)}</p>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">Valor do Frete</p>
                          <p className="text-xl font-bold">
                            R$ {faixa.delivery_price.toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <EditFaixaDialog
                        faixa={faixa}
                        onUpdate={updateFaixa}
                        onDelete={deleteFaixa}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CreateFaixaDialog({
  onCreate,
}: {
  onCreate: (data: { radius_km: number; delivery_price: number; name?: string }) => void
}) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    radius_km: '',
    delivery_price: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const radiusKm = parseFloat(formData.radius_km)
    const deliveryPrice = parseFloat(formData.delivery_price)
    
    console.log('📝 [CreateFaixaDialog] Formulário submetido:', {
      name: formData.name,
      radius_km: formData.radius_km,
      delivery_price: formData.delivery_price,
      parsed: {
        name: formData.name.trim() || undefined,
        radius_km: radiusKm,
        delivery_price: deliveryPrice
      }
    })

    // Validação adicional no frontend
    if (isNaN(radiusKm) || radiusKm <= 0) {
      console.error('❌ [CreateFaixaDialog] Validação falhou: radius_km inválido', radiusKm)
      return
    }

    if (isNaN(deliveryPrice) || deliveryPrice < 0) {
      console.error('❌ [CreateFaixaDialog] Validação falhou: delivery_price inválido', deliveryPrice)
      return
    }

    onCreate({
      name: formData.name.trim() || undefined,
      radius_km: radiusKm,
      delivery_price: deliveryPrice,
    })
    setFormData({ name: '', radius_km: '', delivery_price: '' })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nova Faixa de Frete</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Faixa de Frete</DialogTitle>
          <DialogDescription>
            Configure uma nova faixa de distância e seu respectivo valor de frete
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="faixa-name">Nome da Faixa</Label>
            <Input
              id="faixa-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Centro, Zona Norte, Até 5km"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Nome descritivo para identificar esta faixa de frete
            </p>
          </div>
          <div>
            <Label htmlFor="faixa-distance">Distância Máxima (km)</Label>
            <Input
              id="faixa-distance"
              type="number"
              step="0.1"
              min="0"
              value={formData.radius_km}
              onChange={(e) => setFormData({ ...formData, radius_km: e.target.value })}
              placeholder="Ex: 5, 10, 20"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Distância máxima em quilômetros para esta faixa
            </p>
          </div>
          <div>
            <Label htmlFor="faixa-value">Valor do Frete (R$)</Label>
            <Input
              id="faixa-value"
              type="number"
              step="0.01"
              min="0"
              value={formData.delivery_price}
              onChange={(e) => setFormData({ ...formData, delivery_price: e.target.value })}
              placeholder="Ex: 5.00, 10.00"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Valor do frete para entregas nesta faixa de distância
            </p>
          </div>
          <Button type="submit">Criar</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditFaixaDialog({
  faixa,
  onUpdate,
  onDelete,
}: {
  faixa: FreightBand
  onUpdate: (id: string, data: { radius_km: number; delivery_price: number }) => void
  onDelete: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    radius_km: faixa.radius_km.toString(),
    delivery_price: faixa.delivery_price.toString(),
  })

  useEffect(() => {
    setFormData({
      radius_km: faixa.radius_km.toString(),
      delivery_price: faixa.delivery_price.toString(),
    })
  }, [faixa])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(faixa.id, {
      radius_km: parseFloat(formData.radius_km),
      delivery_price: parseFloat(formData.delivery_price),
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit2 className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Faixa de Frete</DialogTitle>
          <DialogDescription>
            Atualize os valores da faixa de frete
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-faixa-distance">Distância Máxima (km)</Label>
            <Input
              id="edit-faixa-distance"
              type="number"
              step="0.1"
              min="0"
              value={formData.radius_km}
              onChange={(e) => setFormData({ ...formData, radius_km: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-faixa-value">Valor do Frete (R$)</Label>
            <Input
              id="edit-faixa-value"
              type="number"
              step="0.01"
              min="0"
              value={formData.delivery_price}
              onChange={(e) => setFormData({ ...formData, delivery_price: e.target.value })}
              required
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Salvar</Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                onDelete(faixa.id)
                setOpen(false)
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


