import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Order {
  id: string
  order_number: string
  status: string
  payment_status: string
  total: number
  created_at: string
  store: {
    name: string
    phone: string
  }
  items: OrderItem[]
}

interface OrderItem {
  product_name: string
  quantity: number
  price: number
}

export default function CustomerOrders() {
  const { userProfile } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    if (userProfile?.id) {
      loadOrders()
    }
  }, [userProfile])

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          store:stores!orders_store_id_fkey(name, phone),
          items:order_items(*)
        `)
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error loading orders:', error)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-orange-100 text-orange-800',
      ready: 'bg-green-100 text-green-800',
      delivering: 'bg-purple-100 text-purple-800',
      delivered: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Meus Pedidos</h1>

        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Pedido {order.order_number}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {order.store?.name} - {order.store?.phone}
                    </p>
                    <p className="text-sm text-gray-600">
                      Data: {new Date(order.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                    <Badge
                      className={
                        order.payment_status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {order.payment_status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {order.items?.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.product_name}
                      </span>
                      <span>R$ {(item.quantity * Number(item.price)).toFixed(2).replace('.', ',')}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-4 border-t">
                  <p className="text-xl font-bold">
                    Total: R$ {Number(order.total).toFixed(2).replace('.', ',')}
                  </p>
                  <a
                    href={`https://wa.me/${order.store?.phone?.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline">Falar com a Loja</Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

