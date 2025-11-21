import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Trash2, Plus, Minus, MapPin, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { calcularFrete, type FreightCalculation } from '@/lib/freight'

interface CartItem {
  id: string
  product_id: string
  product: {
    name: string
    price: number
    image_url: string | null
  }
  quantity: number
  price_at_time: number
}

export default function CustomerCart() {
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartTotal, setCartTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())
  const [freightCalculation, setFreightCalculation] = useState<FreightCalculation | null>(null)
  const [calculatingFreight, setCalculatingFreight] = useState(false)
  const [storeId, setStoreId] = useState<string | null>(null)

  useEffect(() => {
    if (userProfile?.id) {
      loadCart(true)
    }
  }, [userProfile])

  // Calcular frete automaticamente quando o carrinho e o CEP estiverem disponíveis
  useEffect(() => {
    if (storeId && userProfile?.cep && cartItems.length > 0 && !calculatingFreight) {
      const cleanCEP = userProfile.cep.replace(/\D/g, '')
      if (cleanCEP.length === 8) {
        handleCEPChange(cleanCEP)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, userProfile?.cep, cartItems.length])

  const loadCart = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true)
      }
      // Buscar todos os carrinhos do usuário
      const { data: carts, error: cartsError } = await supabase
        .from('carts')
        .select('id, store_id')
        .eq('user_id', userProfile.id)

      if (cartsError) throw cartsError

      if (carts && carts.length > 0) {
        setStoreId(carts[0].store_id)
        // Buscar itens do primeiro carrinho
        const { data: items, error: itemsError } = await supabase
          .from('cart_items')
          .select(`
            id,
            product_id,
            quantity,
            price_at_time,
            product:products!cart_items_product_id_fkey(name, price, image_url)
          `)
          .eq('cart_id', carts[0].id)

        if (itemsError) throw itemsError

        // Garantir que product seja um objeto único, não um array, e não seja null
        const formattedItems: CartItem[] = (items || [])
          .map((item: any) => {
            let product = Array.isArray(item.product) ? item.product[0] : item.product
            
            // Se product for null ou undefined, criar um objeto padrão
            if (!product) {
              product = {
                name: 'Produto não encontrado',
                price: item.price_at_time || 0,
                image_url: null
              }
            }
            
            return {
              id: item.id,
              product_id: item.product_id,
              quantity: item.quantity,
              price_at_time: item.price_at_time,
              product: product,
            }
          })
          .filter((item) => item.product !== null) // Filtrar itens sem produto válido

        setCartItems(formattedItems)
        const total = formattedItems.reduce(
          (sum, item) => sum + Number(item.price_at_time) * item.quantity,
          0
        )
        setCartTotal(total)
      } else {
        setCartItems([])
        setCartTotal(0)
      }
    } catch (error) {
      console.error('Error loading cart:', error)
      toast.error('Erro ao carregar carrinho')
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  const calculateTotal = (items: CartItem[]) => {
    return items.reduce(
      (sum, item) => sum + Number(item.price_at_time) * item.quantity,
      0
    )
  }

  const handleCEPChange = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, '')

    // Validar formato do CEP (8 dígitos)
    if (cleanCEP.length !== 8) {
      setFreightCalculation(null)
      return
    }

    if (!storeId) {
      return
    }

    setCalculatingFreight(true)
    try {
      const result = await calcularFrete(storeId, cleanCEP)
      setFreightCalculation(result)
      
      if (!result.emArea && result.erro) {
        toast.error(result.erro)
      }
    } catch (error: any) {
      toast.error('Erro ao calcular frete')
      setFreightCalculation(null)
    } finally {
      setCalculatingFreight(false)
    }
  }

  const totalWithFreight = cartTotal + (freightCalculation?.valor || 0)

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(itemId)
      return
    }

    // Atualização otimista
    const previousItems = [...cartItems]
    const updatedItems = cartItems.map((item) =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    )
    setCartItems(updatedItems)
    setCartTotal(calculateTotal(updatedItems))
    setUpdatingItems((prev) => new Set(prev).add(itemId))

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId)

      if (error) throw error
    } catch (error: any) {
      // Reverter em caso de erro
      setCartItems(previousItems)
      setCartTotal(calculateTotal(previousItems))
      toast.error('Erro ao atualizar quantidade')
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }

  const removeFromCart = async (itemId: string) => {
    // Atualização otimista
    const previousItems = [...cartItems]
    const updatedItems = cartItems.filter((item) => item.id !== itemId)
    setCartItems(updatedItems)
    setCartTotal(calculateTotal(updatedItems))
    setUpdatingItems((prev) => new Set(prev).add(itemId))

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error
      toast.success('Item removido do carrinho')
    } catch (error: any) {
      // Reverter em caso de erro
      setCartItems(previousItems)
      setCartTotal(calculateTotal(previousItems))
      toast.error('Erro ao remover item')
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }

  const finalizeOrder = async () => {
    if (cartItems.length === 0) {
      toast.error('Seu carrinho está vazio')
      return
    }
  
    if (!userProfile?.address) {
      toast.error('Por favor, adicione um endereço no seu perfil antes de finalizar o pedido')
      return
    }

    // Validar CEP e frete
    if (!userProfile?.cep) {
      toast.error('Por favor, adicione seu CEP no perfil antes de finalizar o pedido')
      return
    }

    const cleanCEP = userProfile.cep.replace(/\D/g, '')
    if (cleanCEP.length !== 8) {
      toast.error('CEP inválido no perfil. Por favor, atualize seu CEP')
      return
    }

    // Validar se está dentro da área de entrega
    if (!freightCalculation) {
      toast.error('Não foi possível calcular o frete. Tente novamente.')
      return
    }

    if (!freightCalculation.emArea) {
      const distanciaMsg = freightCalculation.distancia 
        ? ` (distância: ${freightCalculation.distancia} km)` 
        : ''
      toast.error(`Fora da área de entrega${distanciaMsg}`)
      return
    }

    if (freightCalculation.valor === null || freightCalculation.valor === undefined) {
      toast.error('Não foi possível calcular o valor do frete')
      return
    }
  
    try {
      // Buscar o carrinho
      const { data: carts, error: cartsError } = await supabase
        .from('carts')
        .select('id, store_id')
        .eq('user_id', userProfile.id)
        .single()
  
      if (cartsError) throw cartsError
  
      // Gerar número do pedido (formato: PED-YYYYMMDD-HHMMSS-XXXX)
      const now = new Date()
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
      const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '')
      const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase()
      const orderNumber = `PED-${dateStr}-${timeStr}-${randomStr}`
  
      // Criar pedido
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userProfile.id,
          store_id: carts.store_id,
          order_number: orderNumber,
          status: 'pending',
          payment_status: 'pending',
          subtotal: cartTotal,
          total: totalWithFreight,
          delivery_address: userProfile.address,
          delivery_cep: userProfile.cep.replace(/\D/g, ''),
          freight_value: freightCalculation?.valor || 0,
        })
        .select()
        .single()
  
      if (orderError) throw orderError
  
      // Criar itens do pedido - INCLUINDO product_name
      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product?.name || 'Produto não encontrado',
        quantity: item.quantity,
        price: item.price_at_time,
      }))
  
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)
  
      if (itemsError) throw itemsError
  
      // Limpar carrinho
      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', carts.id)
  
      if (deleteError) throw deleteError
  
      toast.success('Pedido realizado com sucesso!')
      navigate('/orders')
    } catch (error: any) {
      console.error('Error finalizing order:', error)
      
      if (error.code === '42501') {
        toast.error('Erro de permissão. Por favor, contate o administrador.')
      } else if (error.message) {
        toast.error(error.message)
      } else {
        toast.error('Erro ao finalizar pedido')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <ShoppingCart className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Meu Carrinho</h1>
        </div>

        {cartItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ShoppingCart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-xl text-gray-600 mb-4">Seu carrinho está vazio</p>
              <Button onClick={() => navigate('/stores')}>
                Ver Lojas
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {item.product?.image_url && (
                        <img
                          src={item.product.image_url}
                          alt={item.product?.name || 'Produto'}
                          className="w-20 h-20 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{item.product?.name || 'Produto não encontrado'}</h3>
                        <p className="text-gray-600">
                          R$ {item.price_at_time.toFixed(2).replace('.', ',')} cada
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={updatingItems.has(item.id)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {updatingItems.has(item.id) ? (
                            <span className="animate-pulse">...</span>
                          ) : (
                            item.quantity
                          )}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={updatingItems.has(item.id)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="w-24 text-right">
                        <p className="font-semibold">
                          R$ {(item.price_at_time * item.quantity).toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.id)}
                        disabled={updatingItems.has(item.id)}
                      >
                        {updatingItems.has(item.id) ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                        ) : (
                          <Trash2 className="h-5 w-5 text-red-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Informações de Entrega */}
            {userProfile?.cep ? (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium">CEP de Entrega</span>
                    </div>
                    <p className="text-lg font-semibold">
                      {userProfile.cep.replace(/(\d{5})(\d{3})/, '$1-$2')}
                    </p>
                    {calculatingFreight && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Calculando frete...</span>
                      </div>
                    )}
                    {!calculatingFreight && freightCalculation && (
                      <div className="text-sm">
                        {freightCalculation.emArea ? (
                          <div className="text-green-600">
                            <p>✓ Área de entrega: {freightCalculation.distancia} km</p>
                          </div>
                        ) : (
                          <p className="text-red-600 font-semibold">
                            {freightCalculation.erro || 'Fora da área de entrega'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-600">
                      CEP não cadastrado no perfil
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/profile')}
                    >
                      Adicionar CEP no Perfil
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Resumo do Pedido */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-base">
                    <span>Subtotal dos produtos:</span>
                    <span className="font-medium">R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                  {freightCalculation?.emArea && freightCalculation.valor !== null && (
                    <div className="flex justify-between text-base">
                      <span className="font-medium">Frete</span>
                      <span className="font-medium">R$ {freightCalculation.valor.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  {!freightCalculation?.emArea && userProfile?.cep && (
                    <div className="flex justify-between text-base text-red-600">
                      <span>Frete</span>
                      <span>Não disponível</span>
                    </div>
                  )}
                  {!userProfile?.cep && (
                    <div className="flex justify-between text-base text-gray-400">
                      <span>Frete</span>
                      <span>CEP não cadastrado</span>
                    </div>
                  )}
                  {calculatingFreight && (
                    <div className="flex justify-between text-base text-gray-400">
                      <span>Frete</span>
                      <span>Calculando...</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t-2 border-gray-300">
                    <span className="text-xl font-semibold">Total:</span>
                    <span className="text-2xl font-bold">
                      R$ {totalWithFreight.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={finalizeOrder}
                  disabled={
                    !userProfile?.cep || 
                    !freightCalculation?.emArea || 
                    calculatingFreight ||
                    freightCalculation?.valor === null ||
                    freightCalculation?.valor === undefined
                  }
                >
                  {calculatingFreight 
                    ? 'Calculando frete...' 
                    : !userProfile?.cep
                    ? 'Adicione seu CEP no perfil'
                    : !freightCalculation?.emArea
                    ? 'Fora da área de entrega'
                    : 'Finalizar Pedido'
                  }
                </Button>
                {!freightCalculation?.emArea && userProfile?.cep && freightCalculation && (
                  <div className="mt-2 text-center space-y-1">
                    <p className="text-sm text-red-600 font-semibold">
                      Fora da área de entrega
                    </p>
                    {freightCalculation.distancia && (
                      <p className="text-xs text-gray-600">
                        Distância calculada: {freightCalculation.distancia} km
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      Não é possível finalizar o pedido fora da área de entrega cadastrada
                    </p>
                  </div>
                )}
                {!userProfile?.cep && (
                  <p className="text-sm text-amber-600 mt-2 text-center">
                    Adicione seu CEP no perfil para finalizar o pedido
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

