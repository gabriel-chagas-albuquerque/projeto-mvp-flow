import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'

interface Store {
  id: string
  name: string
  logo_url: string | null
  slug: string
}

interface Category {
  id: string
  name: string
  products: Product[]
}

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category_id: string
}

export default function MenuPage() {
  const { slug } = useParams()
  const { user } = useAuth()
  const [store, setStore] = useState<Store | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (slug) {
      loadStoreData(slug)
    }
  }, [slug])

  const loadStoreData = async (storeSlug: string) => {
    try {
      // Carregar loja
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', storeSlug)
        .single()

      if (storeError) throw storeError
      setStore(storeData)

      // Carregar categorias e produtos
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', storeData.id)
        .eq('is_active', true)
        .order('display_order')

      if (categoriesError) throw categoriesError

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeData.id)
        .eq('is_available', true)
        .order('display_order')

      if (productsError) throw productsError

      // Agrupar produtos por categoria
      const categoriesWithProducts = categoriesData.map((cat) => ({
        ...cat,
        products: productsData.filter((p) => p.category_id === cat.id),
      }))

      setCategories(categoriesWithProducts)
    } catch (error: any) {
      toast.error('Erro ao carregar cardápio')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async (product: Product) => {
    if (!user) {
      toast.error('Você precisa fazer login para adicionar itens ao carrinho')
      return
    }

    try {
      // Buscar ou criar carrinho
      const { data: cart, error: cartError } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .eq('store_id', store!.id)
        .single()

      let cartId = cart?.id

      if (!cart) {
        const { data: newCart, error: newCartError } = await supabase
          .from('carts')
          .insert({ user_id: user.id, store_id: store!.id })
          .select('id')
          .single()

        if (newCartError) throw newCartError
        cartId = newCart.id
      }

      // Adicionar item ao carrinho
      const { error: itemError } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cartId,
          product_id: product.id,
          quantity: 1,
          price_at_time: product.price,
        })

      if (itemError) throw itemError
      toast.success('Item adicionado ao carrinho!')
    } catch (error: any) {
      toast.error('Erro ao adicionar ao carrinho')
      console.error(error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Loja não encontrada</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {store.logo_url && (
              <img src={store.logo_url} alt={store.name} className="h-12 w-12 rounded" />
            )}
            <h1 className="text-2xl font-bold">{store.name}</h1>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/profile">
                <Button variant="outline">Meu Perfil</Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button>Entrar</Button>
              </Link>
            )}
            <Link to="/cart">
              <Button>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Carrinho
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Menu Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {categories.map((category) => (
          <div key={category.id} className="mb-12">
            <h2 className="text-3xl font-bold mb-6">{category.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.products.map((product) => (
                <Card key={product.id}>
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  )}
                  <CardHeader>
                    <CardTitle>{product.name}</CardTitle>
                    <CardDescription>{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge className="text-lg">
                        R$ {product.price.toFixed(2).replace('.', ',')}
                      </Badge>
                      <Button onClick={() => addToCart(product)} size="sm">
                        Adicionar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}

