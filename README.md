# projeto-mvp-flow

# React + TypeScript + Vite

Sistema de cardápio digital para lanchonetes com delivery.

## Funcionalidades

### Para Administradores de Loja:
- Dashboard com KPIs de vendas
- Gerenciamento completo do cardápio (categorias e produtos)
- Gestão de pedidos com atualização de status
- Visualização e gerenciamento de clientes
- Configuração de raio de entrega com preços
- Envio de mensagens para clientes
- Configurações da loja (nome, logo, contatos)

### Para Clientes:
- Acesso ao cardápio público da loja via link único
- Carrinho de compras persistente
- Histórico de pedidos
- Perfil com informações pessoais
- Comunicação direta com a loja via WhatsApp

## Tecnologias

- **Frontend**: React + TypeScript + Vite
- **UI Components**: shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Roteamento**: React Router
- **Estado**: React Query
- **Estilização**: Tailwind CSS

## Configuração

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais do Supabase:
```
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

4. Execute o projeto:
```bash
npm run dev
```

## Estrutura do Banco de Dados

O banco de dados foi criado no Supabase com as seguintes tabelas:
- `stores` - Lojas
- `users` - Usuários (admins e clientes)
- `categories` - Categorias de produtos
- `products` - Produtos do cardápio
- `delivery_radius` - Raio de entrega
- `carts` - Carrinhos de compras
- `cart_items` - Itens do carrinho
- `orders` - Pedidos
- `order_items` - Itens dos pedidos
- `messages` - Mensagens do admin para clientes

## Rotas

### Públicas:
- `/store/:slug` - Cardápio público da loja
- `/login` - Login
- `/register` - Cadastro

### Admin:
- `/admin/dashboard` - Dashboard com KPIs
- `/admin/menu` - Gerenciar cardápio
- `/admin/orders` - Gerenciar pedidos
- `/admin/customers` - Gerenciar clientes
- `/admin/delivery` - Configurar entrega
- `/admin/messages` - Mensagens enviadas
- `/admin/settings` - Configurações da loja

### Cliente:
- `/profile` - Perfil e carrinho
- `/orders` - Histórico de pedidos

## Próximos Passos

- [ ] Integração com gateway de pagamento
- [ ] Sistema de notificações em tempo real
- [ ] Cálculo automático de distância para entrega
- [ ] Upload de imagens para produtos e logos
- [ ] Sistema de avaliações e comentários
- [ ] Relatórios avançados
