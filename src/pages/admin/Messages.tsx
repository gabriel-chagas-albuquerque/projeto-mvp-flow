import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface Message {
  id: string
  content: string
  sent_at: string
  to_user: {
    name: string
    email: string
  }
}

export default function AdminMessages() {
  const { userProfile } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (userProfile?.store_id) {
      loadMessages()
    }
  }, [userProfile, filter])

  const loadMessages = async () => {
    try {
      let query = supabase
        .from('messages')
        .select(`
          *,
          to_user:users!messages_to_user_id_fkey(name, email)
        `)
        .eq('store_id', userProfile.store_id)
        .order('sent_at', { ascending: false })

      // Aplicar filtros se necessário
      const { data, error } = await query

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Mensagens Enviadas</h1>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {messages.map((message) => (
            <Card key={message.id}>
              <CardHeader>
                <div className="flex justify-between">
                  <CardTitle>Para: {message.to_user?.name}</CardTitle>
                  <p className="text-sm text-gray-600">
                    {new Date(message.sent_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <p>{message.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

