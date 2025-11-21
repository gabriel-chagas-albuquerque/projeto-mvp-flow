import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  whatsapp: string
  total_orders: number
  total_spent: number
  last_order_date: string
}

export default function AdminCustomers() {
  const { userProfile } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  useEffect(() => {
    if (userProfile?.store_id) {
      loadCustomers()
    }
  }, [userProfile])

  const loadCustomers = async () => {
    try {
      // Usar a view de KPIs de clientes
      const { data, error } = await supabase
        .from('store_customer_kpis')
        .select('*')
        .eq('store_id', userProfile.store_id)
        .order('total_spent', { ascending: false })

      if (error) throw error
      setCustomers(data || [])
    } catch (error) {
      console.error('Error loading customers:', error)
    }
  }

  const sendMessage = async (customerId: string, message: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          store_id: userProfile.store_id,
          from_user_id: userProfile.id,
          to_user_id: customerId,
          content: message,
        })

      if (error) throw error
      toast.success('Mensagem enviada!')
    } catch (error: any) {
      toast.error('Erro ao enviar mensagem')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Clientes</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map((customer) => (
            <Card key={customer.id}>
              <CardHeader>
                <CardTitle>{customer.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-gray-600">{customer.email}</p>
                <p className="text-sm text-gray-600">Telefone: {customer.phone}</p>
                <p className="text-sm text-gray-600">WhatsApp: {customer.whatsapp}</p>
                <div className="pt-2 border-t">
                  <p className="text-sm">
                    <strong>Pedidos:</strong> {customer.total_orders}
                  </p>
                  <p className="text-sm">
                    <strong>Total gasto:</strong> R${' '}
                    {Number(customer.total_spent).toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-sm">
                    <strong>Último pedido:</strong>{' '}
                    {customer.last_order_date
                      ? new Date(customer.last_order_date).toLocaleDateString('pt-BR')
                      : 'N/A'}
                  </p>
                </div>
                <div className="flex gap-2 pt-2">
                  <SendMessageDialog
                    customer={customer}
                    onSend={(message) => sendMessage(customer.id, message)}
                  />
                  <a
                    href={`https://wa.me/${customer.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm">
                      WhatsApp
                    </Button>
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

function SendMessageDialog({
  customer,
  onSend,
}: {
  customer: Customer
  onSend: (message: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSend(message)
    setMessage('')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Enviar Mensagem</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar Mensagem para {customer.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Mensagem</label>
            <textarea
              className="w-full p-2 border rounded"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>
          <Button type="submit">Enviar</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

