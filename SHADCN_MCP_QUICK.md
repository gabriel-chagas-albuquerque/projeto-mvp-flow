# ⚡ shadcn MCP - Referência Ultra-Rápida

## 🚀 Setup (1 comando)

```bash
# Cursor
npx shadcn@latest mcp init --client cursor

# Claude Code  
npx shadcn@latest mcp init --client claude

# VS Code
npx shadcn@latest mcp init --client vscode

# Codex
npx shadcn@latest mcp init --client codex
```

---

## 📁 Configuração Mínima

### Cursor: `.cursor/mcp.json`
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

### Registries: `components.json`
```json
{
  "registries": {
    "@acme": "https://acme.com/r/{name}.json"
  }
}
```

### Auth: `.env.local`
```bash
REGISTRY_TOKEN=your_token_here
```

---

## 💬 Prompts Essenciais

```
Show me all available components in the shadcn registry
Add the button component to my project
Create a login form using shadcn components
Install button, dialog and card components
Show me components from @acme registry
```

---

## 🔧 Troubleshooting

| Problema | Solução |
|----------|---------|
| MCP não responde | Reiniciar cliente MCP |
| No tools or prompts | `npx clear-npx-cache` |
| Registry access | Verificar `.env.local` |
| Installation fails | Verificar `components.json` |

---

## 📚 Links

- MCP: https://modelcontextprotocol.io
- Registry Docs: https://ui.shadcn.com/docs/registry

