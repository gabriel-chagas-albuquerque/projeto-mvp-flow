# Guia de Referência Rápida - shadcn MCP Server

## 🚀 Inicialização Rápida

### Cursor (Recomendado)
```bash
npx shadcn@latest mcp init --client cursor
```
Depois: **Cursor Settings** → **Enable MCP server** para shadcn

### Claude Code
```bash
npx shadcn@latest mcp init --client claude
```
Depois: **Restart Claude Code** e use `/mcp` para debug

### VS Code
```bash
npx shadcn@latest mcp init --client vscode
```
Depois: Abra `.vscode/mcp.json` e clique em **Start**

### Codex
```bash
npx shadcn@latest mcp init --client codex
```
Depois: Adicione manualmente em `~/.codex/config.toml`

---

## 📁 Arquivos de Configuração

### `.cursor/mcp.json` (Cursor)
```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```

### `.mcp.json` (Claude Code)
```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```

### `.vscode/mcp.json` (VS Code)
```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```

### `~/.codex/config.toml` (Codex)
```toml
[mcp_servers.shadcn]
command = "npx"
args = ["shadcn@latest", "mcp"]
```

---

## ⚙️ Configuração de Registries

### `components.json` - Registries Básicos
```json
{
  "registries": {
    "@acme": "https://acme.com/r/{name}.json"
  }
}
```

### `components.json` - Registries com Autenticação
```json
{
  "registries": {
    "@acme": "https://registry.acme.com/{name}.json",
    "@internal": {
      "url": "https://internal.company.com/{name}.json",
      "headers": {
        "Authorization": "Bearer ${REGISTRY_TOKEN}"
      }
    }
  }
}
```

### `.env.local` - Variáveis de Ambiente
```bash
REGISTRY_TOKEN=your_token_here
API_KEY=your_api_key_here
```

---

## 💬 Prompts Úteis

### Navegar e Buscar
- `Show me all available components in the shadcn registry`
- `Find me a login form from the shadcn registry`
- `List all components from acme registry`

### Instalar Componentes
- `Add the button component to my project`
- `Install button, dialog and card components`
- `Create a login form using shadcn components`
- `Build a landing page using hero, features and testimonials sections`

### Trabalhar com Namespaces
- `Show me components from @acme registry`
- `Install @internal/auth-form`
- `Build me a landing page using components from the acme registry`

### Exemplos Práticos
- `Create a contact form using components from the shadcn registry`
- `Add a navigation bar with dropdown menu`
- `Build a dashboard with sidebar, header and main content area`

---

## 🔧 Troubleshooting

### MCP Não Responde
1. ✅ Verificar configuração no arquivo MCP correto
2. ✅ Reiniciar o cliente MCP
3. ✅ Verificar se `shadcn` está instalado: `npx shadcn@latest --version`
4. ✅ Testar conexão com registries

### Problemas de Acesso ao Registry
1. ✅ Verificar URLs em `components.json`
2. ✅ Verificar variáveis de ambiente em `.env.local`
3. ✅ Testar acesso ao registry manualmente
4. ✅ Verificar sintaxe de namespace (`@namespace/component`)

### Falhas na Instalação
1. ✅ Verificar se `components.json` existe e está válido
2. ✅ Verificar se diretórios de destino existem
3. ✅ Verificar permissões de escrita
4. ✅ Verificar dependências instaladas

### "No tools or prompts"
1. ✅ Limpar cache: `npx clear-npx-cache`
2. ✅ Re-habilitar MCP server no cliente
3. ✅ Verificar logs: **View → Output → MCP: project-***

---

## 📚 Recursos e Links

- **Documentação MCP**: https://modelcontextprotocol.io
- **Documentação Registry**: https://ui.shadcn.com/docs/registry
- **Namespaces**: https://ui.shadcn.com/docs/registry/namespace
- **Autenticação**: https://ui.shadcn.com/docs/registry/authentication

---

## 🎯 Checklist de Configuração

### Para Cursor
- [ ] Executar `npx shadcn@latest mcp init --client cursor`
- [ ] Verificar criação de `.cursor/mcp.json`
- [ ] Abrir **Cursor Settings**
- [ ] Habilitar MCP server para shadcn
- [ ] Verificar ponto verde ao lado do servidor
- [ ] Testar com prompt: "Show me all available components"

### Para Claude Code
- [ ] Executar `npx shadcn@latest mcp init --client claude`
- [ ] Verificar criação de `.mcp.json`
- [ ] Reiniciar Claude Code
- [ ] Executar `/mcp` para verificar conexão
- [ ] Verificar status "Connected"
- [ ] Testar com prompt: "Add button component"

### Para VS Code
- [ ] Executar `npx shadcn@latest mcp init --client vscode`
- [ ] Verificar criação de `.vscode/mcp.json`
- [ ] Abrir `.vscode/mcp.json`
- [ ] Clicar em **Start** ao lado do servidor shadcn
- [ ] Testar com GitHub Copilot

### Para Codex
- [ ] Executar `npx shadcn@latest mcp init --client codex`
- [ ] Adicionar configuração manualmente em `~/.codex/config.toml`
- [ ] Reiniciar Codex
- [ ] Testar com prompts

---

## 🔑 Comandos CLI Úteis

```bash
# Inicializar MCP para Cursor
npx shadcn@latest mcp init --client cursor

# Inicializar MCP para Claude
npx shadcn@latest mcp init --client claude

# Inicializar MCP para VS Code
npx shadcn@latest mcp init --client vscode

# Inicializar MCP para Codex
npx shadcn@latest mcp init --client codex

# Verificar versão do shadcn
npx shadcn@latest --version

# Limpar cache do npx
npx clear-npx-cache
```

---

## 📝 Notas Importantes

- ⚠️ **shadcn/ui registry** não precisa de configuração adicional
- ⚠️ **Codex** requer configuração manual em `~/.codex/config.toml`
- ⚠️ Sempre reinicie o cliente MCP após mudanças de configuração
- ⚠️ Variáveis de ambiente devem estar em `.env.local`
- ⚠️ Namespaces usam sintaxe: `@namespace/component-name`

---

## 🎨 Exemplos de Registries

### Registry Público
```json
{
  "registries": {
    "@acme": "https://acme.com/r/{name}.json"
  }
}
```

### Registry Privado com Token
```json
{
  "registries": {
    "@internal": {
      "url": "https://internal.company.com/{name}.json",
      "headers": {
        "Authorization": "Bearer ${REGISTRY_TOKEN}"
      }
    }
  }
}
```

### Múltiplos Registries
```json
{
  "registries": {
    "@acme": "https://acme.com/r/{name}.json",
    "@internal": {
      "url": "https://internal.company.com/{name}.json",
      "headers": {
        "Authorization": "Bearer ${REGISTRY_TOKEN}"
      }
    },
    "@third-party": "https://third-party.com/registry/{name}.json"
  }
}
```

---

**Última atualização**: Baseado na documentação oficial do shadcn MCP Server

