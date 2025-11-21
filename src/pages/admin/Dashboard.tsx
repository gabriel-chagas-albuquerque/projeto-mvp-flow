import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function AdminDashboard() {
  const { userProfile } = useAuth()
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    averageOrderValue: 0,
  })
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    if (userProfile?.store_id) {
      loadDashboardData()
    }
  }, [userProfile])

  const loadDashboardData = async () => {
    try {
      // Estatísticas gerais
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', userProfile.store_id)
        .eq('payment_status', 'paid')

      if (ordersError) throw ordersError

      const totalOrders = orders?.length || 0
      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0
      const totalCustomers = new Set(orders?.map((o) => o.user_id)).size
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      setStats({
        totalOrders,
        totalRevenue,
        totalCustomers,
        averageOrderValue,
      })

      // Dados do gráfico (últimos 7 dias)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - i))
        return date.toISOString().split('T')[0]
      })

      const chartData = last7Days.map((date) => {
        const dayOrders = orders?.filter(
          (o) => o.created_at.split('T')[0] === date
        ) || []
        return {
          date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          vendas: dayOrders.reduce((sum, o) => sum + Number(o.total), 0),
        }
      })

      setChartData(chartData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Total de Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalOrders}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Receita Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                R$ {stats.totalRevenue.toFixed(2).replace('.', ',')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total de Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalCustomers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Ticket Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                R$ {stats.averageOrderValue.toFixed(2).replace('.', ',')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas dos Últimos 7 Dias</CardTitle>
            <CardDescription>Receita por dia</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="vendas" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

