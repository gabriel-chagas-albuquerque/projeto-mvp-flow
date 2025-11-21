import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Edit2, Trash2 } from 'lucide-react'

interface Category {
  id: string
  name: string
  display_order: number
}

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category_id: string
  is_available: boolean
}

export default function AdminMenu() {
  const { userProfile } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    if (userProfile?.store_id) {
      loadData()
    }
  }, [userProfile])

  const loadData = async () => {
    try {
      const { data: cats, error: catsError } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', userProfile.store_id)
        .order('display_order')

      if (catsError) throw catsError
      setCategories(cats || [])

      const { data: prods, error: prodsError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', userProfile.store_id)
        .order('display_order')

      if (prodsError) throw prodsError
      setProducts(prods || [])
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const createCategory = async (name: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .insert({
          store_id: userProfile.store_id,
          name,
          display_order: categories.length,
        })

      if (error) throw error
      toast.success('Categoria criada!')
      loadData()
    } catch (error: any) {
      toast.error('Erro ao criar categoria')
    }
  }

  const createProduct = async (productData: any) => {
    try {
      const { error } = await supabase
        .from('products')
        .insert({
          store_id: userProfile.store_id,
          ...productData,
        })

      if (error) throw error
      toast.success('Produto criado!')
      loadData()
    } catch (error: any) {
      toast.error('Erro ao criar produto')
    }
  }

  const updateCategory = async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ name })
        .eq('id', id)

      if (error) throw error
      toast.success('Categoria atualizada!')
      loadData()
    } catch (error: any) {
      toast.error('Erro ao atualizar categoria')
    }
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria? Os produtos desta categoria não serão excluídos.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Categoria excluída!')
      loadData()
    } catch (error: any) {
      toast.error('Erro ao excluir categoria')
    }
  }

  const updateProduct = async (id: string, productData: any) => {
    try {
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id)

      if (error) throw error
      toast.success('Produto atualizado!')
      loadData()
    } catch (error: any) {
      toast.error('Erro ao atualizar produto')
    }
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Produto excluído!')
      loadData()
    } catch (error: any) {
      toast.error('Erro ao excluir produto')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Gerenciar Cardápio</h1>
          <div className="flex gap-4">
            <CreateCategoryDialog onCreate={createCategory} />
            <CreateProductDialog categories={categories} onCreate={createProduct} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Categorias</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={selectedCategory === null ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory(null)}
                >
                  Todas
                </Button>
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-1">
                    <Button
                      variant={selectedCategory === cat.id ? 'default' : 'ghost'}
                      className="flex-1 justify-start"
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      {cat.name}
                    </Button>
                    <EditCategoryDialog
                      category={cat}
                      onUpdate={updateCategory}
                      onDelete={deleteCategory}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Products List */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products
                .filter((p) => !selectedCategory || p.category_id === selectedCategory)
                .map((product) => (
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
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                      <p className="text-lg font-bold mb-2">
                        R$ {product.price.toFixed(2).replace('.', ',')}
                      </p>
                      {!product.image_url && (
                        <p className="text-xs text-gray-400 mb-2 italic">
                          Sem imagem
                        </p>
                      )}
                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const { error } = await supabase
                              .from('products')
                              .update({ is_available: !product.is_available })
                              .eq('id', product.id)
                            if (!error) {
                              toast.success('Status atualizado!')
                              loadData()
                            }
                          }}
                        >
                          {product.is_available ? 'Desativar' : 'Ativar'}
                        </Button>
                        <EditProductDialog
                          product={product}
                          categories={categories}
                          onUpdate={updateProduct}
                          onDelete={deleteProduct}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CreateCategoryDialog({ onCreate }: { onCreate: (name: string) => void }) {
  const [name, setName] = useState('')
  const [open, setOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate(name)
    setName('')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nova Categoria</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Categoria</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="category-name">Nome</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <Button type="submit">Criar</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CreateProductDialog({
  categories,
  onCreate,
}: {
  categories: Category[]
  onCreate: (data: any) => void
}) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    image_url: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate({
      ...formData,
      price: parseFloat(formData.price),
      category_id: formData.category_id || null,
    })
    setFormData({ name: '', description: '', price: '', category_id: '', image_url: '' })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Novo Produto</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Produto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="product-name">Nome</Label>
            <Input
              id="product-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="product-description">Descrição</Label>
            <Input
              id="product-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="product-price">Preço</Label>
            <Input
              id="product-price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="product-category">Categoria</Label>
            <select
              id="product-category"
              className="w-full p-2 border rounded"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            >
              <option value="">Sem categoria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="product-image">URL da Imagem</Label>
            <Input
              id="product-image"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            />
          </div>
          <Button type="submit">Criar</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditCategoryDialog({
  category,
  onUpdate,
  onDelete,
}: {
  category: Category
  onUpdate: (id: string, name: string) => void
  onDelete: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(category.name)

  useEffect(() => {
    setName(category.name)
  }, [category])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(category.id, name)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Categoria</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-category-name">Nome</Label>
            <Input
              id="edit-category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Salvar</Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                onDelete(category.id)
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

function EditProductDialog({
  product,
  categories,
  onUpdate,
  onDelete,
}: {
  product: Product
  categories: Category[]
  onUpdate: (id: string, data: any) => void
  onDelete: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description || '',
    price: product.price.toString(),
    category_id: product.category_id || '',
    image_url: product.image_url || '',
    is_available: product.is_available,
  })

  useEffect(() => {
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      category_id: product.category_id || '',
      image_url: product.image_url || '',
      is_available: product.is_available,
    })
  }, [product])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(product.id, {
      ...formData,
      price: parseFloat(formData.price),
      category_id: formData.category_id || null,
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Produto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-product-name">Nome</Label>
            <Input
              id="edit-product-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-product-description">Descrição</Label>
            <Input
              id="edit-product-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="edit-product-price">Preço</Label>
            <Input
              id="edit-product-price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-product-category">Categoria</Label>
            <select
              id="edit-product-category"
              className="w-full p-2 border rounded"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            >
              <option value="">Sem categoria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="edit-product-image">URL da Imagem</Label>
            <Input
              id="edit-product-image"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit-product-available"
              checked={formData.is_available}
              onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
              className="h-4 w-4"
            />
            <Label htmlFor="edit-product-available" className="cursor-pointer">
              Produto disponível
            </Label>
          </div>
          <div className="flex gap-2">
            <Button type="submit">Salvar</Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                onDelete(product.id)
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

